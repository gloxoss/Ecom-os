import { notFound } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { ProductHero } from '@/features/product/ui/product-hero';
import { RelatedProductsSection } from '@/features/product/ui/related-products-section';
import { LocationSection } from '@/components/shared/location-section';
import productDetails from '@/features/product/data/product-details.json';
import catalogData from '@/features/catalog/data/catalog.json';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const engine = await getEngine();
  const { items } = await engine.listProducts({ limit: 50 });
  return items.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const engine = await getEngine();
  const product = await engine.getProduct(slug);
  if (!product) return {};
  return {
    title: `${product.name} - Angelina Paris`,
    description: product.description,
  };
}

const DEFAULT_SPECS = [{ label: 'Composition', value: 'See description for details.' }];
const DEFAULT_DESCRIPTION = ['A Maison signature, prepared with the same care as everything else in the collection.'];

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const engine = await getEngine();
  const [product, categories] = await Promise.all([engine.getProduct(slug), engine.listCategories()]);

  if (!product) notFound();

  const details = (productDetails as Record<string, { specs: { label: string; value: string }[]; description: string[] }>)[slug];
  const category = categories.find((c) => product.categories.includes(c.slug));

  const { items: sameCategoryProducts } = await engine.listProducts({ category: product.categories[0], limit: 8 });
  const related = sameCategoryProducts.filter((p) => p.slug !== product.slug).slice(0, 6);

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <ProductHero
        product={product}
        categoryLabel={category?.name ?? 'Maison collection'}
        specs={details?.specs ?? DEFAULT_SPECS}
        description={details?.description ?? DEFAULT_DESCRIPTION}
      />
      <RelatedProductsSection products={related} />
      <LocationSection data={catalogData.location} />
    </main>
  );
}
