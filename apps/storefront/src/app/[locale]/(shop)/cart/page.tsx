import { getTranslations } from 'next-intl/server';
import { CartPageClient } from '@/features/cart/ui/cart-page-client';
import { getCapabilities } from '@/lib/capabilities';

export default async function CartPage() {
  const t = await getTranslations('cart');
  const capabilities = await getCapabilities();
  
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-10">{t('pageTitle')}</h1>
      <CartPageClient capabilities={capabilities} />
    </main>
  );
}
