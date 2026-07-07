import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import type { Order } from '@ecom-os/engine';
import { getSessionToken } from '@/features/account/server/auth-actions';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Pagination } from '@/components/shared/pagination';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10);
  const limit = 10;
  const offset = (page - 1) * limit;
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');
  const t = await getTranslations('orders');

  const result = await engine.listCustomerOrders(customer.id, { limit, offset }).catch(() => ({ items: [], total: 0 }));

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account" className="text-secondary hover:text-foreground text-sm">{t('back')}</Link>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      {result.items.length === 0 ? (
        <div className="border border-foreground/10 rounded-md p-12 text-center text-secondary">
          {t('empty')}
        </div>
      ) : (
      <div className="space-y-4">
          {result.items.map((order: Order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="border border-foreground/10 rounded-md p-4 flex justify-between items-center hover:bg-muted transition"
            >
              <div>
                <p className="font-medium">{t('order')}{order.id}</p>
                <p className="text-secondary text-sm capitalize">{order.status}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-medium">${(order.total.amount_minor / 100).toFixed(2)}</p>
                <span className="text-secondary text-sm">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {result.total > 0 && (
        <Pagination totalItems={result.total} pageSize={limit} currentPage={page} />
      )}
    </main>
  );
}
