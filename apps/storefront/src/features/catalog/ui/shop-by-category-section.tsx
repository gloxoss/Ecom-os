import { getEngine } from '@/lib/engine';
import { Reveal } from '@/features/landing/ui/reveal';
import { CategoryTabsClient } from './category-tabs-client';
import type { ProductTab } from '@/components/shared/product-tabs-client';

interface ShopByCategorySectionProps {
  /** Category slug from `?category=`, e.g. "cadeaux" — undefined/unknown falls back to "all". */
  activeSlug?: string;
}

export async function ShopByCategorySection({ activeSlug }: ShopByCategorySectionProps) {
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

  const activeCategory = categories.find((c) => c.slug === activeSlug);
  const initialActiveId = activeCategory?.id ?? 'all';

  const idToParam: Record<string, string> = { all: 'all' };
  for (const cat of categories) idToParam[cat.id] = cat.slug;

  return (
    <section id="shop" className="bg-background py-20 md:py-25 scroll-mt-20">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col gap-4 mb-12 md:mb-16">
          <p data-reveal className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground">
            Shop the collection
          </p>
          <h2 data-reveal className="font-heading text-[28px] md:text-[36px] leading-[1.25] tracking-[-1px] text-foreground">
            Every signature, in one place
          </h2>
        </div>

        <CategoryTabsClient tabs={tabs} initialActiveId={initialActiveId} idToParam={idToParam} />
      </Reveal>
    </section>
  );
}
