'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatMoney } from '@/lib/format-money';
import Link from 'next/link';
import { Product } from '@ecom-os/engine';
import { WishlistButton } from '@/features/product/ui/wishlist-button';
import { QuickViewModal } from './quick-view-modal';

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];

  const priceDisplay = () => {
    if (product.priceRange && product.priceRange.min.amount_minor !== product.priceRange.max.amount_minor) {
      return `${formatMoney(product.priceRange.min)} – ${formatMoney(product.priceRange.max)}`;
    }
    return formatMoney(product.price);
  };

  const isOutOfStock = product.inventory?.status === 'OUT_OF_STOCK';
  const [showQuickView, setShowQuickView] = useState(false);

  return (
    <article className="group relative flex flex-col h-full" aria-labelledby={`product-title-${product.id}`}>
      {/* Product Image and Overlay Controls */}
      <div className="relative aspect-[4/5] bg-muted rounded-lg overflow-hidden mb-4">
        <Link
          href={`/product/${product.slug}`}
          className="block w-full h-full focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none rounded-lg"
          aria-label={`Voir les détails de ${product.name}`}
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.altText || product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover group-hover:scale-105 transition-transform duration-500 motion-reduce:transition-none motion-reduce:transform-none ${
                isOutOfStock ? 'opacity-75' : ''
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
              Aucune image disponible
            </div>
          )}
        </Link>

        {isOutOfStock && (
          <span
            className="absolute top-2 left-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider bg-black/80 text-white rounded"
            role="status"
            aria-label="Produit en rupture de stock"
          >
            Épuisé
          </span>
        )}

        <div className="absolute top-2 right-2 z-10">
          <WishlistButton productId={product.id} />
        </div>

        {/* Quick view button - outside <a> to prevent nested interactive controls */}
        <button
          type="button"
          onClick={() => setShowQuickView(true)}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 min-h-[44px] min-w-[44px] px-4 py-2 text-xs font-medium bg-white/95 text-foreground rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none shadow-sm transition motion-reduce:transition-none"
          aria-label={`Aperçu rapide de ${product.name}`}
        >
          Aperçu rapide
        </button>
      </div>

      {/* Meta and Details */}
      <div className="flex flex-col flex-1">
        {product.brand && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
            {product.brand.name}
          </p>
        )}

        <h3 id={`product-title-${product.id}`} className="font-medium text-sm leading-snug mb-1 text-foreground">
          <Link
            href={`/product/${product.slug}`}
            className="hover:underline focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none rounded"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto pt-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-foreground">
            {priceDisplay()}
          </span>
        </div>
      </div>

      {showQuickView && (
        <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />
      )}
    </article>
  );
}
