---
name: ecom-payment-provider
description: Guide for implementing payment providers (Stripe, CMI, COD). Use when building a new payment gateway, handling webhooks, or verifying payment signatures.
---

# Ecom OS Payment Provider Skill

## When to Use
- Implementing a new payment provider (Stripe, CMI, COD, or custom)
- Handling payment webhooks and signature verification
- Building the checkout payment selection UI

## PaymentGateway Interface

```typescript
interface PaymentGateway {
  id: string;
  name: string;
  
  // Start payment flow — returns redirect URL or client secret
  initiate(order: Order): Promise<PaymentInitResult>;
  
  // Verify callback/webhook and confirm payment
  confirm(callbackData: unknown): Promise<PaymentConfirmResult>;
  
  // Refund (partial or full)
  refund(orderId: string, amount: number): Promise<RefundResult>;
}
```

## Provider File Structure
```
packages/addons-multi-payment/
├── src/
│   ├── interface.ts           # PaymentGateway interface
│   ├── registry.ts            # Provider registration
│   ├── register.ts            # Addon lifecycle
│   ├── ui/
│   │   └── PaymentProviderList.tsx
│   └── providers/
│       ├── cod/
│       │   ├── provider.ts
│       │   └── notifications.ts
│       ├── stripe/
│       │   ├── provider.ts
│       │   ├── intent.ts
│       │   └── webhook.ts
│       └── cmi/
│           ├── provider.ts
│           ├── hash.ts
│           └── callback.ts
```

## Security Rules — NON-NEGOTIABLE

1. **NEVER store card data** — use hosted pages (CMI) or Elements (Stripe)
2. **ALWAYS verify webhook signatures** before any state change
3. **Invalid signature → HTTP 400** + log `signature_status=invalid`
4. **Replay protection** — deduplicate via `ecom_webhook_delivery_log`
5. **All money in minor units** (cents) — no floats
6. **Server-side price verification** — ignore client-supplied totals

## Webhook Handler Pattern
```typescript
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  // 1. Verify signature FIRST
  const event = verifySignature(body, signature);
  if (!event) {
    log.warn({ signature_status: 'invalid', requestId });
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  // 2. Check for replay
  const isDuplicate = await checkDeliveryLog(event.id);
  if (isDuplicate) {
    return Response.json({ status: 'already_processed' });
  }
  
  // 3. Process the event
  await processPaymentEvent(event);
  
  // 4. Log delivery
  await logDelivery(event.id, 'success');
  
  return Response.json({ received: true });
}
```

## Provider Registration
```typescript
// providers are registered via PAYMENT_PROVIDERS env var
const enabledProviders = process.env.PAYMENT_PROVIDERS?.split(',') || [];
// Only enabled providers appear in checkout UI
```

## Testing
- Each provider needs: valid signature test, invalid signature test, missing signature test
- Stripe: use `stripe.webhooks.constructEvent()` in tests
- CMI: compute expected HMAC and compare
- COD: verify order status is set to `pending_confirmation`
