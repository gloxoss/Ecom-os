'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuoteStore } from '../model/quote-store';

export function QuoteBuilder() {
  const basket = useQuoteStore(state => state.basket);
  const updateQty = useQuoteStore(state => state.updateQty);
  const updateNotes = useQuoteStore(state => state.updateNotes);
  const removeItem = useQuoteStore(state => state.removeItem);
  const clearBasket = useQuoteStore(state => state.clearBasket);
  const [editingNotesKey, setEditingNotesKey] = useState<string | null>(null);

  const itemCount = basket.items.reduce((sum, item) => sum + item.quantity, 0);

  if (basket.items.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="empty-quote-basket">
        <h2 className="text-xl font-semibold mb-2">Votre panier de devis est vide</h2>
        <p className="text-muted-foreground mb-6">
          Ajoutez des produits ou variations depuis le catalogue pour constituer votre demande de devis personnalisé.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Parcourir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="quote-builder">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Demande de devis</h1>
          <p className="text-sm text-muted-foreground">
            {itemCount} {itemCount > 1 ? 'articles sélectionnés' : 'article sélectionné'} pour tarification
          </p>
        </div>
        <button
          onClick={clearBasket}
          className="text-xs text-muted-foreground hover:text-destructive underline"
          aria-label="Vider le panier de devis"
        >
          Tout vider
        </button>
      </div>

      <div className="space-y-4">
        {basket.items.map((item) => (
          <div
            key={item.key}
            data-testid={`quote-item-${item.key}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card gap-4"
          >
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-base">{item.title}</span>
                {item.sku && (
                  <span className="text-xs font-mono text-muted-foreground">SKU: {item.sku}</span>
                )}
              </div>

              {item.variationId && (
                <div className="text-xs text-muted-foreground mt-1">
                  Variation ID: {item.variationId}
                </div>
              )}

              {item.notes && (
                <p className="text-xs italic bg-muted/50 p-2 rounded mt-2 text-muted-foreground">
                  Note: {item.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-md">
                <button
                  type="button"
                  onClick={() => updateQty(item.key, item.quantity - 1)}
                  className="px-3 py-1 text-sm hover:bg-muted"
                  aria-label={`Diminuer la quantité de ${item.title}`}
                >
                  -
                </button>
                <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQty(item.key, item.quantity + 1)}
                  className="px-3 py-1 text-sm hover:bg-muted"
                  aria-label={`Augmenter la quantité de ${item.title}`}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => setEditingNotesKey(editingNotesKey === item.key ? null : item.key)}
                className="text-xs text-primary underline"
                aria-label={`Ajouter ou modifier une note pour ${item.title}`}
              >
                {item.notes ? 'Modifier note' : 'Ajouter note'}
              </button>

              <button
                type="button"
                onClick={() => removeItem(item.key)}
                className="text-xs text-destructive hover:underline"
                aria-label={`Supprimer ${item.title}`}
              >
                Supprimer
              </button>
            </div>

            {editingNotesKey === item.key && (
              <div className="w-full mt-2 pt-2 border-t flex gap-2">
                <input
                  type="text"
                  defaultValue={item.notes || ''}
                  placeholder="Instructions spécifiques pour cet article..."
                  className="flex-1 px-3 py-1.5 text-xs rounded border bg-background"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateNotes(item.key, e.currentTarget.value);
                      setEditingNotesKey(null);
                    }
                  }}
                  onBlur={(e) => {
                    updateNotes(item.key, e.target.value);
                    setEditingNotesKey(null);
                  }}
                  autoFocus
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sticky / Fixed Bottom Summary Sheet */}
      <div className="sticky bottom-4 bg-background border rounded-lg p-4 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">Articles au devis: </span>
          <span className="font-bold">{itemCount}</span>
          <p className="text-xs text-muted-foreground">Tarifs et frais calculés sur proposition sur-mesure</p>
        </div>
        <Link
          href="/devis/review"
          className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          Finaliser la demande
        </Link>
      </div>
    </div>
  );
}
