import type { Metadata } from 'next';
import { CatalogHero } from '@/features/catalog/ui/catalog-hero';
import { CatalogCollectionsSection } from '@/features/catalog/ui/catalog-collections-section';
import { ShopByCategorySection } from '@/features/catalog/ui/shop-by-category-section';
import { JournalTeaserSection } from '@/features/catalog/ui/journal-teaser-section';
import { LocationSection } from '@/components/shared/location-section';
import { resolveSiteUrl, buildCanonicalUrl, hasFacetOrFilterParams, resolveRobotsPolicy } from '@/lib/seo/config';
import catalogData from '@/features/catalog/data/catalog.json';

interface CatalogPageProps {
  params?: Promise<{ locale?: string }>;
  searchParams: Promise<{ category?: string; [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CatalogPageProps): Promise<Metadata> {
  const resolvedParams = params ? await params : undefined;
  const resolvedSearchParams = await searchParams;
  const siteUrl = resolveSiteUrl();
  const canonicalUrl = buildCanonicalUrl('/catalog', { siteUrl, locale: resolvedParams?.locale });
  const hasFilter = hasFacetOrFilterParams(resolvedSearchParams);

  return {
    title: 'Shop the Collection - Angelina Paris',
    description: 'From delicate macarons to rich hot chocolate, explore the full Maison collection.',
    alternates: {
      canonical: canonicalUrl,
    },
    robots: resolveRobotsPolicy({ hasFacetFilters: hasFilter }),
  };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { category } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <CatalogHero data={catalogData.hero} />
      <CatalogCollectionsSection collections={catalogData.collections} />
      <ShopByCategorySection activeSlug={category} />
      <JournalTeaserSection data={catalogData.journal} />
      <LocationSection data={catalogData.location} />
    </main>
  );
}
