'use client';

import React, { useState } from 'react';
import { useQuoteStore } from '../../rfq/model/quote-store';

export interface AddToQuoteButtonProps {
  productId: string | number;
  variationId?: string | number;
  sku?: string;
  title: string;
  unitPriceEstimated?: number;
  thumbnail?: string;
  className?: string;
  locale?: string;
}

/**
 * Discreet secondary action button for B2B Healthcare Professional RFQ.
 * Distinct from standard black-filled AddToCart CTA.
 * Operates purely within the isolated quote basket domain.
 */
export function AddToQuoteButton({
  productId,
  variationId,
  sku,
  title,
  unitPriceEstimated,
  thumbnail,
  className = '',
  locale = 'fr',
}: AddToQuoteButtonProps) {
  const [added, setAdded] = useState(false);
  const addItem = useQuoteStore((state) => state.addItem);

  const handleAddToQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId,
      variationId,
      sku,
      title,
      quantity: 1,
      unitPriceEstimated,
      thumbnail,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const isArabic = locale === 'ar';

  return (
    <button
      type="button"
      onClick={handleAddToQuote}
      className={`inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-accent/40 text-accent hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all ${className}`}
      aria-live="polite"
      aria-label={
        added
          ? isArabic
            ? 'تمت إضافة العنصر إلى طلب عرض السعر'
            : 'Équipement ajouté au devis'
          : isArabic
          ? `طلب عرض سعر مهني لـ ${title}`
          : `Demande de devis professionnel pour ${title}`
      }
    >
      <span className="mr-1.5" aria-hidden="true">
        📋
      </span>
      <span>
        {added
          ? isArabic
            ? 'تمت الإضافة إلى عرض السعر ✓'
            : 'Ajouté au devis ✓'
          : isArabic
          ? 'طلب عرض سعر'
          : 'Ajouter au devis pro'}
      </span>
    </button>
  );
}
