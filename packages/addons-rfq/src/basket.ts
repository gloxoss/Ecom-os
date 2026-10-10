import type { RfqItem } from './types';

export interface QuoteBasketItem {
  key: string;
  productId: string | number;
  variationId?: string | number;
  sku?: string;
  title: string;
  quantity: number;
  notes?: string;
  thumbnail?: string;
  unitPriceEstimated?: number;
  addedAt: string;
}

export interface QuoteBasket {
  items: QuoteBasketItem[];
  updatedAt: string;
}

export function createItemKey(productId: string | number, variationId?: string | number): string {
  const p = String(productId).trim();
  const v = variationId !== undefined && variationId !== null && String(variationId).trim() !== ''
    ? String(variationId).trim()
    : '0';
  return `${p}:${v}`;
}

export function createEmptyBasket(): QuoteBasket {
  return {
    items: [],
    updatedAt: new Date().toISOString(),
  };
}

export function addQuoteItem(
  basket: QuoteBasket,
  input: {
    productId: string | number;
    variationId?: string | number;
    sku?: string;
    title: string;
    quantity: number;
    notes?: string;
    thumbnail?: string;
    unitPriceEstimated?: number;
  },
  now: string = new Date().toISOString()
): QuoteBasket {
  if (input.quantity <= 0) {
    return basket;
  }

  const key = createItemKey(input.productId, input.variationId);
  const existingIndex = basket.items.findIndex(item => item.key === key);

  if (existingIndex >= 0) {
    const existing = basket.items[existingIndex]!;
    const updatedItems = [...basket.items];
    updatedItems[existingIndex] = {
      ...existing,
      quantity: existing.quantity + input.quantity,
      notes: input.notes !== undefined ? input.notes : existing.notes,
    };
    return {
      items: updatedItems,
      updatedAt: now,
    };
  }

  const newItem: QuoteBasketItem = {
    key,
    productId: input.productId,
    variationId: input.variationId,
    sku: input.sku,
    title: input.title,
    quantity: input.quantity,
    notes: input.notes,
    thumbnail: input.thumbnail,
    unitPriceEstimated: input.unitPriceEstimated,
    addedAt: now,
  };

  return {
    items: [...basket.items, newItem],
    updatedAt: now,
  };
}

export function updateQuoteItemQuantity(
  basket: QuoteBasket,
  key: string,
  quantity: number,
  now: string = new Date().toISOString()
): QuoteBasket {
  if (quantity <= 0) {
    return removeQuoteItem(basket, key, now);
  }

  const updatedItems = basket.items.map(item => {
    if (item.key === key) {
      return { ...item, quantity };
    }
    return item;
  });

  return {
    items: updatedItems,
    updatedAt: now,
  };
}

export function updateQuoteItemNotes(
  basket: QuoteBasket,
  key: string,
  notes: string,
  now: string = new Date().toISOString()
): QuoteBasket {
  const updatedItems = basket.items.map(item => {
    if (item.key === key) {
      return { ...item, notes };
    }
    return item;
  });

  return {
    items: updatedItems,
    updatedAt: now,
  };
}

export function removeQuoteItem(
  basket: QuoteBasket,
  key: string,
  now: string = new Date().toISOString()
): QuoteBasket {
  return {
    items: basket.items.filter(item => item.key !== key),
    updatedAt: now,
  };
}

export function getQuoteBasketCount(basket: QuoteBasket): number {
  return basket.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function toRfqItems(basket: QuoteBasket): RfqItem[] {
  return basket.items.map(item => ({
    productId: item.productId,
    variationId: item.variationId,
    sku: item.sku,
    title: item.title,
    quantity: item.quantity,
    customerNotes: item.notes,
  }));
}
