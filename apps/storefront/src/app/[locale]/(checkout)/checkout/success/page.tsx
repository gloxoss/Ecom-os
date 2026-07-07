import Link from 'next/link';
import { CartClearer } from '@/features/cart/ui/cart-clearer';
import { getTranslations } from 'next-intl/server';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const t = await getTranslations('success');

  return (
    <main className="max-w-xl mx-auto px-4 py-24 text-center">
      <CartClearer />
      <div className="text-6xl mb-6">✓</div>
      <h1 className="text-3xl font-bold mb-3">{t('title')}</h1>
      {orderId && <p className="text-secondary mb-2">{t('order')}{orderId}</p>}
      <p className="text-secondary mb-10">
        {t('message')}
      </p>
      <Link
        href="/"
        className="inline-block bg-foreground text-background px-8 py-3 rounded-md font-medium hover:opacity-90 transition"
      >
        {t('continue')}
      </Link>
    </main>
  );
}
