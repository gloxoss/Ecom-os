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
    <>
      {/* "group" lets child elements react to this link's hover state */}
      <Link href={`/product/${product.slug}`} className="group block">
        <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden mb-4">
          {image && (
            <Image
              src={image.url}
              alt={image.altText || product.name}
              fill
              // Hints the browser which image size to download per viewport
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
                isOutOfStock ? 'opacity-75' : ''
              }`}
            />
          )}

          {isOutOfStock && (
            <span className="absolute top-2 left-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider bg-black/80 text-white rounded">
              Out of stock
            </span>
          )}

          <WishlistButton productId={product.id} />

          {/* Quick-view button — appears on hover, opens modal without navigating */}
          <button
            onClick={e => { e.preventDefault(); setShowQuickView(true); }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 text-xs font-medium bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Quick view
          </button>
        </div>
        {product.brand && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
            {product.brand.name}
          </p>
        )}
        <h3 className="font-medium text-foreground">{product.name}</h3>
        <p className="text-secondary">{priceDisplay()}</p>
      </Link>

      {showQuickView && (
        <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />
      )}
    </>
  );
}
