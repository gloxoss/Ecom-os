'use client';
// Mirrors the production Ecom OS cart store API — do not rename members.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/lib/ecom-types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i,
              ),
            };
          }
          return {
            items: [
              ...s.items,
              { id: product.id, productId: product.id, quantity, price: product.price },
            ],
          };
        }),
      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ items: [] }),
      getCartTotal: () =>
        get().items.reduce((sum, i) => sum + i.price.amount_minor * i.quantity, 0),
    }),
    { name: 'cart-storage' },
  ),
);
