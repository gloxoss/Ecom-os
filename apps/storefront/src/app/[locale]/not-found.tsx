import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <main className="max-w-lg mx-auto px-4 py-32 text-center">
      <p className="text-8xl font-black text-foreground/10 mb-6">404</p>
      <h1 className="text-2xl font-bold mb-3">{t('notFound')}</h1>
      <Link
        href="/"
        className="inline-block mt-6 bg-foreground text-background px-6 py-3 rounded-md font-medium hover:opacity-90 transition"
      >
        {t('backHome')}
      </Link>
    </main>
  );
}
