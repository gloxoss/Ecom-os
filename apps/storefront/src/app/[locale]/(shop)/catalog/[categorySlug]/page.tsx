import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getTranslations } from 'next-intl/server';
import { ProductGrid } from '@/features/catalog/ui/product-grid';
import { Pagination } from '@/components/shared/pagination';
import { JsonLd } from '@/components/seo/json-ld';
import { buildCanonicalUrl, resolveSiteUrl, hasFacetOrFilterParams, resolveRobotsPolicy } from '@/lib/seo/config';
import { buildCategoryJsonLd } from '@/lib/seo/product';
import Link from 'next/link';

interface CategoryPageProps {
  params: Promise<{ locale: string; categorySlug: string }>;
  searchParams: Promise<{ page?: string; [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { categorySlug, locale } = await params;
  const resolvedSearchParams = await searchParams;
  const engine = await getEngine();
  const categories = await engine.listCategories(locale);
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) return {};

  const siteUrl = resolveSiteUrl();
  const canonicalUrl = buildCanonicalUrl(`/catalog/${categorySlug}`, { siteUrl, locale });
  const hasFilter = hasFacetOrFilterParams(resolvedSearchParams);

  return {
    title: `${category.name} - Angelina Paris`,
    description: category.description || `Browse our collection of ${category.name}.`,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: resolveRobotsPolicy({ hasFacetFilters: hasFilter }),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { categorySlug, locale } = await params;
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10);
  const limit = 24;
  const offset = (page - 1) * limit;

  const engine = await getEngine();
  const t = await getTranslations('catalog');

  const [categories, result] = await Promise.all([
    engine.listCategories(locale),
    engine.listProducts({ limit, offset, category: categorySlug }),
  ]);

  const category = categories.find(c => c.slug === categorySlug);
  if (!category) notFound();

  const siteUrl = resolveSiteUrl();
  const canonicalUrl = buildCanonicalUrl(`/catalog/${category.slug}`, { siteUrl, locale });
  const jsonLd = buildCategoryJsonLd(category, { canonicalUrl, siteUrl });

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <JsonLd data={jsonLd} />
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/catalog"
          className="px-4 py-2 rounded-full text-sm border border-foreground/20 hover:bg-muted transition"
        >
          {t('allProducts')}
        </Link>
        {categories.map(c => (
          <Link
            key={c.id}
            href={`/catalog/${c.slug}`}
            className={`px-4 py-2 rounded-full text-sm border transition ${
              c.slug === categorySlug
                ? 'bg-foreground text-background border-foreground'
                : 'border-foreground/20 hover:bg-muted'
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
      <p className="text-secondary text-sm mb-8">{t('showing', { count: result.total })}</p>

      {result.items.length === 0
        ? <p className="text-secondary py-20 text-center">{t('noResults')}</p>
        : (
            <>
              <ProductGrid products={result.items} />
              <Pagination 
                totalItems={result.total} 
                pageSize={limit} 
                currentPage={page} 
              />
            </>
          )
      }
    </main>
  );
}
