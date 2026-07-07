import { getTranslations } from 'next-intl/server';
import { resetPasswordAction } from '@/features/account/server/auth-actions';
import Link from 'next/link';

export default async function PasswordResetPage({
  searchParams,
}: {
  // WP reset email sends ?key=RESETKEY&login=USERNAME
  // (requires 'retrieve_password_message' WP filter to point to this page)
  searchParams: Promise<{ key?: string; login?: string; error?: string }>;
}) {
  const t = await getTranslations('auth');
  const { key, login, error } = await searchParams;

  if (!key || !login) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-secondary mb-4">{t('tokenInvalid')}</p>
        <Link href="/account/forgot-password" className="text-secondary hover:text-foreground underline">
          {t('sendResetLink')}
        </Link>
      </main>
    );
  }

  // Encode key+login as "key|login" — the engine splits on the first pipe
  const token = `${key}|${login}`;

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">{t('resetTitle')}</h1>

      {error && (
        <div className="bg-red-50 text-red-900 p-4 rounded-md mb-6 border border-red-200">
          {error === 'mismatch' ? t('passwordMismatch') : 'An error occurred. Please try again.'}
        </div>
      )}

      <form action={resetPasswordAction} className="space-y-4">
        {/* Passes key|login to the engine which splits them for WPGraphQL resetUserPassword */}
        <input type="hidden" name="token" value={token} />

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            {t('newPassword')}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={8}
            className="w-full px-3 py-2 border border-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            {t('confirmPassword')}
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            minLength={8}
            className="w-full px-3 py-2 border border-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-foreground text-background py-2 rounded-md font-medium hover:bg-foreground/90 transition"
        >
          {t('updatePassword')}
        </button>
      </form>
    </main>
  );
}
