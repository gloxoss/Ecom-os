'use client';

import { useCartStore } from '@/stores/cart-store';
import { useState } from 'react';
import { useHydrated } from '@/lib/use-hydrated';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function CartButton() {
  const { items, getCartTotal, getItemCount, removeItem, updateQty } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useHydrated();
  const t = useTranslations('cart');


  const count = mounted ? getItemCount() : 0;
  const total = mounted ? getCartTotal() : 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 text-sm font-medium"
        aria-label={`${t('title')} (${count} items)`}
      >
        {t('title')}
        {count > 0 && (
          <span className="bg-foreground text-background text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <aside className="relative z-10 w-full max-w-md bg-background h-full flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{t('title')} ({count})</h2>
              <button onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <p className="text-secondary text-center py-12">{t('empty')}</p>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4 items-start">
                    {item.images[0] && (
                      <div className="relative w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                        <Image src={item.images[0].url} alt={item.images[0].altText || item.name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-secondary text-sm">${(item.price.amount_minor / 100).toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 border rounded text-sm">−</button>
                        <span className="text-sm w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-6 h-6 border rounded text-sm">+</button>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-secondary hover:text-foreground text-sm">✕</button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t">
                <div className="flex justify-between font-bold text-lg mb-4">
                  <span>{t('total')}</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-foreground text-background text-center py-4 rounded-md font-bold hover:opacity-90 transition"
                >
                  {t('checkout')}
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
