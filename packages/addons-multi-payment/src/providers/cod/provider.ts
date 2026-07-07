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
