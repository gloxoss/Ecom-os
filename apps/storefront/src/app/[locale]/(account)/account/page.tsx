import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getSessionToken, logout } from '@/features/account/server/auth-actions';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LoyaltyWidget } from './loyalty-widget';

export default async function AccountPage() {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');
  const t = await getTranslations('account');

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-secondary mb-10">{customer.firstName} {customer.lastName} · {customer.email}</p>

      <div className="mb-10">
        <LoyaltyWidget customerId={customer.id} />
      </div>

      <div className="space-y-3 mb-12">
        <Link
          href="/account/orders"
          className="flex items-center justify-between p-4 border border-foreground/10 rounded-md hover:bg-muted transition"
        >
          <span className="font-medium">{t('orders')}</span>
          <span className="text-secondary">→</span>
        </Link>
        <Link
          href="/account/profile"
          className="flex items-center justify-between p-4 border border-foreground/10 rounded-md hover:bg-muted transition"
        >
          <span className="font-medium">{t('profile')}</span>
          <span className="text-secondary">→</span>
        </Link>
      </div>

      <form action={logout}>
        <button type="submit" className="text-sm text-secondary hover:text-foreground underline">
          {t('signOut')}
        </button>
      </form>
    </main>
  );
}
