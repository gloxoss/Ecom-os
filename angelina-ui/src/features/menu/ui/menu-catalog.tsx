import { getEngine } from '@/lib/engine';
import { ProductTabsClient, type ProductTab } from '@/components/shared/product-tabs-client';

export async function MenuCatalog() {
  const engine = await getEngine();
  const [categories, result] = await Promise.all([
    engine.listCategories(),
    engine.listProducts({ limit: 50 }),
  ]);

  const toCard = (p: (typeof result.items)[number]) => ({
    slug: p.slug,
    name: p.name,
    notes: p.description,
    priceLabel: `${(p.price.amount_minor / 100).toFixed(2).replace(/\.00$/, '')}$ /per ${p.variants?.[0]?.name ?? 'bag'}`,
    image: p.images[0],
    hoverImage: p.images[1] ?? p.images[0],
  });

  const tabs: ProductTab[] = [
    { id: 'all', label: 'All Products', cards: result.items.map(toCard) },
    ...categories.map((cat) => ({
      id: cat.id,
      label: cat.name,
      cards: result.items.filter((p) => p.categories.includes(cat.slug)).map(toCard),
    })),
  ];

  return (
    <section className="section py-16 md:py-24" id="catalog-section">
      <div className="container mx-auto px-4 md:px-8">
        <ProductTabsClient tabs={tabs} size="md" withDivider />
      </div>
    </section>
  );
}
