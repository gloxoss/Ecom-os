import Stripe from 'stripe';
import type { PaymentGateway, PaymentInitResult, PaymentConfirmResult, RefundResult } from '../../interface';
import type { Order } from '@ecom-os/engine';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return (_stripe ??= new Stripe(key, { apiVersion: '2024-06-20' }));
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
    }, { idempotencyKey: `order-${order.id}` });
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
