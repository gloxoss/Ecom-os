import { register } from '@/features/account/server/auth-actions';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; retry?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const retry = params.retry;
  const t = await getTranslations('account');

  return (
    <main className="max-w-md mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold mb-8 text-center">{t('createAccount')}</h1>

      {error && error !== 'rate_limit' && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-6 text-sm">
          {t('registrationFailed')}
        </div>
      )}

      {error === 'rate_limit' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md mb-6 text-sm">
          Too many registration attempts. Please wait {retry ?? 60} seconds and try again.
        </div>
      )}

      <form action={register} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input name="firstName" placeholder={t('firstName')} required className="border border-foreground/20 p-3 rounded-md bg-background" />
          <input name="lastName" placeholder={t('lastName')} required className="border border-foreground/20 p-3 rounded-md bg-background" />
        </div>
        <input
          type="email" name="email" placeholder={t('email')} required
          className="w-full border border-foreground/20 p-3 rounded-md bg-background"
        />
        <input
          type="password" name="password" placeholder={t('password')} required minLength={8}
          className="w-full border border-foreground/20 p-3 rounded-md bg-background"
        />
        <button
          type="submit"
          className="w-full bg-foreground text-background py-4 rounded-md font-bold hover:opacity-90 transition"
        >
          {t('createAccount')}
        </button>
      </form>

      <p className="text-center text-secondary text-sm mt-6">
        {t('haveAccount')}{' '}
        <Link href="/account/login" className="underline text-foreground">{t('signIn')}</Link>
      </p>
    </main>
  );
}
