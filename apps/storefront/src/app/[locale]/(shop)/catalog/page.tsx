import { getTranslations } from 'next-intl/server';
import { getEngine } from '@/lib/engine';
import { ProductGrid } from '@/features/catalog/ui/product-grid';
import { CategoryPills } from '@/features/catalog/ui/category-pills';
import { FilterSidebar } from '@/features/catalog/ui/filter-sidebar';
import { SortSelect } from '@/features/catalog/ui/sort-select';
import { ActiveFilters } from '@/features/catalog/ui/active-filters';
import { Pagination } from '@/components/shared/pagination';

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; min?: string; max?: string; sort?: string }>;
}) {
  const { locale } = await params;
  const { page: rawPage, min, max, sort } = await searchParams;

  const page = parseInt(rawPage || '1', 10);
  const minPrice = min ? parseFloat(min) : undefined;
  const maxPrice = max ? parseFloat(max) : undefined;
  const limit = 24;
  const offset = (page - 1) * limit;

  const t = await getTranslations('catalog');
  const engine = await getEngine();

  const [result, categories] = await Promise.all([
    engine.listProducts({ limit, offset, minPrice, maxPrice, sort }),
    engine.listCategories(locale),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6">{t('title')}</h1>

      <CategoryPills categories={categories} />

      <p className="text-secondary text-sm mb-4">{t('showing', { count: result.total })}</p>

      <div className="flex justify-end mb-4">
        <SortSelect currentSort={sort} />
      </div>

      <ActiveFilters min={minPrice} max={maxPrice} sort={sort} />

      <div className="flex flex-col md:flex-row gap-8">
        <FilterSidebar minPrice={minPrice} maxPrice={maxPrice} />

        <div className="flex-1">
          <ProductGrid products={result.items} />
          <Pagination
            totalItems={result.total}
            pageSize={limit}
            currentPage={page}
          />
        </div>
      </div>
    </main>
  );
}