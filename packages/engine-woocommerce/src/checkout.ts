import { storeApiFetch, type StoreAddress } from './cart';
import { globalAttemptManager, CheckoutAttemptManager, attemptPayloadHash, BUSY_ATTEMPT_ERROR } from './checkout-attempts';
import { restFetch } from './rest';

export interface StoreCheckoutInput {
  billing_address: StoreAddress;
  shipping_address: StoreAddress;
  payment_method?: string;
  customer_note?: string;
  payment_data?: Array<{ key: string; value: string }>;
}

export interface StoreCheckoutResult {
  ok: boolean;
  orderId: string | number;
  orderKey: string;
  status: string;
  customerId: number;
  paymentStatus: string;
  /**
   * The contact the order was actually placed with. On an idempotent replay this
   * is the address stored at first submission, not whatever the retry supplied,
   * so a replay cannot mint an access grant for a different email.
   */
  email?: string;
  raw?: unknown;
}

export async function submitStoreCheckout(
  cartToken: string,
  input: StoreCheckoutInput,
  attemptKey?: string
): Promise<StoreCheckoutResult> {
  const method = input.payment_method || 'cod';
  const note = input.customer_note || '';

  const res = await storeApiFetch('/checkout', {
    method: 'POST',
    cartToken,
    body: {
      billing_address: input.billing_address,
      shipping_address: input.shipping_address,
      customer_note: attemptKey ? `${note}${note ? '\n' : ''}${correlationMarker(attemptKey)}` : note,
      payment_method: method,
      payment_data: input.payment_data || [],
    },
  });

  const data = res.data as Record<string, unknown> | null;
  const orderId = (data?.order_id ?? data?.id) as string | number;
  if (!orderId) {
    throw new Error('Store API checkout completed without returning an order ID.');
  }

  const orderKey = String(data?.order_key || '');
  const status = String(data?.status || 'processing');
  const customerId = typeof data?.customer_id === 'number' ? data.customer_id : 0;
  const paymentResult = data?.payment_result as Record<string, unknown> | undefined;
  const paymentStatus = String(paymentResult?.payment_status || 'success');
  const contactEmail = billingEmail(input);

  return {
    ok: true,
    orderId,
    orderKey,
    status,
    customerId,
    paymentStatus,
    ...(contactEmail ? { email: contactEmail } : {}),
    raw: data,
  };
}

/**
 * The contact the order was placed with, stored on the attempt so a replay
 * never rebuilds an access grant from a later request's supplied email.
 */
function billingEmail(input: StoreCheckoutInput): string | undefined {
  const email = input.billing_address?.email;
  return typeof email === 'string' && email.trim() ? email : undefined;
}

export interface OrderCorrelation {
  orderId: string | number;
  orderKey?: string | undefined;
  email?: string | undefined;
}

export interface OrderLookupContext {
  ownerKey: string;
  email?: string | undefined;
}

/**
 * Finds the authoritative WooCommerce order created by a previous submission
 * of this attempt. Return null when none exists; throw when the outcome
 * cannot be determined. Never invent an order.
 */
export type OrderLookup = (attemptKey: string, ctx: OrderLookupContext) => Promise<OrderCorrelation | null>;

export interface IdempotentCheckoutOptions {
  lookupOrder?: OrderLookup;
  activeLockTimeoutMs?: number;
}

/** Correlation marker embedded in the order's customer note at submission. */
export function correlationMarker(attemptKey: string): string {
  return `[ecomos-attempt:${attemptKey.replace(/[\[\]\r\n]/g, '')}]`;
}

/**
 * Best-effort WooCommerce REST lookup for an order carrying this attempt's
 * correlation marker. The marker is the only exact correlator; an optional
 * email match guards against cross-customer collisions. Returns null when no
 * order matches. Inject a fake in tests; wire the result into
 * executeIdempotentCheckout's lookupOrder option.
 */
export async function findOrderByAttemptCorrelation(
  attemptKey: string,
  opts: { email?: string | undefined; perPage?: number | undefined } = {}
): Promise<OrderCorrelation | null> {
  if (!attemptKey) throw new Error('Invalid checkout attempt key.');
  const marker = correlationMarker(attemptKey);
  const perPage = Math.min(Math.max(opts.perPage ?? 100, 1), 100);
  const rawOrders = (await restFetch(`/orders?per_page=${perPage}&orderby=date&order=desc`)) as unknown;
  if (!Array.isArray(rawOrders)) {
    throw new Error('Malformed WooCommerce orders response during correlation lookup.');
  }
  const orders = rawOrders as Array<Record<string, unknown>>;
  for (const order of orders) {
    if (!order || typeof order !== 'object') continue;
    const note = typeof order.customer_note === 'string' ? order.customer_note : '';
    if (!note.includes(marker)) continue;
    if (opts.email) {
      const billing = order.billing as Record<string, unknown> | undefined;
      const orderEmail = typeof billing?.email === 'string' ? billing.email : '';
      if (orderEmail.toLowerCase() !== opts.email.toLowerCase()) continue;
    }
    if (order.id === undefined || order.id === null) continue;
    const key = typeof order.order_key === 'string' ? order.order_key : typeof order.key === 'string' ? order.key : '';
    if (!key) continue;
    return {
      orderId: order.id as string | number,
      orderKey: key,
      ...(opts.email ? { email: opts.email } : {}),
    };
  }
  return null;
}

export async function executeIdempotentCheckout(
  attemptKey: string,
  cartToken: string,
  input: StoreCheckoutInput,
  manager: CheckoutAttemptManager = globalAttemptManager,
  opts: IdempotentCheckoutOptions = {}
): Promise<StoreCheckoutResult> {
  const payloadHash = attemptPayloadHash(cartToken, input);
  let check = await manager.startAttempt(attemptKey, cartToken, payloadHash);

  if (!check.ok && check.status === 'PENDING' && opts.lookupOrder) {
    // A previous submission may have created the WooCommerce order while its
    // response was lost. Never retry blindly: reconcile the authoritative
    // order first, and only submit when none exists.
    let found: OrderCorrelation | null;
    const contact = billingEmail(input);
    try {
      found = await opts.lookupOrder(
        attemptKey,
        contact ? { ownerKey: cartToken, email: contact } : { ownerKey: cartToken }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Order recovery lookup failed.';
      throw new Error(`Checkout outcome is unknown and order recovery failed: ${message} No order was confirmed.`);
    }
    if (found) {
      const record = await manager.reconcileFound(
        attemptKey,
        cartToken,
        found.orderId,
        found.orderKey,
        found.email ?? billingEmail(input)
      );
      return {
        ok: true,
        orderId: record.orderId!,
        orderKey: record.orderKey ?? '',
        status: 'processing',
        customerId: 0,
        paymentStatus: 'success',
        ...(record.email ? { email: record.email } : {}),
      };
    }

    // Directive item 3: On PENDING state, a lookup miss must not supersede an active purchase owner!
    // If the attempt is still within its active processing window, an active worker
    // is currently executing the submission. Fail closed with busy error.
    const existing = await manager.getAttempt(attemptKey);
    const activeLockMs = opts.activeLockTimeoutMs ?? 15000;
    const age = existing ? Date.now() - existing.updatedAt : 0;
    if (existing && age < activeLockMs) {
      throw new Error(check.error || BUSY_ATTEMPT_ERROR);
    }

    await manager.markFailedRetryable(
      attemptKey,
      cartToken,
      'Earlier submission left no confirmed order; retrying once.'
    );
    check = await manager.startAttempt(attemptKey, cartToken, payloadHash);
  }

  if (!check.ok) {
    throw new Error(check.error || 'A checkout attempt for this submission is currently processing.');
  }

  if (!check.isNew) {
    return {
      ok: true,
      orderId: check.orderId,
      orderKey: check.orderKey || '',
      status: 'processing',
      customerId: 0,
      paymentStatus: 'success',
      ...(check.email ? { email: check.email } : {}),
    };
  }

  try {
    const result = await submitStoreCheckout(cartToken, input, attemptKey);
    try {
      await manager.confirmAttempt(
        attemptKey,
        result.orderId,
        result.orderKey,
        cartToken,
        billingEmail(input)
      );
      return result;
    } catch {
      // Local confirmation error following successful store checkout.
      // Order exists in WooCommerce; return confirmed result.
      return result;
    }
  } catch (err: unknown) {
    // Directive item 2: A lost response or failed local confirmation can follow
    // successful Woo order creation. Preserve unknown outcomes and reconcile before
    // permitting another POST.
    if (opts.lookupOrder) {
      try {
        const contact = billingEmail(input);
        const found = await opts.lookupOrder(
          attemptKey,
          contact ? { ownerKey: cartToken, email: contact } : { ownerKey: cartToken }
        );
        if (found) {
          const record = await manager.reconcileFound(
            attemptKey,
            cartToken,
            found.orderId,
            found.orderKey,
            found.email ?? contact
          );
          return {
            ok: true,
            orderId: record.orderId!,
            orderKey: record.orderKey ?? '',
            status: 'processing',
            customerId: 0,
            paymentStatus: 'success',
            ...(record.email ? { email: record.email } : {}),
          };
        }
      } catch {
        // Recovery lookup threw: outcome is truly UNKNOWN.
        // DO NOT mark attempt FAILED (which would allow an immediate retry to POST again).
        const msg = err instanceof Error ? err.message : 'Checkout submission failed.';
        throw new Error(
          `Checkout outcome is unknown: ${msg}. Order recovery could not verify outcome; refusing to retry blindly.`
        );
      }
    }
    const message = err instanceof Error ? err.message : 'Checkout submission failed.';
    await manager.failAttempt(attemptKey, message, cartToken);
    throw err;
  }
}

