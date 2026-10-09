import type { PaymentGateway } from '../../interface';

export const StripeGateway: PaymentGateway = {
  id: 'stripe',
  name: 'Credit Card (Stripe)',
  async initiate() { throw new Error('Stripe is unavailable pending verified integration.'); },
  async confirm() { return { success: false, orderId: '' }; },
  async refund() { return { success: false }; },
};
