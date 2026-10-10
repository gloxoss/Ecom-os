import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type QuoteBasket,
  type QuoteBasketItem,
  createEmptyBasket,
  addQuoteItem,
  updateQuoteItemQuantity,
  updateQuoteItemNotes,
  removeQuoteItem,
  getQuoteBasketCount,
} from '../../../../../../packages/addons-rfq/src/index';

export interface QuoteStoreState {
  basket: QuoteBasket;
  addItem: (input: {
    productId: string | number;
    variationId?: string | number;
    sku?: string;
    title: string;
    quantity: number;
    notes?: string;
    thumbnail?: string;
    unitPriceEstimated?: number;
  }) => void;
  updateQty: (key: string, quantity: number) => void;
  updateNotes: (key: string, notes: string) => void;
  removeItem: (key: string) => void;
  clearBasket: () => void;
  getItemCount: () => number;
  getItems: () => QuoteBasketItem[];
}

export const useQuoteStore = create<QuoteStoreState>()(
  persist(
    (set, get) => ({
      basket: createEmptyBasket(),
      addItem: (input) =>
        set((state) => ({
          basket: addQuoteItem(state.basket, input),
        })),
      updateQty: (key, quantity) =>
        set((state) => ({
          basket: updateQuoteItemQuantity(state.basket, key, quantity),
        })),
      updateNotes: (key, notes) =>
        set((state) => ({
          basket: updateQuoteItemNotes(state.basket, key, notes),
        })),
      removeItem: (key) =>
        set((state) => ({
          basket: removeQuoteItem(state.basket, key),
        })),
      clearBasket: () =>
        set(() => ({
          basket: createEmptyBasket(),
        })),
      getItemCount: () => getQuoteBasketCount(get().basket),
      getItems: () => get().basket.items,
    }),
    {
      name: 'quote-storage',
    }
  )
);
