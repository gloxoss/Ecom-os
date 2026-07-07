import { redirect, notFound } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import type { OrderLine } from '@ecom-os/engine';
import { getSessionToken } from '@/features/account/server/auth-actions';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  const t = await getTranslations('orders');
  const order = await engine.getOrder(orderId, customer.id).catch(() => null);
  if (!order) notFound();

  // Guard: customer can only see their own orders
  if (order.customer?.id && order.customer.id !== customer.id) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account/orders" className="text-secondary hover:text-foreground text-sm">
          {t('back')}
        </Link>
        <h1 className="text-2xl font-bold">{t('order')}{orderId}</h1>
      </div>

      {/* Status + total */}
      <div className="border border-foreground/10 rounded-md p-5 mb-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-secondary uppercase tracking-wide">{t('status')}</p>
          <p className="font-semibold capitalize mt-1">{order.status}</p>
        </div>
        <div className="text-end">
          <p className="text-sm text-secondary uppercase tracking-wide">{t('total')}</p>
          <p className="font-bold text-lg mt-1">
            ${(order.total.amount_minor / 100).toFixed(2)} {order.total.currency}
          </p>
        </div>
      </div>

      {/* Line items */}
      {order.items.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-3">{t('items')}</h2>
          <div className="divide-y divide-foreground/10 border border-foreground/10 rounded-md">
            {order.items.map((line: OrderLine) => (
              <div key={line.id} className="flex justify-between items-center px-4 py-3">
                <div>
                  <p className="font-medium">{line.name}</p>
                  <p className="text-sm text-secondary">× {line.quantity}</p>
                </div>
                <p className="font-medium">${((line.price.amount_minor * line.quantity) / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shipping */}
      {order.customer && (
        <section>
          <h2 className="font-semibold mb-2">{t('shippingTo')}</h2>
          <p className="text-secondary text-sm">
            {order.customer.firstName} {order.customer.lastName} · {order.customer.email}
          </p>
        </section>
      )}
    </main>
  );
}
