import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { LocaleSwitcher } from '@/features/i18n/ui/locale-switcher';
import { CartButton } from '@/features/cart/ui/cart-button';
import { WishlistCounter } from '@/features/product/ui/wishlist-counter';

export async function SiteHeader() {
  const t = await getTranslations('nav');
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-foreground/10">
      <Link href="/" className="font-bold text-lg">
        {process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Store'}
      </Link>
      <nav className="flex items-center gap-6">
        <Link href="/catalog" className="text-secondary hover:text-foreground transition">{t('catalog')}</Link>
        <Link href="/account" className="text-secondary hover:text-foreground transition">{t('account')}</Link>
      </nav>
      <div className="flex items-center gap-4">
        <LocaleSwitcher />
        <WishlistCounter />
        <CartButton />
      </div>
    </header>
  );
}
