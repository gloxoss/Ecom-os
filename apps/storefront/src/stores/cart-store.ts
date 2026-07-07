import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@ecom-os/engine';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  coupon: { code: string; discount_minor: number; description: string } | null;
  shippingMethod: { id: string; title: string; cost_minor: number } | null;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
  applyCoupon: (coupon: { code: string; discount_minor: number; description: string }) => void;
  removeCoupon: () => void;
  setShippingMethod: (method: { id: string; title: string; cost_minor: number } | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      shippingMethod: null,
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find(i => i.id === product.id);
          if (existing) {
            return { items: state.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter(i => i.id !== productId) })),
      updateQty: (productId, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter(i => i.id !== productId)
            : state.items.map(i => i.id === productId ? { ...i, quantity } : i),
        })),
      clearCart: () => set({ items: [], coupon: null, shippingMethod: null }),
      getCartTotal: () => {
        const subtotal = get().items.reduce((sum, item) => sum + item.price.amount_minor * item.quantity, 0);
        const discount = get().coupon?.discount_minor || 0;
        const shipping = get().shippingMethod?.cost_minor || 0;
        return Math.max(0, subtotal - discount) + shipping;
      },
      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),
      setShippingMethod: (shippingMethod) => set({ shippingMethod }),
    }),
    { name: 'cart-storage' }
  )
);
