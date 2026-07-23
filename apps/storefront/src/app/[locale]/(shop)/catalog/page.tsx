import { CatalogHero } from '@/features/catalog/ui/catalog-hero';
import { CatalogCollectionsSection } from '@/features/catalog/ui/catalog-collections-section';
import { ShopByCategorySection } from '@/features/catalog/ui/shop-by-category-section';
import { JournalTeaserSection } from '@/features/catalog/ui/journal-teaser-section';
import { LocationSection } from '@/components/shared/location-section';
import catalogData from '@/features/catalog/data/catalog.json';

export const metadata = {
  title: 'Shop the Collection - Angelina Paris',
  description: 'From delicate macarons to rich hot chocolate, explore the full Maison collection.',
};

interface CatalogPageProps {
  searchParams: Promise<{ category?: string }>;
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
