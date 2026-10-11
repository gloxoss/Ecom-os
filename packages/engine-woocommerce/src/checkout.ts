import { storeApiFetch, type StoreAddress } from './cart';
import { globalAttemptManager, CheckoutAttemptManager } from './checkout-attempts';

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
  input: StoreCheckoutInput
): Promise<StoreCheckoutResult> {
  const method = input.payment_method || 'cod';

  const res = await storeApiFetch('/checkout', {
    method: 'POST',
    cartToken,
    body: {
      billing_address: input.billing_address,
      shipping_address: input.shipping_address,
      customer_note: input.customer_note || '',
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

  return {
    ok: true,
    orderId,
    orderKey,
    status,
    customerId,
    paymentStatus,
    email: billingEmail(input),
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

export async function executeIdempotentCheckout(
  attemptKey: string,
  cartToken: string,
  input: StoreCheckoutInput,
  manager: CheckoutAttemptManager = globalAttemptManager
): Promise<StoreCheckoutResult> {
  const check = await manager.startAttempt(attemptKey, cartToken);

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
      email: check.email,
    };
  }

  try {
    const result = await submitStoreCheckout(cartToken, input);
    await manager.confirmAttempt(
      attemptKey,
      result.orderId,
      result.orderKey,
      cartToken,
      billingEmail(input)
    );
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout submission failed.';
    await manager.failAttempt(attemptKey, message, cartToken);
    throw err;
  }
}

