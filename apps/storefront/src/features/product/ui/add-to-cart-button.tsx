'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import type { Product } from '@ecom-os/engine';

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = () => {
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-4 font-body text-[11px] font-medium uppercase tracking-[0.25em] text-background transition-colors duration-300 hover:bg-primary cursor-pointer w-fit"
    >
      {justAdded ? 'Added to bag' : 'Add to bag'}
    </button>
  );
}
