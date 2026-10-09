'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { formatMoney } from '@/lib/format-money';
import Link from 'next/link';
import type { Product } from '@ecom-os/engine';

type Props = {
  product: Product | null;
  onClose: () => void;
};

// Quick-view modal using the native <dialog> element — no lib needed.
// Opens/closes via the open attribute; Escape key closes it automatically.
export function QuickViewModal({ product, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync the open state with the native dialog API
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    product ? dialog.showModal() : dialog.close();
  }, [product]);

  if (!product) return null;

  const image = product.images[0];
  const price = formatMoney(product.price);

  return (
    // Native dialog — blocks background interaction, Escape closes it
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="p-0 rounded-xl max-w-2xl w-full backdrop:bg-black/40 open:flex open:gap-0"
    >
      <div className="flex flex-col sm:flex-row w-full">
        {/* Product image */}
        <div className="relative aspect-[4/5] sm:w-64 flex-shrink-0 bg-gray-100">
          {image && (
            <Image src={image.url} alt={image.altText || product.name} fill className="object-cover rounded-tl-xl rounded-bl-xl" />
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col p-6 gap-4 flex-1">
          <button
            onClick={onClose}
            className="self-end text-secondary hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
          <h2 className="text-xl font-bold">{product.name}</h2>
          <p className="text-lg font-medium">{price}</p>
          <Link
            href={`/product/${product.slug}`}
            className="mt-auto w-full text-center bg-foreground text-background py-3 rounded-lg font-medium hover:opacity-90 transition"
            onClick={onClose}
          >
            View full details
          </Link>
        </div>
      </div>
    </dialog>
  );
}
