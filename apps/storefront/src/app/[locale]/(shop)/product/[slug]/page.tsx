import { notFound } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { ProductHero } from '@/features/product/ui/product-hero';
import { isAddonActive } from '@/lib/addon-capabilities';
import { RelatedProductsSection } from '@/features/product/ui/related-products-section';
import { LocationSection } from '@/components/shared/location-section';
import { JsonLd } from '@/components/seo/json-ld';
import { buildProductMetadata, buildProductJsonLd } from '@/lib/seo/product';
import { buildCanonicalUrl } from '@/lib/seo/config';
import productDetails from '@/features/product/data/product-details.json';
import catalogData from '@/features/catalog/data/catalog.json';

interface ProductPageProps {
  params: Promise<{ slug: string; locale?: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug, locale } = await params;
  const engine = await getEngine();
  const product = await engine.getProduct(slug);
  return buildProductMetadata(product, { locale, brandName: 'Angelina Paris' });
}

const DEFAULT_SPECS = [{ label: 'Composition', value: 'See description for details.' }];
const DEFAULT_DESCRIPTION = ['A Maison signature, prepared with the same care as everything else in the collection.'];

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, locale } = await params;
  const engine = await getEngine();
  const [product, categories] = await Promise.all([engine.getProduct(slug), engine.listCategories()]);

  if (!product) notFound();

  const details = (productDetails as Record<string, { specs: { label: string; value: string }[]; description: string[] }>)[slug];
  const category = categories.find((c) => product.categories.includes(c.slug));

  const { items: sameCategoryProducts } = await engine.listProducts({ category: product.categories[0], limit: 8 });
  const related = sameCategoryProducts.filter((p) => p.slug !== product.slug).slice(0, 6);

  const canonicalUrl = buildCanonicalUrl(`/product/${product.slug}`, { locale });
  const jsonLd = buildProductJsonLd(product, { canonicalUrl, brandName: 'Angelina Paris' });

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <JsonLd data={jsonLd} />
      <ProductHero
        product={product}
        categoryLabel={category?.name ?? 'Maison collection'}
        specs={details?.specs ?? DEFAULT_SPECS}
        description={details?.description ?? DEFAULT_DESCRIPTION}
        quoteEnabled={isAddonActive('quotes')}
      />
      <RelatedProductsSection products={related} />
      <LocationSection data={catalogData.location} />
    </main>
  );
}
