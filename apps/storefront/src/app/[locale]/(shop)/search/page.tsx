import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getEngine } from '@/lib/engine';
import { routing } from '@/i18n/routing';
import { ProductGrid } from '@/features/catalog/ui/product-grid';
import { Pagination } from '@/components/shared/pagination';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Search - Angelina Paris',
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const page = parseInt(resolvedParams.page || '1', 10);
  const limit = 24;
  const offset = (page - 1) * limit;

  const t = await getTranslations('search');
  const engine = await getEngine();

  const result = await engine.listProducts({
    search: query,
    limit,
    offset,
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <div className="mb-8 border-b pb-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <form action={locale === routing.defaultLocale ? '/search' : `/${locale}/search`} method="GET" className="flex max-w-md gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder={t('placeholder')}
            className="flex-1 px-4 py-2 border rounded-md"
          />
          <button type="submit" className="px-6 py-2 bg-foreground text-background rounded-md">
            {t('button')}
          </button>
        </form>
      </div>

      {query && (
        <p className="text-secondary text-sm mb-8">
          {result.total === 0
            ? t('empty', { query })
            : t('results', { total: result.total, query })}
        </p>
      )}

      {result.items.length > 0 && (
        <>
          <ProductGrid products={result.items} />
          <Pagination totalItems={result.total} pageSize={limit} currentPage={page} />
        </>
      )}
    </main>
  );
}
