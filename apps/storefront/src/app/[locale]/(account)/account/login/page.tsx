import { login } from '@/features/account/server/auth-actions';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; retry?: string }>;
}) {
  const t = await getTranslations('account');
  const params = await searchParams;
  const error = params.error;
  const retry = params.retry;

  return (
    <main className="max-w-md mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold mb-8 text-center">{t('signIn')}</h1>

      {error && error !== 'rate_limit' && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-6 text-sm">
          {t('invalidCredentials')}
        </div>
      )}

      {error === 'rate_limit' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md mb-6 text-sm">
          Too many login attempts. Please wait {retry ?? 60} seconds and try again.
        </div>
      )}

      <form action={login} className="space-y-4">
        <input
          type="email" name="email" placeholder={t('email')} required autoComplete="email"
          className="w-full border border-foreground/20 p-3 rounded-md bg-background"
        />
        <input
          type="password" name="password" placeholder={t('password')} required autoComplete="current-password"
          className="w-full border border-foreground/20 p-3 rounded-md bg-background"
        />
        <button
          type="submit"
          className="w-full bg-foreground text-background py-4 rounded-md font-bold hover:opacity-90 transition"
        >
          {t('signIn')}
        </button>
      </form>

      <p className="text-center text-secondary text-sm mt-6">
        {t('noAccount')}{' '}
        <Link href="/account/register" className="underline text-foreground">{t('createOne')}</Link>
      </p>
    </main>
  );
}
