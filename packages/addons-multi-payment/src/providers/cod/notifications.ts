import type { Order } from '@ecom-os/engine';

// ponytail: no shared logger package yet — inline minimal logging
function log(msg: string, data: Record<string, unknown>) {
  console.warn(JSON.stringify({ level: 'info', msg, ...data, ts: new Date().toISOString() }));
}

export async function notifyMerchantCod(order: Order): Promise<void> {
  const to = process.env.NOTIFICATION_EMAIL;
  log('COD order placed', {
    orderId: order.id,
    total: order.total.amount_minor,
    currency: order.total.currency,
    notifyTarget: to ?? 'none',
  });
  // TODO Section 10: send email via Resend / WhatsApp via Twilio
}
