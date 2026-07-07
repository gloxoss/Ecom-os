'use client';

import { Product } from '@ecom-os/engine';
import { useCartStore } from '@/stores/cart-store';
import { useTranslations } from 'next-intl';

export function AddToCart({ product }: { product: Product }) {
  const addItem = useCartStore(state => state.addItem);
  const t = useTranslations('product');

  return (
    <button
      onClick={() => addItem(product)}
      className="bg-foreground text-background px-8 py-4 rounded-md font-medium hover:opacity-90 transition-opacity w-full mt-8"
    >
      {t('addToCart')}
    </button>
  );
}
