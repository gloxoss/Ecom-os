import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Money } from '@ecom-os/engine';

/**
 * A cart line is a parent product plus an optional variation. The composite key
 * keeps two variations of one product as distinct lines instead of merging them.
 */
export function lineKeyFor(productId: string, variationId?: string): string {
  return variationId ? `${productId}::${variationId}` : productId;
}

export interface CartItem extends Product {
  quantity: number;
  variationId?: string;
  variationName?: string;
  lineKey: string;
}

export interface AddItemOptions {
  quantity?: number;
  variationId?: string;
  variationName?: string;
  /** Selected variation price for optimistic display; Woo remains authoritative. */
  unitPrice?: Money;
}

/**
 * Resolves a line key, tolerating carts persisted before lines carried lineKey.
 * A legacy item has no variationId, so its key is just the product id.
 */
export function resolveLineKey(item: Pick<CartItem, 'id' | 'variationId'> & { lineKey?: string }): string {
  return item.lineKey || lineKeyFor(item.id, item.variationId);
}

interface CartState {
  items: CartItem[];
  coupon: { code: string; discount_minor: number; description: string } | null;
  shippingMethod: { id: string; title: string; cost_minor: number } | null;
  addItem: (product: Product, options?: AddItemOptions) => void;
  removeItem: (lineKey: string) => void;
  updateQty: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
  applyCoupon: (coupon: { code: string; discount_minor: number; description: string }) => void;
  removeCoupon: () => void;
  setShippingMethod: (method: { id: string; title: string; cost_minor: number } | null) => void;
}

function normalizeQuantity(quantity: number | undefined): number {
  return typeof quantity === 'number' && Number.isInteger(quantity) && quantity >= 1 ? quantity : 1;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      shippingMethod: null,
      addItem: (product, options = {}) =>
        set((state) => {
          const quantity = normalizeQuantity(options.quantity);
          const key = lineKeyFor(product.id, options.variationId);
          const existing = state.items.find((item) => resolveLineKey(item) === key);

          if (existing) {
            return {
              items: state.items.map((item) =>
                resolveLineKey(item) === key ? { ...item, quantity: item.quantity + quantity } : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...product,
                ...(options.unitPrice ? { price: options.unitPrice } : {}),
                lineKey: key,
                quantity,
                ...(options.variationId ? { variationId: options.variationId } : {}),
                ...(options.variationName ? { variationName: options.variationName } : {}),
              },
            ],
          };
        }),
      removeItem: (lineKey) =>
        set((state) => ({ items: state.items.filter((item) => resolveLineKey(item) !== lineKey) })),
      updateQty: (lineKey, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => resolveLineKey(item) !== lineKey)
              : state.items.map((item) => (resolveLineKey(item) === lineKey ? { ...item, quantity } : item)),
        })),
      clearCart: () => set({ items: [], coupon: null, shippingMethod: null }),
      getCartTotal: () => {
        const subtotal = get().items.reduce((sum, item) => sum + item.price.amount_minor * item.quantity, 0);
        const discount = get().coupon?.discount_minor || 0;
        const shipping = get().shippingMethod?.cost_minor || 0;
        return Math.max(0, subtotal - discount) + shipping;
      },
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),
      setShippingMethod: (shippingMethod) => set({ shippingMethod }),
    }),
    {
      name: 'cart-storage',
      // Normalize legacy persisted lines so in-memory items always carry a lineKey.
      merge: (persisted, current) => {
        const restored = (persisted ?? {}) as Partial<CartState>;
        const items = Array.isArray(restored.items)
          ? restored.items.map((item) => ({ ...item, lineKey: resolveLineKey(item) }))
          : [];
        return { ...current, ...restored, items };
      },
    }
  )
);
