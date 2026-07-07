import { getTranslations } from 'next-intl/server';
import { requestPasswordResetAction } from '@/features/account/server/auth-actions';
import Link from 'next/link';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const t = await getTranslations('auth');
  const resolvedParams = await searchParams;
  const isSuccess = !!resolvedParams.success;

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">{t('forgotPassword')}</h1>
      
      {isSuccess ? (
        <div className="bg-green-50 text-green-900 p-4 rounded-md mb-6 border border-green-200">
          {t('resetSent')}
        </div>
      ) : (
        <>
          <p className="text-secondary mb-6">{t('resetInstructions')}</p>
          <form action={requestPasswordResetAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-foreground text-background py-2 rounded-md font-medium hover:bg-foreground/90 transition"
            >
              {t('sendResetLink')}
            </button>
          </form>
        </>
      )}

      <div className="mt-6 text-center">
        <Link href="/account/login" className="text-sm text-secondary hover:text-foreground transition">
          {t('backToLogin')}
        </Link>
      </div>
    </main>
  );
}
