import { getEngine } from '@/lib/engine';
import { processCmiCallback } from '@ecom-os/addons-multi-payment';

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
