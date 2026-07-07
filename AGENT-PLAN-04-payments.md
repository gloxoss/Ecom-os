# AGENT-PLAN-04 — Section 09: Multi-Payment Addon (COD · Stripe · CMI)
> **Read this document fully before touching any code.**
> Sprint: Section 09 · Risk: RED · Parallel with Plans 03 and 05.
> This is the highest-risk section in the entire project. Security rules are NON-NEGOTIABLE.

---

## Skills Active
- `ecom-payment-provider` — PaymentGateway interface, webhook verification, HMAC
- `ecom-addon-authoring` — addon contract, register/disable
- `ecom-engine-adapter` — engine method wiring
- `/ponytail` — minimum code, no speculative abstractions
- `/karpathy-guidelines` — correctness over cleverness, test ALL edge cases
- `/nonstop` — keep going until all acceptance criteria pass

---

## What Already Exists — DO NOT REDO

- `packages/ecom-engine/src/interface.ts` — `EcomEngine` including `markOrderPaid` ✅
- `packages/engine-woocommerce/src/client.ts` — `initCheckout`, `placeOrder` with price integrity ✅
- `packages/engine-woocommerce/src/orders.ts` — `createOrderRest` ✅
- `apps/storefront/src/app/(checkout)/checkout/page.tsx` — server action with price integrity ✅
- `apps/storefront/src/features/checkout/ui/checkout-form.tsx` — COD hardcoded radio ✅
- `plugins/cod-payment/index.ts` — empty stub (you will REPLACE this with real implementation)
- `plugins/stripe-payment/index.ts` — empty stub (you will REPLACE this with real implementation)
- `apps/storefront/src/app/api/revalidate/route.ts` — ISR endpoint (DO NOT TOUCH)
- `apps/storefront/src/features/account/server/auth-actions.ts` — auth ✅

---

## Security Laws — ANY VIOLATION = IMMEDIATE FAILURE

1. **NEVER store card data.** Use CMI hosted page (redirect) and Stripe Elements only.
2. **ALWAYS verify webhook signatures FIRST**, before ANY state change.
3. **Invalid/missing signature → HTTP 400** + log `{ signature_status: 'invalid' }`. Never 500, never 200.
4. **Replay protection** — every webhook is checked against an in-memory dedup set (keyed on event ID). A DB-backed log is added in Section 10; use a `Set<string>` bounded to last 1000 entries for v1.
5. **All money in minor units.** Convert at adapter boundary. No floats anywhere.
6. **Server-side price from engine.** The checkout server action already enforces this. Payment amount = `order.total.amount_minor` from `placeOrder`. Never use client-supplied totals.
7. **CMI callback amount must match order total.** If callback amount ≠ order total → reject, log, 400.
8. **No `any` types on security-critical paths** (hash verification, webhook parsing). Use typed response shapes.
9. **No `console.log`.** Use `src/lib/logger.ts` (created in Plan A; if Plan A hasn't run yet, create it here with the same stub from Plan A Task 8).

---

## Architecture Laws

1. Only `apps/storefront/src/lib/engine.ts` may import engine adapters.
2. `'use client'` only for hooks/events/browser APIs. Payment forms use Server Actions.
3. No cross-addon imports — multi-payment cannot import from i18n.
4. Every addon exports `register(ctx: AddonContext)` + `disable(): void`.
5. Checkout page already uses a Server Action with price integrity — **add payment to this flow, don't replace it**.
6. The COD checkout already works. This section FORMALIZES it via the PaymentGateway interface and adds Stripe + CMI on top.

---

## Codebase Context

### Key files to READ before coding

```
packages/ecom-engine/src/interface.ts         — EcomEngine (markOrderPaid signature)
packages/ecom-engine/src/types.ts             — Order, Money types
packages/engine-woocommerce/src/orders.ts     — createOrderRest
packages/engine-woocommerce/src/rest.ts       — restFetch helper
apps/storefront/src/app/(checkout)/checkout/page.tsx  — existing server action
apps/storefront/src/features/checkout/ui/checkout-form.tsx — existing form
apps/storefront/src/lib/engine.ts             — getEngine()
apps/storefront/src/app/layout.tsx            — root layout
scripts/generate-addons.ts                    — addon resolver
plugins/cod-payment/index.ts                  — STUB to replace
plugins/stripe-payment/index.ts               — STUB to replace
.env.example                                  — add new vars here
```

### How checkout currently works
1. `CheckoutForm` sends cart items (IDs+slugs+quantities, NO prices) + form data to server action
2. Server action calls `engine.initCheckout(cartId, input, clientItems)` → stores `_input` + `_items` in session
3. Server action calls `engine.placeOrder(session)` → WooCommerceEngine re-fetches prices, calls `createOrderRest`
4. On success → redirect to `/checkout/success?orderId=X`
5. **YOU MUST SLOT PAYMENT INTO STEP 3.5** — after `placeOrder` returns the order, route to payment gateway

### WooCommerce order status flow (for reference)
- `pending` → waiting for payment
- `on-hold` → payment pending confirmation (COD)
- `processing` → payment received (Stripe/CMI)
- `completed` → fulfilled

---

## Tasks

### Task 1 — PaymentGateway interface

**File:** `packages/addons-multi-payment/src/interface.ts`

```typescript
import type { Order } from '@ecom-os/engine';

export type PaymentInitResult =
  | { type: 'redirect'; url: string }     // CMI: redirect to hosted page
  | { type: 'client_secret'; secret: string; publicKey: string }  // Stripe: Elements
  | { type: 'pending'; message: string }; // COD: no payment UI needed

export type PaymentConfirmResult = {
  success: boolean;
  orderId: string;
  transactionId?: string;
};

export type RefundResult = {
  success: boolean;
  refundId?: string;
};

export interface PaymentGateway {
  id: string;
  name: string;
  initiate(order: Order): Promise<PaymentInitResult>;
  confirm(callbackData: unknown): Promise<PaymentConfirmResult>;
  refund(orderId: string, amountMinor: number): Promise<RefundResult>;
}
```

### Task 2 — Provider registry

**File:** `packages/addons-multi-payment/src/registry.ts`

```typescript
import type { PaymentGateway } from './interface';

const registry = new Map<string, PaymentGateway>();

export function registerGateway(gateway: PaymentGateway): void {
  registry.set(gateway.id, gateway);
}

export function getGateway(id: string): PaymentGateway | undefined {
  return registry.get(id);
}

export function getEnabledGateways(): PaymentGateway[] {
  const enabled = (process.env.PAYMENT_PROVIDERS ?? 'cod').split(',').filter(Boolean);
  return enabled.map(id => registry.get(id)).filter((g): g is PaymentGateway => !!g);
}
```

### Task 3 — Webhook replay protection (in-memory, v1)

**File:** `packages/addons-multi-payment/src/dedup.ts`

```typescript
// ponytail: in-memory dedup bounded to last 1000 events — Section 10 replaces with DB log
const MAX = 1000;
const seen: string[] = [];

export function isDuplicate(eventId: string): boolean {
  return seen.includes(eventId);
}

export function markSeen(eventId: string): void {
  if (seen.length >= MAX) seen.shift();
  seen.push(eventId);
}
```

### Task 4 — COD provider (formalize)

**File:** `packages/addons-multi-payment/src/providers/cod/provider.ts`

```typescript
import type { PaymentGateway, PaymentInitResult, PaymentConfirmResult, RefundResult } from '../../interface';
import type { Order } from '@ecom-os/engine';
import { notifyMerchantCod } from './notifications';

export const CodGateway: PaymentGateway = {
  id: 'cod',
  name: 'Cash on Delivery',

  async initiate(order: Order): Promise<PaymentInitResult> {
    await notifyMerchantCod(order);
    return { type: 'pending', message: 'Your order will be confirmed upon delivery.' };
  },

  async confirm(_callbackData: unknown): Promise<PaymentConfirmResult> {
    // COD has no callback — confirmation happens on delivery. Always returns success.
    return { success: true, orderId: 'cod-na' };
  },

  async refund(_orderId: string, _amountMinor: number): Promise<RefundResult> {
    // ponytail: COD refunds are manual. Formalize in v1.1.
    return { success: false };
  },
};
```

**File:** `packages/addons-multi-payment/src/providers/cod/notifications.ts`

```typescript
import type { Order } from '@ecom-os/engine';
import { logger } from '@/lib/logger';  // ponytail: import from storefront — replace with shared pkg in v1.1

// ponytail: real email/WhatsApp in Section 10. Structured log for now.
export async function notifyMerchantCod(order: Order): Promise<void> {
  const to = process.env.NOTIFICATION_EMAIL;
  logger.info('COD order placed', {
    orderId: order.id,
    total: order.total.amount_minor,
    currency: order.total.currency,
    notifyTarget: to ?? 'none',
  });
  // TODO Section 10: send email via Resend / WhatsApp via Twilio
}
```

> **Note:** The logger import `@/lib/logger` won't work from `packages/`. For now, inline a minimal logger in notifications.ts or pass a logger instance via dependency injection. Simplest approach: inline it.

Fix: instead of importing from storefront, inline or accept a log function:
```typescript
// ponytail: no shared logger package yet — inline minimal logging
function log(msg: string, data: Record<string, unknown>) {
  console.warn(JSON.stringify({ level: 'info', msg, ...data, ts: new Date().toISOString() }));
}

export async function notifyMerchantCod(order: Order): Promise<void> {
  log('COD order placed', {
    orderId: order.id,
    total: order.total.amount_minor,
    currency: order.total.currency,
  });
}
```

### Task 5 — Stripe provider

**File:** `packages/addons-multi-payment/src/providers/stripe/provider.ts`

```typescript
import Stripe from 'stripe';
import type { PaymentGateway, PaymentInitResult, PaymentConfirmResult, RefundResult } from '../../interface';
import type { Order } from '@ecom-os/engine';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

export const StripeGateway: PaymentGateway = {
  id: 'stripe',
  name: 'Credit Card (Stripe)',

  async initiate(order: Order): Promise<PaymentInitResult> {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.create({
      amount: order.total.amount_minor,          // minor units — no conversion
      currency: order.total.currency.toLowerCase(),
      metadata: { orderId: order.id },
      idempotency_key: `order-${order.id}`,
    });
    const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publicKey) throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
    return { type: 'client_secret', secret: pi.client_secret!, publicKey };
  },

  async confirm(_callbackData: unknown): Promise<PaymentConfirmResult> {
    // Confirmation happens via webhook (see stripe/webhook.ts)
    return { success: true, orderId: '' };
  },

  async refund(orderId: string, amountMinor: number): Promise<RefundResult> {
    // ponytail: requires storing paymentIntentId on order — defer to v1.1
    return { success: false };
  },
};
```

**File:** `packages/addons-multi-payment/src/providers/stripe/webhook.ts`

```typescript
import Stripe from 'stripe';
import { isDuplicate, markSeen } from '../../dedup';

export async function handleStripeWebhook(
  body: string,
  signature: string | null,
  engine: { markOrderPaid: (orderId: string, ref: any) => Promise<void> },
): Promise<{ status: number; body: string }> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return { status: 500, body: 'Webhook secret not configured' };
  if (!signature) return { status: 400, body: 'Missing stripe-signature' };

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    // signature_status logged for audit
    console.warn(JSON.stringify({ signature_status: 'invalid', source: 'stripe', ts: new Date().toISOString() }));
    return { status: 400, body: 'Invalid signature' };
  }

  if (isDuplicate(event.id)) {
    return { status: 200, body: 'already_processed' };
  }
  markSeen(event.id);

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderId = pi.metadata?.orderId;
    if (orderId) {
      await engine.markOrderPaid(orderId, {
        provider: 'stripe',
        transactionId: pi.id,
        status: 'paid',
      });
    }
  }

  return { status: 200, body: 'received' };
}
```

**File:** `apps/storefront/src/app/api/webhooks/stripe/route.ts` (create)

```typescript
import { getEngine } from '@/lib/engine';
import { handleStripeWebhook } from '@ecom-os/addons-multi-payment/src/providers/stripe/webhook';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const engine = await getEngine();
  const result = await handleStripeWebhook(body, signature, engine);
  return new Response(result.body, { status: result.status });
}
```

### Task 6 — CMI provider

**File:** `packages/addons-multi-payment/src/providers/cmi/hash.ts`

```typescript
import { createHmac } from 'crypto';

export function computeCmiHash(params: Record<string, string>, storeKey: string): string {
  // CMI hash: sort params alphabetically, exclude HASH field, join as KEY=VALUE|, HMAC-SHA512
  const sorted = Object.keys(params)
    .filter(k => k !== 'HASH' && k !== 'encoding')
    .sort()
    .map(k => `${params[k]}`)
    .join('|');
  return createHmac('sha512', storeKey).update(sorted).digest('hex').toUpperCase();
}

export function verifyCmiHash(params: Record<string, string>, storeKey: string): boolean {
  const received = params['HASH'];
  if (!received) return false;
  const expected = computeCmiHash(params, storeKey);
  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(received, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
```

**File:** `packages/addons-multi-payment/src/providers/cmi/callback.ts`

```typescript
import { verifyCmiHash } from './hash';
import { isDuplicate, markSeen } from '../../dedup';

export type CmiCallbackResult =
  | { ok: true; orderId: string; amountMinor: number; transactionId: string }
  | { ok: false; reason: string };

export async function processCmiCallback(
  params: Record<string, string>,
  expectedAmountMinor: number,
): Promise<CmiCallbackResult> {
  const storeKey = process.env.CMI_STORE_KEY;
  if (!storeKey) return { ok: false, reason: 'CMI_STORE_KEY not configured' };

  // 1. Verify signature FIRST
  if (!verifyCmiHash(params, storeKey)) {
    console.warn(JSON.stringify({ signature_status: 'invalid', source: 'cmi', ts: new Date().toISOString() }));
    return { ok: false, reason: 'Invalid HASH' };
  }

  // 2. Replay check
  const txId = params['TransId'] ?? params['oid'] ?? '';
  const dedupKey = `${params['oid']}-${txId}`;
  if (isDuplicate(dedupKey)) {
    return { ok: false, reason: 'Duplicate callback' };
  }
  markSeen(dedupKey);

  // 3. Amount integrity — callback amount must match server order total
  const callbackAmount = Math.round(parseFloat(params['amount'] ?? '0') * 100);
  if (callbackAmount !== expectedAmountMinor) {
    console.warn(JSON.stringify({
      signature_status: 'amount_mismatch',
      expected: expectedAmountMinor,
      received: callbackAmount,
      ts: new Date().toISOString(),
    }));
    return { ok: false, reason: 'Amount mismatch' };
  }

  const orderId = params['oid'];
  if (!orderId) return { ok: false, reason: 'Missing oid' };

  return { ok: true, orderId, amountMinor: callbackAmount, transactionId: txId };
}
```

**File:** `packages/addons-multi-payment/src/providers/cmi/provider.ts`

```typescript
import type { PaymentGateway, PaymentInitResult, PaymentConfirmResult, RefundResult } from '../../interface';
import type { Order } from '@ecom-os/engine';
import { computeCmiHash } from './hash';

export const CmiGateway: PaymentGateway = {
  id: 'cmi',
  name: 'CMI (3D Secure)',

  async initiate(order: Order): Promise<PaymentInitResult> {
    const merchantId = process.env.CMI_MERCHANT_ID;
    const storeKey = process.env.CMI_STORE_KEY;
    const siteUrl = process.env.SITE_URL;
    if (!merchantId || !storeKey || !siteUrl) {
      throw new Error('CMI environment variables not configured');
    }

    const amount = (order.total.amount_minor / 100).toFixed(2);
    const params: Record<string, string> = {
      clientid: merchantId,
      oid: order.id,
      amount,
      currency: '504', // MAD ISO 4217 numeric
      okUrl: `${siteUrl}/checkout/success?orderId=${order.id}`,
      failUrl: `${siteUrl}/checkout?error=payment_failed`,
      callbackUrl: `${siteUrl}/api/webhooks/cmi`,
      storetype: '3D_PAY_HOSTING',
      trantype: 'PreAuth',
      lang: 'fr',  // ponytail: locale-aware in v1.1 with i18n addon
      encoding: 'UTF-8',
    };
    params['HASH'] = computeCmiHash(params, storeKey);

    const cmiUrl = process.env.CMI_GATEWAY_URL ?? 'https://testpayment.cmi.co.ma/fim/est3Dgate';
    const formUrl = `${cmiUrl}?${new URLSearchParams(params).toString()}`;
    return { type: 'redirect', url: formUrl };
  },

  async confirm(_callbackData: unknown): Promise<PaymentConfirmResult> {
    // CMI confirmation happens via webhook at /api/webhooks/cmi
    return { success: true, orderId: '' };
  },

  async refund(_orderId: string, _amountMinor: number): Promise<RefundResult> {
    // ponytail: CMI refunds via admin portal. API refund in v1.1.
    return { success: false };
  },
};
```

**File:** `apps/storefront/src/app/api/webhooks/cmi/route.ts` (create)

```typescript
import { getEngine } from '@/lib/engine';
import { processCmiCallback } from '@ecom-os/addons-multi-payment/src/providers/cmi/callback';

export async function POST(request: Request) {
  const body = await request.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  const engine = await getEngine();
  // Server re-fetches order to get authoritative amount — never trust callback amount alone
  const order = await engine.getOrder(params['oid'], '').catch(() => null);
  if (!order) {
    return new Response('Order not found', { status: 404 });
  }

  const result = await processCmiCallback(params, order.total.amount_minor);

  if (!result.ok) {
    return new Response(`Rejected: ${result.reason}`, { status: 400 });
  }

  await engine.markOrderPaid(result.orderId, {
    provider: 'cmi',
    transactionId: result.transactionId,
    status: 'paid',
  });

  // CMI expects "ACTION=POSTAUTH" response to confirm receipt
  return new Response('ACTION=POSTAUTH', { status: 200, headers: { 'Content-Type': 'text/plain' } });
}
```

### Task 7 — Addon register/disable lifecycle

**File:** `packages/addons-multi-payment/src/register.ts`

```typescript
import type { AddonContext } from '@ecom-os/engine';
import { registerGateway } from './registry';
import { CodGateway } from './providers/cod/provider';
import { StripeGateway } from './providers/stripe/provider';
import { CmiGateway } from './providers/cmi/provider';

const PROVIDERS = { cod: CodGateway, stripe: StripeGateway, cmi: CmiGateway } as const;

export function register(ctx: AddonContext): void {
  try {
    const enabled = (process.env.PAYMENT_PROVIDERS ?? 'cod').split(',').filter(Boolean);
    for (const id of enabled) {
      const gateway = PROVIDERS[id as keyof typeof PROVIDERS];
      if (gateway) registerGateway(gateway);
    }
  } catch (err) {
    // Graceful degradation — log but don't crash the storefront
    console.warn('[multi-payment] Failed to register:', err);
  }
}

export function disable(): void {
  // Registry cleared on process restart — stateless
}
```

**File:** `packages/addons-multi-payment/src/index.ts`

```typescript
export { register, disable } from './register';
export { getEnabledGateways, getGateway } from './registry';
export type { PaymentGateway, PaymentInitResult, PaymentConfirmResult } from './interface';
```

**File:** `packages/addons-multi-payment/package.json`

```json
{
  "name": "@ecom-os/addons-multi-payment",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "ecom-os": {
    "addon": true,
    "flag": "multi-payment"
  },
  "dependencies": {
    "stripe": "^16.0.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^2.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

**File:** `packages/addons-multi-payment/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "esnext"],
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

### Task 8 — Update `CheckoutForm` to show enabled payment providers

**File:** `apps/storefront/src/features/checkout/ui/checkout-form.tsx` (edit payment section)

Replace the hardcoded COD radio with a dynamic list from the registry:

```typescript
'use client';

import { useCartStore } from '@/stores/cart-store';
import { useEffect, useRef, useState } from 'react';
import type { PaymentGateway } from '@ecom-os/addons-multi-payment/src/interface';

interface Props {
  cartId: string;
  action: (formData: FormData) => Promise<void>;
  gateways: Array<{ id: string; name: string }>;
}

export function CheckoutForm({ cartId, action, gateways }: Props) {
  const { items, getCartTotal } = useCartStore();
  const cartItemsRef = useRef<HTMLInputElement>(null);
  const [selectedGateway, setSelectedGateway] = useState(gateways[0]?.id ?? 'cod');

  useEffect(() => {
    if (!cartItemsRef.current) return;
    cartItemsRef.current.value = JSON.stringify(
      items.map(item => ({ productId: item.id, slug: item.slug, quantity: item.quantity }))
    );
  }, [items]);

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-secondary mb-6 text-lg">Your cart is empty.</p>
        <a href="/catalog" className="underline font-medium">Browse products</a>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-10">Checkout</h1>
      <form action={action} className="space-y-8">
        <input type="hidden" name="cartItems" ref={cartItemsRef} />
        <input type="hidden" name="cartId" value={cartId} />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Contact</h2>
          <input type="email" name="email" placeholder="Email address" required
            className="w-full border border-foreground/20 p-3 rounded-md bg-background" />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Shipping</h2>
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" placeholder="First name" required className="border border-foreground/20 p-3 rounded-md bg-background" />
            <input name="lastName" placeholder="Last name" required className="border border-foreground/20 p-3 rounded-md bg-background" />
          </div>
          <textarea name="address" placeholder="Full address" required rows={3}
            className="w-full border border-foreground/20 p-3 rounded-md bg-background" />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Payment</h2>
          {gateways.map(g => (
            <label key={g.id} className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer transition ${selectedGateway === g.id ? 'border-foreground' : 'border-foreground/20 hover:bg-muted/50'}`}>
              <input type="radio" name="paymentMethod" value={g.id}
                checked={selectedGateway === g.id}
                onChange={() => setSelectedGateway(g.id)} />
              <span className="font-medium">{g.name}</span>
            </label>
          ))}
          {gateways.length === 0 && (
            <p className="text-secondary text-sm">No payment methods available. Contact support.</p>
          )}
        </section>

        <section className="bg-muted rounded-md p-5 space-y-3">
          <h2 className="font-semibold">Order summary</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-secondary">{item.name} <span className="font-medium">× {item.quantity}</span></span>
              <span>${((item.price.amount_minor * item.quantity) / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-foreground/10 pt-3 flex justify-between font-bold">
            <span>Estimated total</span>
            <span>${(getCartTotal() / 100).toFixed(2)}</span>
          </div>
          <p className="text-xs text-secondary">Final price confirmed by server at order time.</p>
        </section>

        <button type="submit" disabled={gateways.length === 0}
          className="w-full bg-foreground text-background py-4 rounded-md font-bold text-lg hover:opacity-90 transition disabled:opacity-50">
          Place Order
        </button>
      </form>
    </main>
  );
}
```

### Task 9 — Update Checkout page to pass gateways + handle payment routing

**File:** `apps/storefront/src/app/(checkout)/checkout/page.tsx` (or `[locale]/(checkout)/checkout/page.tsx` after Plan A migration)

```typescript
import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getOrCreateCartId, clearCartCookie } from '@/features/cart/server/cart-actions';
import { CheckoutForm } from '@/features/checkout/ui/checkout-form';
import { getEnabledGateways } from '@ecom-os/addons-multi-payment/src/registry';

export default async function CheckoutPage() {
  const cartId = await getOrCreateCartId();
  const gateways = getEnabledGateways().map(g => ({ id: g.id, name: g.name }));

  async function submitOrder(formData: FormData) {
    'use server';

    const cartJson = formData.get('cartItems') as string;
    let clientItems: Array<{ productId: string; slug: string; quantity: number }> = [];
    try { clientItems = JSON.parse(cartJson ?? '[]'); } catch { throw new Error('Malformed cart data'); }
    if (clientItems.length === 0) throw new Error('Cart is empty');

    const paymentMethod = formData.get('paymentMethod') as string;
    const cartCookieId = await getOrCreateCartId();
    const engine = await getEngine();

    const session = await engine.initCheckout(cartCookieId, {
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      address: formData.get('address') as string,
      paymentMethod,
    }, clientItems);

    const order = await engine.placeOrder(session);

    // Route to payment gateway
    const { getGateway } = await import('@ecom-os/addons-multi-payment/src/registry');
    const gateway = getGateway(paymentMethod);
    if (gateway) {
      const result = await gateway.initiate(order);
      if (result.type === 'redirect') {
        await clearCartCookie();
        redirect(result.url); // CMI: redirect to hosted page
      }
      if (result.type === 'client_secret') {
        // Stripe: redirect to payment page with client_secret in query
        await clearCartCookie();
        redirect(`/checkout/stripe?orderId=${order.id}&secret=${result.secret}&pk=${result.publicKey}`);
      }
    }

    // COD or fallback: go to success
    await clearCartCookie();
    redirect(`/checkout/success?orderId=${order.id}`);
  }

  return <CheckoutForm cartId={cartId} action={submitOrder} gateways={gateways} />;
}
```

### Task 10 — Stripe payment page (client-side Stripe Elements)

**File:** `apps/storefront/src/app/(checkout)/checkout/stripe/page.tsx` (create)

```typescript
import { StripePaymentForm } from '@/features/checkout/ui/stripe-payment-form';

export default async function StripeCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; secret?: string; pk?: string }>;
}) {
  const { orderId, secret, pk } = await searchParams;
  if (!secret || !pk || !orderId) {
    return <main className="max-w-xl mx-auto px-4 py-24 text-center"><p>Invalid payment session.</p></main>;
  }
  return <StripePaymentForm orderId={orderId} clientSecret={secret} publishableKey={pk} />;
}
```

**File:** `apps/storefront/src/features/checkout/ui/stripe-payment-form.tsx` (create)

```typescript
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

interface Props {
  orderId: string;
  clientSecret: string;
  publishableKey: string;
}

function PaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
      },
    });
    if (error) {
      setError(error.message ?? 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading || !stripe}
        className="w-full bg-foreground text-background py-4 rounded-md font-bold hover:opacity-90 transition disabled:opacity-50">
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export function StripePaymentForm({ orderId, clientSecret, publishableKey }: Props) {
  const stripePromise = loadStripe(publishableKey);
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-8">Complete Payment</h1>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm orderId={orderId} />
      </Elements>
    </main>
  );
}
```

Add `@stripe/stripe-js` and `@stripe/react-stripe-js` to storefront dependencies:
```bash
pnpm --filter storefront add @stripe/stripe-js @stripe/react-stripe-js
```

### Task 11 — Update `.env.example` with payment vars

```
# Payment (addon: multi-payment)
PAYMENT_PROVIDERS=cod
SITE_URL=http://localhost:3000
NOTIFICATION_EMAIL=merchant@example.com

# Stripe (PAYMENT_PROVIDERS=...,stripe)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CMI Morocco (PAYMENT_PROVIDERS=...,cmi)
CMI_MERCHANT_ID=your_merchant_id
CMI_STORE_KEY=your_store_key
CMI_GATEWAY_URL=https://testpayment.cmi.co.ma/fim/est3Dgate
```

### Task 12 — Update `plugins/cod-payment` and `plugins/stripe-payment` stubs

These stubs are now superseded by the addon. Replace them to delegate to the real implementations:

**`plugins/cod-payment/index.ts`:**
```typescript
// ponytail: stubs delegated to packages/addons-multi-payment. Keep for ADDONS= legacy compat.
export { register, disable } from '../../packages/addons-multi-payment/src/register';
```

**`plugins/stripe-payment/index.ts`:**
```typescript
export { register, disable } from '../../packages/addons-multi-payment/src/register';
```

### Task 13 — Tests

**File:** `packages/addons-multi-payment/src/__tests__/hash.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { computeCmiHash, verifyCmiHash } from '../providers/cmi/hash';

const STORE_KEY = 'test-key-1234567890';

describe('CMI hash', () => {
  it('produces a deterministic hash for given params', () => {
    const params = { oid: 'order-1', amount: '99.99', clientid: 'MERCHANT1' };
    const hash1 = computeCmiHash(params, STORE_KEY);
    const hash2 = computeCmiHash(params, STORE_KEY);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[A-F0-9]{128}$/); // SHA-512 hex uppercase
  });

  it('excludes HASH field from computation', () => {
    const params = { oid: 'order-1', amount: '99.99', HASH: 'should-be-excluded' };
    const hash = computeCmiHash(params, STORE_KEY);
    expect(hash).toBe(computeCmiHash({ oid: 'order-1', amount: '99.99' }, STORE_KEY));
  });

  it('verifyHash passes for correct key', () => {
    const params = { oid: 'order-1', amount: '99.99' };
    const hash = computeCmiHash(params, STORE_KEY);
    expect(verifyCmiHash({ ...params, HASH: hash }, STORE_KEY)).toBe(true);
  });

  it('verifyHash fails for tampered amount', () => {
    const params = { oid: 'order-1', amount: '99.99' };
    const hash = computeCmiHash(params, STORE_KEY);
    expect(verifyCmiHash({ oid: 'order-1', amount: '1.00', HASH: hash }, STORE_KEY)).toBe(false);
  });

  it('verifyHash fails for wrong key', () => {
    const params = { oid: 'order-1', amount: '99.99' };
    const hash = computeCmiHash(params, STORE_KEY);
    expect(verifyCmiHash({ ...params, HASH: hash }, 'wrong-key')).toBe(false);
  });

  it('verifyHash fails for missing HASH field', () => {
    expect(verifyCmiHash({ oid: 'order-1', amount: '99.99' }, STORE_KEY)).toBe(false);
  });
});
```

**File:** `packages/addons-multi-payment/src/__tests__/dedup.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('webhook dedup', () => {
  beforeEach(() => {
    // Reset module state between tests
    vi.resetModules();
  });

  it('first call is not duplicate', async () => {
    const { isDuplicate, markSeen } = await import('../dedup');
    expect(isDuplicate('evt-1')).toBe(false);
    markSeen('evt-1');
    expect(isDuplicate('evt-1')).toBe(true);
  });

  it('second event is independent', async () => {
    const { isDuplicate, markSeen } = await import('../dedup');
    markSeen('evt-1');
    expect(isDuplicate('evt-2')).toBe(false);
  });
});
```

**File:** `packages/addons-multi-payment/src/__tests__/stripe-webhook.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('stripe webhook', () => {
  it('rejects missing signature with 400', async () => {
    const { handleStripeWebhook } = await import('../providers/stripe/webhook');
    const engine = { markOrderPaid: vi.fn() };
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    const result = await handleStripeWebhook('{}', null, engine);
    expect(result.status).toBe(400);
    expect(engine.markOrderPaid).not.toHaveBeenCalled();
  });

  it('rejects invalid signature with 400', async () => {
    const { handleStripeWebhook } = await import('../providers/stripe/webhook');
    const engine = { markOrderPaid: vi.fn() };
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    const result = await handleStripeWebhook('{}', 'bad-sig', engine);
    expect(result.status).toBe(400);
    expect(engine.markOrderPaid).not.toHaveBeenCalled();
  });
});
```

Add vitest config to `packages/addons-multi-payment/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { globals: true } });
```

---

## Pre-Completion Checklist — ALL must pass before reporting done

```bash
# 1. Type check
pnpm --filter @ecom-os/addons-multi-payment typecheck
pnpm --filter storefront typecheck

# 2. Security tests pass (MUST ALL PASS)
pnpm --filter @ecom-os/addons-multi-payment test

# 3. Register/disable exported
grep -n "export function register\|export function disable" packages/addons-multi-payment/src/register.ts

# 4. No card data in codebase
grep -rn "cardNumber\|card_number\|cvv\|cvc\|expiry" packages/addons-multi-payment/src/ apps/storefront/src/
# → must return 0 matches

# 5. Signature verified before state change (manual code review)
# Grep for engine.markOrderPaid — it must only appear AFTER a successful verify
grep -n "markOrderPaid" apps/storefront/src/app/api/webhooks/stripe/route.ts
grep -n "markOrderPaid" apps/storefront/src/app/api/webhooks/cmi/route.ts
# → In both: markOrderPaid is called AFTER the handler returns ok/success

# 6. Build with ADDONS=multi-payment
ADDONS=multi-payment PAYMENT_PROVIDERS=cod pnpm --filter storefront build

# 7. Build without addon still works
ADDONS= pnpm --filter storefront build
```

**Manual verification (with PAYMENT_PROVIDERS=cod):**
- [ ] Checkout shows "Cash on Delivery" radio
- [ ] COD order completes → success page shows orderId
- [ ] `/api/webhooks/stripe` with missing signature → 400
- [ ] `/api/webhooks/cmi` with tampered HASH → 400
- [ ] CMI hash test: tampered amount returns false

---

## Session Report Template

```
## AGENT-PLAN-04 Session Report — Multi-Payment Addon

### Completed
- [ ] Task 1: PaymentGateway interface
- [ ] Task 2: Provider registry
- [ ] Task 3: Webhook replay dedup
- [ ] Task 4: COD provider (formalized)
- [ ] Task 5: Stripe provider + webhook handler
- [ ] Task 6: CMI provider + hash verification + callback
- [ ] Task 7: Addon register/disable lifecycle
- [ ] Task 8: CheckoutForm updated with dynamic gateways
- [ ] Task 9: Checkout page routes to payment gateway
- [ ] Task 10: Stripe payment page + Elements
- [ ] Task 11: .env.example updated
- [ ] Task 12: Plugin stubs updated
- [ ] Task 13: All tests pass

### Security audit
- No card data stored: [CONFIRMED/ISSUES]
- Signature verified before state change: [CONFIRMED/ISSUES]
- Invalid signature → 400: [CONFIRMED stripe/cmi]
- Replay protected: [CONFIRMED]
- All money in minor units: [CONFIRMED/ISSUES]

### Test results
- hash.test.ts: [X/6 pass]
- dedup.test.ts: [X/2 pass]
- stripe-webhook.test.ts: [X/2 pass]
- typecheck storefront: [PASS/FAIL — error count]
- typecheck addon: [PASS/FAIL — error count]

### What was NOT done and why
[List anything deferred]

### Files modified
[Every file created/modified/deleted]

### Dependencies added
[Any new npm packages with versions]
```
