'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import type { Product } from '@ecom-os/engine';
import { resolvePurchaseIntent, PurchaseIntent } from '../model/purchase-intent';

interface AddToCartButtonProps {
  product: Product;
  selectedAttributes?: Record<string, string>;
  quantity?: number;
  className?: string;
  onAdded?: (intent: PurchaseIntent) => void;
}

export function AddToCartButton({
  product,
  selectedAttributes = {},
  quantity = 1,
  className = '',
  onAdded,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const intentResult = resolvePurchaseIntent(product, selectedAttributes, quantity);
  const isAvailable = intentResult.success;

  const handleClick = () => {
    if (!intentResult.success) {
      setErrorMessage(intentResult.message);
      return;
    }

    setErrorMessage(null);
    addItem(product);
    setJustAdded(true);
    if (onAdded) {
      onAdded(intentResult.intent);
    }
    setTimeout(() => setJustAdded(false), 1800);
  };

  const getButtonText = () => {
    if (justAdded) return 'Added to bag';
    if (!intentResult.success) {
      if (intentResult.reason === 'OUT_OF_STOCK') return 'Out of stock';
      if (intentResult.reason === 'INCOMPLETE_SELECTION') return 'Select options';
      if (intentResult.reason === 'NOT_PURCHASABLE') return 'Unavailable';
      return 'Unavailable';
    }
    return 'Add to bag';
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={!isAvailable && intentResult.reason !== 'INCOMPLETE_SELECTION'}
        aria-disabled={!isAvailable}
        className={`inline-flex items-center justify-center min-h-[44px] rounded-full px-8 py-3.5 font-body text-[11px] font-medium uppercase tracking-[0.25em] transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none motion-reduce:transition-none w-fit ${
          !isAvailable && intentResult.reason === 'OUT_OF_STOCK'
            ? 'bg-muted text-foreground/40 cursor-not-allowed border border-border'
            : !isAvailable && intentResult.reason === 'INCOMPLETE_SELECTION'
            ? 'bg-foreground/80 text-background hover:bg-foreground cursor-pointer'
            : 'bg-foreground text-background hover:bg-primary cursor-pointer'
        } ${className}`}
      >
        {getButtonText()}
      </button>

      {errorMessage && (
        <p className="font-body text-xs text-red-500 font-medium" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
