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
