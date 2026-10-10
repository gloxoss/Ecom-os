'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/format-money';
import { Accordion } from '@/components/shared/accordion';
import { Reveal } from '@/features/landing/ui/reveal';
import { AddToCartButton } from './add-to-cart-button';
import { VariationSelector } from './variation-selector';
import { ProductZoomImage } from './product-zoom-image';
import { findMatchingVariation } from '../model/purchase-intent';
import type { Product, Money, Variation } from '@ecom-os/engine';

const fmt = (m: Money) => formatMoney(m);

interface ProductHeroProps {
  product: Product;
  categoryLabel: string;
  specs: { label: string; value: string }[];
  description: string[];
}

const SHIPPING_INFO =
  'Orders placed before 2pm ship the same day. Standard shipping arrives in 3–5 business days; express in 1–2. Secure insured courier delivery.';
const RETURNS_INFO =
  'Unopened and unused items can be returned within 14 days for a full refund or exchange according to terms.';

export function ProductHero({ product, categoryLabel, specs, description }: ProductHeroProps) {
  const variations = product.variations || product.variants || [];
  const isVariable = product.type === 'variable' || variations.length > 0;

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const selectedVariation: Variation | null = isVariable
    ? findMatchingVariation(variations, selectedAttributes)
    : null;

  const handleSelectAttribute = (name: string, value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const activeImage = selectedVariation?.image || product.images[0];
  const activeSku = selectedVariation?.sku || product.sku;

  const currentPriceDisplay = () => {
    if (selectedVariation) {
      return fmt(selectedVariation.price);
    }
    if (product.priceRange) {
      const minStr = fmt(product.priceRange.min);
      const maxStr = fmt(product.priceRange.max);
      return minStr === maxStr ? minStr : `${minStr} – ${maxStr}`;
    }
    return fmt(product.price);
  };

  const currentStockStatus = () => {
    const inv = selectedVariation ? selectedVariation.inventory : product.inventory;
    if (!inv) return null;
    if (inv.status === 'OUT_OF_STOCK') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Out of stock</span>;
    }
    if (inv.status === 'ON_BACKORDER') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Available on backorder</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In stock</span>;
  };

  return (
    <section className="pt-[140px] md:pt-[160px] pb-16 md:pb-20">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div data-reveal>
            {activeImage && <ProductZoomImage image={activeImage} badgeImage={product.images[1]} />}
          </div>

          <div className="flex flex-col gap-8">
            <div data-reveal className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground/60">
                  {categoryLabel}
                </p>
                {product.brand && (
                  <span className="font-body text-xs font-medium uppercase tracking-[1px] text-foreground/70 bg-muted px-2.5 py-1 rounded">
                    {product.brand.name}
                  </span>
                )}
              </div>
              <h1 className="font-heading text-[36px] md:text-[46px] leading-[1.1] tracking-tight text-foreground">
                {product.name}
              </h1>
              {activeSku && (
                <p className="font-body text-xs text-foreground/50 tracking-wider">
                  SKU: {activeSku}
                </p>
              )}
              {product.description && (
                <p className="font-body text-base text-foreground/60">{product.description}</p>
              )}
            </div>

            <div data-reveal className="flex flex-col gap-6 border-t border-border pt-6">
              <div className="flex items-baseline justify-between">
                <p className="font-heading text-2xl md:text-3xl text-foreground">
                  {currentPriceDisplay()}
                </p>
                {currentStockStatus()}
              </div>

              {isVariable && (
                <VariationSelector
                  product={product}
                  selectedAttributes={selectedAttributes}
                  onSelectAttribute={handleSelectAttribute}
                />
              )}

              <AddToCartButton product={product} selectedAttributes={selectedAttributes} />

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
