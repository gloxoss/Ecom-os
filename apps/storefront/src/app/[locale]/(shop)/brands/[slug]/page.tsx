import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { defaultParaLocaContent, type BrandDefinition } from '../../../../../../../../clients/paraloca/content-schema';
import { getBrandStory } from '../../../../../../../../clients/paraloca/brand-schema';
import { WishlistButton } from '@/features/product/ui/wishlist-button';
import { BrandStory } from '@/features/brands/ui/brand-story';

interface BrandPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return defaultParaLocaContent.brands.flatMap((brand: BrandDefinition) => [
    { locale: 'fr', slug: brand.slug },
    { locale: 'ar', slug: brand.slug },
  ]);
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { locale, slug } = await params;

  const brand = defaultParaLocaContent.brands.find((b: BrandDefinition) => b.slug === slug);
  if (!brand) {
    notFound();
  }

  const isArabic = locale === 'ar';
  const story = getBrandStory(slug);

  return (
    <div className="py-8 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
              {isArabic ? 'الرئيسية' : 'Accueil'}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/${locale}/catalog`} className="hover:text-foreground transition-colors">
              {isArabic ? 'العلامات التجارية' : 'Marques'}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground font-medium">
            {brand.name}
          </li>
        </ol>
      </nav>

      {/* Brand Hero Banner */}
      <header className="pb-8 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {brand.name}
              </h1>
              {brand.isOwned && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/20">
                  {isArabic ? 'علامتنا التجارية' : 'Notre Marque'}
                </span>
              )}
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {isArabic && brand.descriptionAr ? brand.descriptionAr : brand.descriptionFr}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/40 p-4 rounded-lg border border-border/60">
            <div>
              <span className="block font-medium text-foreground">
                {isArabic ? 'بلد المنشأ' : 'Origine & Siège'}
              </span>
              <span>{brand.origin}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Brand Story & Warranty Panel */}
      {story && <BrandStory story={story} locale={locale} />}

      {/* Brand Catalog Listing Section */}
      <section aria-labelledby="brand-products-heading" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 id="brand-products-heading" className="text-2xl font-semibold tracking-tight text-foreground">
            {isArabic ? `منتجات ${brand.name}` : `Équipements ${brand.name}`}
          </h2>
          <span className="text-sm text-muted-foreground">
            {isArabic ? 'كتالوج معتمد' : 'Catalogue officiel'}
          </span>
        </div>

        {/* Product Grid Mock/Hydrated Anchor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <article className="group relative border border-border rounded-xl bg-card p-4 transition-all hover:shadow-md">
            <div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center relative overflow-hidden">
              <span className="text-xs text-muted-foreground font-mono">1:1 Équipement</span>
              <WishlistButton productId={`sample-${brand.slug}-01`} />
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {brand.name}
              </div>
              <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors">
                <Link href={`/${locale}/catalog`}>
                  {brand.isOwned
                    ? 'Fauteuil Roulant Confort Pliable Pro'
                    : `Dispositif Médical Homologué ${brand.name}`}
                </Link>
              </h3>
              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-bold text-foreground">
                  1 250,00 <span className="text-sm font-normal">MAD</span>
                </span>
                <Link
                  href={`/${locale}/catalog`}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {isArabic ? 'عرض التفاصيل' : 'Voir le produit'}
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
