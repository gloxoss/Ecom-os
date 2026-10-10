import type { Product, Variation, Money } from '@ecom-os/engine';

export interface PurchaseIntent {
  productId: string;
  variationId?: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
  variationName?: string;
  attributes?: Record<string, string>;
}

export type PurchaseIntentFailureReason =
  | 'INCOMPLETE_SELECTION'
  | 'OUT_OF_STOCK'
  | 'NOT_PURCHASABLE'
  | 'INVALID_VARIATION'
  | 'INVALID_QUANTITY'
  | 'PRODUCT_UNAVAILABLE';

export type PurchaseIntentResult =
  | { success: true; intent: PurchaseIntent }
  | { success: false; reason: PurchaseIntentFailureReason; message: string };

export function findMatchingVariation(
  variations: Variation[],
  selectedAttributes: Record<string, string>
): Variation | null {
  if (!variations || variations.length === 0) return null;

  for (const v of variations) {
    if (!v.attributes || v.attributes.length === 0) continue;
    const matchesAll = v.attributes.every((attr) => {
      const selectedVal = selectedAttributes[attr.name] ?? selectedAttributes[attr.label || ''];
      return selectedVal !== undefined && selectedVal.toLowerCase() === attr.value.toLowerCase();
    });
    if (matchesAll) return v;
  }
  return null;
}

export function getRequiredAttributeNames(variations: Variation[]): string[] {
  const names = new Set<string>();
  for (const v of variations) {
    for (const a of v.attributes || []) {
      names.add(a.name);
    }
  }
  return Array.from(names);
}

export function resolvePurchaseIntent(
  product: Product,
  selectedAttributes: Record<string, string> = {},
  quantity: number = 1
): PurchaseIntentResult {
  if (!product) {
    return { success: false, reason: 'PRODUCT_UNAVAILABLE', message: 'Product is unavailable.' };
  }

  if (product.isPurchasable === false) {
    return { success: false, reason: 'NOT_PURCHASABLE', message: 'This item is not available for purchase.' };
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { success: false, reason: 'INVALID_QUANTITY', message: 'Quantity must be at least 1.' };
  }

  const variations = product.variations || product.variants || [];
  const isVariable = product.type === 'variable' || variations.length > 0;

  if (isVariable) {
    const requiredAttrs = getRequiredAttributeNames(variations);
    const missingAttrs = requiredAttrs.filter((attr) => !selectedAttributes[attr]);

    if (missingAttrs.length > 0) {
      return {
        success: false,
        reason: 'INCOMPLETE_SELECTION',
        message: `Please select option for: ${missingAttrs.join(', ')}.`,
      };
    }

    const variation = findMatchingVariation(variations, selectedAttributes);
    if (!variation) {
      return {
        success: false,
        reason: 'INVALID_VARIATION',
        message: 'The selected combination is unavailable.',
      };
    }

    if (variation.isPurchasable === false || variation.inventory?.status === 'OUT_OF_STOCK') {
      return {
        success: false,
        reason: 'OUT_OF_STOCK',
        message: 'The selected variation is out of stock.',
      };
    }

    if (
      variation.inventory?.quantity !== null &&
      variation.inventory?.quantity !== undefined &&
      !variation.inventory.backordersAllowed &&
      quantity > variation.inventory.quantity
    ) {
      return {
        success: false,
        reason: 'OUT_OF_STOCK',
        message: `Only ${variation.inventory.quantity} units available in stock.`,
      };
    }

    const intent: PurchaseIntent = {
      productId: product.id,
      variationId: variation.id,
      sku: variation.sku || product.sku || '',
      quantity,
      unitPrice: variation.price,
      variationName: variation.name,
      attributes: selectedAttributes,
    };

    return { success: true, intent };
  }

  // Simple product
  if (product.inventory?.status === 'OUT_OF_STOCK') {
    return { success: false, reason: 'OUT_OF_STOCK', message: 'This item is currently out of stock.' };
  }

  if (
    product.inventory?.quantity !== null &&
    product.inventory?.quantity !== undefined &&
    !product.inventory.backordersAllowed &&
    quantity > product.inventory.quantity
  ) {
    return {
      success: false,
      reason: 'OUT_OF_STOCK',
      message: `Only ${product.inventory.quantity} units available in stock.`,
    };
  }

  const intent: PurchaseIntent = {
    productId: product.id,
    sku: product.sku || '',
    quantity,
    unitPrice: product.price,
  };

  return { success: true, intent };
}

