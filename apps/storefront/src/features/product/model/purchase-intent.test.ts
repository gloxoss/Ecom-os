import { describe, it, expect } from 'vitest';
import { resolvePurchaseIntent, findMatchingVariation, getRequiredAttributeNames } from './purchase-intent';
import type { Product, Variation } from '@ecom-os/engine';

describe('Purchase intent resolution and variation selection', () => {
  const simpleProduct: Product = {
    id: 'prod-simple-1',
    slug: 'stethoscope-classic',
    name: 'Classic Stethoscope',
    sku: 'STETH-01',
    type: 'simple',
    description: 'High quality stethoscope',
    price: { amount_minor: 45000, currency: 'MAD' },
    images: [{ url: 'https://example.com/steth.jpg', altText: 'Stethoscope' }],
    categories: ['diagnostic'],
    isPurchasable: true,
    inventory: {
      status: 'IN_STOCK',
      quantity: 10,
      backordersAllowed: false,
      isPurchasable: true,
    },
  };

  const variations: Variation[] = [
    {
      id: 'var-blue-m',
      sku: 'SCRUB-BLU-M',
      name: 'Medical Scrub - Blue / Medium',
      price: { amount_minor: 25000, currency: 'MAD' },
      stock_quantity: 5,
      isPurchasable: true,
      inventory: {
        status: 'IN_STOCK',
        quantity: 5,
        backordersAllowed: false,
        isPurchasable: true,
      },
      attributes: [
        { name: 'Color', value: 'Blue', label: 'Color' },
        { name: 'Size', value: 'M', label: 'Size' },
      ],
    },
    {
      id: 'var-blue-l',
      sku: 'SCRUB-BLU-L',
      name: 'Medical Scrub - Blue / Large',
      price: { amount_minor: 26000, currency: 'MAD' },
      stock_quantity: 0,
      isPurchasable: false,
      inventory: {
        status: 'OUT_OF_STOCK',
        quantity: 0,
        backordersAllowed: false,
        isPurchasable: false,
      },
      attributes: [
        { name: 'Color', value: 'Blue', label: 'Color' },
        { name: 'Size', value: 'L', label: 'Size' },
      ],
    },
    {
      id: 'var-green-m',
      sku: 'SCRUB-GRN-M',
      name: 'Medical Scrub - Green / Medium',
      price: { amount_minor: 25000, currency: 'MAD' },
      stock_quantity: 8,
      isPurchasable: true,
      inventory: {
        status: 'IN_STOCK',
        quantity: 8,
        backordersAllowed: false,
        isPurchasable: true,
      },
      attributes: [
        { name: 'Color', value: 'Green', label: 'Color' },
        { name: 'Size', value: 'M', label: 'Size' },
      ],
    },
  ];

  const variableProduct: Product = {
    id: 'prod-var-1',
    slug: 'medical-scrub',
    name: 'Medical Scrub Suit',
    sku: 'SCRUB-PARENT',
    type: 'variable',
    description: 'Cotton medical scrub',
    price: { amount_minor: 25000, currency: 'MAD' },
    priceRange: {
      min: { amount_minor: 25000, currency: 'MAD' },
      max: { amount_minor: 26000, currency: 'MAD' },
    },
    images: [{ url: 'https://example.com/scrub.jpg', altText: 'Scrub' }],
    categories: ['apparel'],
    isPurchasable: true,
    variations,
  };

  describe('simple products', () => {
    it('resolves valid in-stock simple product purchase intent', () => {
      const res = resolvePurchaseIntent(simpleProduct, {}, 2);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.intent.productId).toBe('prod-simple-1');
        expect(res.intent.sku).toBe('STETH-01');
        expect(res.intent.quantity).toBe(2);
        expect(res.intent.unitPrice).toEqual({ amount_minor: 45000, currency: 'MAD' });
        expect(res.intent.variationId).toBeUndefined();
      }
    });

    it('rejects out-of-stock simple product', () => {
      const oosProduct: Product = {
        ...simpleProduct,
        inventory: {
          status: 'OUT_OF_STOCK',
          quantity: 0,
          backordersAllowed: false,
          isPurchasable: false,
        },
      };
      const res = resolvePurchaseIntent(oosProduct);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.reason).toBe('OUT_OF_STOCK');
      }
    });

    it('rejects unpurchasable product', () => {
      const unpurchasable: Product = {
        ...simpleProduct,
        isPurchasable: false,
      };
      const res = resolvePurchaseIntent(unpurchasable);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.reason).toBe('NOT_PURCHASABLE');
      }
    });

    it('rejects quantity exceeding stock when backorders are not allowed', () => {
      const res = resolvePurchaseIntent(simpleProduct, {}, 15);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.reason).toBe('OUT_OF_STOCK');
        expect(res.message).toMatch(/only 10 units available/i);
      }
    });

    it('rejects invalid quantities', () => {
      expect(resolvePurchaseIntent(simpleProduct, {}, 0).success).toBe(false);
      expect(resolvePurchaseIntent(simpleProduct, {}, -2).success).toBe(false);
      expect(resolvePurchaseIntent(simpleProduct, {}, 1.5).success).toBe(false);
    });
  });

  describe('variable products', () => {
    it('extracts required attribute names', () => {
      const attrs = getRequiredAttributeNames(variations);
      expect(attrs).toEqual(expect.arrayContaining(['Color', 'Size']));
    });

    it('finds matching variation by attributes', () => {
      const match = findMatchingVariation(variations, { Color: 'Blue', Size: 'M' });
      expect(match).not.toBeNull();
      expect(match?.id).toBe('var-blue-m');
    });

    it('rejects incomplete selection when required attributes are missing', () => {
      const res = resolvePurchaseIntent(variableProduct, { Color: 'Blue' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.reason).toBe('INCOMPLETE_SELECTION');
        expect(res.message).toMatch(/Size/);
      }
    });

    it('resolves valid matching variation intent with exact variation ID and SKU', () => {
      const res = resolvePurchaseIntent(variableProduct, { Color: 'Blue', Size: 'M' }, 1);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.intent.productId).toBe('prod-var-1');
        expect(res.intent.variationId).toBe('var-blue-m');
        expect(res.intent.sku).toBe('SCRUB-BLU-M');
        expect(res.intent.unitPrice).toEqual({ amount_minor: 25000, currency: 'MAD' });
        expect(res.intent.attributes).toEqual({ Color: 'Blue', Size: 'M' });
      }
    });

    it('rejects invalid or non-existent attribute combination', () => {
      const res = resolvePurchaseIntent(variableProduct, { Color: 'Red', Size: 'M' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.reason).toBe('INVALID_VARIATION');
      }
    });

    it('rejects selection of out-of-stock variation', () => {
      const res = resolvePurchaseIntent(variableProduct, { Color: 'Blue', Size: 'L' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.reason).toBe('OUT_OF_STOCK');
        expect(res.message).toMatch(/out of stock/i);
      }
    });
  });
});

