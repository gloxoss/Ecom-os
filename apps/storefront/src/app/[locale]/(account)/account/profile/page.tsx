import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getSessionToken } from '@/features/account/server/auth-actions';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  const t = await getTranslations('account');
  const { saved } = await searchParams;

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account" className="text-secondary hover:text-foreground text-sm">
          {t('back')}
        </Link>
        <h1 className="text-2xl font-bold">{t('profile')}</h1>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md mb-6 text-sm">
          {t('profileSaved')}
        </div>
      )}

      <div className="space-y-4 border border-foreground/10 rounded-md p-5">
        <div>
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">{t('firstName')}</p>
          <p className="font-medium">{customer.firstName}</p>
        </div>
        <div>
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">{t('lastName')}</p>
          <p className="font-medium">{customer.lastName}</p>
        </div>
        <div>
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">{t('email')}</p>
          <p className="font-medium">{customer.email}</p>
        </div>
      </div>

      <p className="text-xs text-secondary mt-4 text-center">
        To update your profile, please contact support or use your account portal.
      </p>
    </main>
  );
}
