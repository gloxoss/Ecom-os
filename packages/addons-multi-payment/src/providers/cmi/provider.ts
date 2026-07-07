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
