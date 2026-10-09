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

  const price = formatMoney(product.price);

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
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
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
        <h3 className="font-medium text-foreground">{product.name}</h3>
        <p className="text-secondary">{price}</p>
      </Link>

      {showQuickView && (
        <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />
      )}
    </>
  );
}
