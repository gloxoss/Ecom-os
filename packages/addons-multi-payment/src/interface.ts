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
