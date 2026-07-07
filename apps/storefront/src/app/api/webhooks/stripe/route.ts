import { getEngine } from '@/lib/engine';
import { handleStripeWebhook } from '@ecom-os/addons-multi-payment';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const engine = await getEngine();
  const result = await handleStripeWebhook(body, signature, engine);
  return new Response(result.body, { status: result.status });
}
