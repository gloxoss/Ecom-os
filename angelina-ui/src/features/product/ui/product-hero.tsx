import { Accordion } from '@/components/shared/accordion';
import { Reveal } from '@/features/landing/ui/reveal';
import { AddToCartButton } from './add-to-cart-button';
import { ProductZoomImage } from './product-zoom-image';
import type { Product, Money } from '@/lib/ecom-types';

const fmt = (m: Money) => `${(m.amount_minor / 100).toFixed(2).replace(/\.00$/, '')}$`;

interface ProductHeroProps {
  product: Product;
  categoryLabel: string;
  specs: { label: string; value: string }[];
  description: string[];
}

const SHIPPING_INFO =
  'Orders placed before 2pm ship the same day. Standard shipping arrives in 3–5 business days; express in 1–2. Pastries and other fresh items are packed with ice packs and next-day delivery only.';
const RETURNS_INFO =
  'Unopened épicerie fine and gift items can be returned within 14 days for a full refund. Fresh pastries, chocolates, and perishable items are final sale once delivered, given their short shelf life.';

export function ProductHero({ product, categoryLabel, specs, description }: ProductHeroProps) {
  const weight = product.variants?.[0]?.name;

  return (
    <section className="pt-[140px] md:pt-[160px] pb-16 md:pb-20">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div data-reveal>
            <ProductZoomImage image={product.images[0]} badgeImage={product.images[1]} />
          </div>

          <div className="flex flex-col gap-8">
            <div data-reveal className="flex flex-col gap-3">
              <p className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground/60">
                {categoryLabel}
              </p>
              <h1 className="font-heading text-[36px] md:text-[46px] leading-[1.1] tracking-tight text-foreground">
                {product.name}
              </h1>
              <p className="font-body text-base text-foreground/60">{product.description}</p>
            </div>

            <div data-reveal className="flex flex-col gap-6 border-t border-border pt-6">
              <p className="font-heading text-2xl md:text-3xl text-foreground">
                {fmt(product.price)}
                {weight && <span className="font-body text-base text-foreground/50"> /per {weight}</span>}
              </p>

              <div className="flex flex-col gap-4">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex flex-col gap-0.5">
                    <p className="font-body text-xs font-medium uppercase tracking-[1.4px] text-foreground">
                      {spec.label}
                    </p>
                    <p className="font-body text-sm text-foreground/60">{spec.value}</p>
                  </div>
                ))}
              </div>

              <AddToCartButton product={product} />
            </div>

            <div data-reveal className="flex flex-col gap-4 pt-4">
              <h2 className="font-heading text-xl text-foreground">Description</h2>
              {description.map((paragraph) => (
                <p key={paragraph} className="font-body text-sm leading-[1.6] text-foreground/70">
                  {paragraph}
                </p>
              ))}
            </div>

            <div data-reveal>
              <Accordion
                items={[
                  { title: 'Payment & Shipping Information', content: SHIPPING_INFO },
                  { title: 'Exchanges & Returns', content: RETURNS_INFO },
                ]}
                defaultOpenIndex={null}
              />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
