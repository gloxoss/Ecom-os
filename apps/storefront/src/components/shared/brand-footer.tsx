import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function BrandFooter() {
  const t = await getTranslations('footer');
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-foreground/10 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-bold text-lg">Logo</p>
          <p className="text-secondary text-sm mt-1">{t('tagline')}</p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-secondary">
          <Link href="/catalog" className="hover:text-foreground transition">{t('catalog')}</Link>
          <Link href="/blog" className="hover:text-foreground transition">Blog</Link>
          <Link href="/stores" className="hover:text-foreground transition">Stores</Link>
          <Link href="/account" className="hover:text-foreground transition">{t('account')}</Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition">{t('privacy')}</Link>
          <Link href="/legal/terms" className="hover:text-foreground transition">{t('terms')}</Link>
          <Link href="/legal/returns" className="hover:text-foreground transition">{t('returns')}</Link>
        </nav>
        <p className="text-secondary text-xs">© {year}</p>
      </div>
    </footer>
  );
}
