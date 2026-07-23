import { Reveal } from '@/features/landing/ui/reveal';
import { RelatedProductsClient } from './related-products-client';
import type { Product } from '@ecom-os/engine';

interface RelatedProductsSectionProps {
  products: Product[];
}

export function RelatedProductsSection({ products }: RelatedProductsSectionProps) {
  if (!products.length) return null;

  const cards = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    notes: p.description,
    priceLabel: `${(p.price.amount_minor / 100).toFixed(2).replace(/\.00$/, '')}$ /per ${p.variants?.[0]?.name ?? 'bag'}`,
    image: p.images[0],
    hoverImage: p.images[1] ?? p.images[0],
  }));

  return (
    <section className="bg-input py-20 md:py-25 overflow-hidden">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div data-reveal className="flex flex-col gap-3 mb-16 md:mb-20">
          <p className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground">
            Maison collection
          </p>
          <h2 className="font-heading text-[28px] md:text-[36px] leading-[1.25] tracking-[-1px] text-foreground">
            Explore more of the collection
          </h2>
        </div>

        <div data-reveal>
          <RelatedProductsClient cards={cards} />
        </div>
      </Reveal>
    </section>
  );
}
