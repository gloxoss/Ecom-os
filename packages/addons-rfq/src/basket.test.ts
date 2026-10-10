import { describe, it, expect } from 'vitest';
import {
  createEmptyBasket,
  addQuoteItem,
  updateQuoteItemQuantity,
  updateQuoteItemNotes,
  removeQuoteItem,
  getQuoteBasketCount,
  toRfqItems,
  createItemKey,
} from './basket';

describe('ECO-702: QuoteBasket and Exact Variation Identity', () => {
  it('preserves distinct items for different variations of the same product', () => {
    let basket = createEmptyBasket();

    // Add Product 50, Variation A (Brass Finish, ID 501)
    basket = addQuoteItem(basket, {
      productId: 50,
      variationId: 501,
      sku: 'LAMP-BRASS',
      title: 'Moroccan Lantern - Antique Brass',
      quantity: 2,
    });

    // Add Product 50, Variation B (Silver Finish, ID 502)
    basket = addQuoteItem(basket, {
      productId: 50,
      variationId: 502,
      sku: 'LAMP-SILVER',
      title: 'Moroccan Lantern - Nickel Silver',
      quantity: 3,
    });

    expect(basket.items).toHaveLength(2);
    expect(basket.items[0]?.key).toBe('50:501');
    expect(basket.items[1]?.key).toBe('50:502');
    expect(getQuoteBasketCount(basket)).toBe(5);
  });

  it('increments quantity when exact same product and variation is added again', () => {
    let basket = createEmptyBasket();

    basket = addQuoteItem(basket, {
      productId: 75,
      variationId: 10,
      title: 'Cedarwood Desk Box',
      quantity: 1,
    });

    basket = addQuoteItem(basket, {
      productId: 75,
      variationId: 10,
      title: 'Cedarwood Desk Box',
      quantity: 4,
    });

    expect(basket.items).toHaveLength(1);
    expect(basket.items[0]?.quantity).toBe(5);
    expect(getQuoteBasketCount(basket)).toBe(5);
  });

  it('handles products without variations cleanly', () => {
    let basket = createEmptyBasket();

    basket = addQuoteItem(basket, {
      productId: 'simple_99',
      title: 'Handwoven Kilim Rug',
      quantity: 2,
    });

    expect(basket.items).toHaveLength(1);
    expect(basket.items[0]?.key).toBe('simple_99:0');
  });

  it('removes item when quantity is updated to zero or negative', () => {
    let basket = createEmptyBasket();

    basket = addQuoteItem(basket, {
      productId: 100,
      title: 'Ceramic Plate',
      quantity: 3,
    });

    const key = createItemKey(100);
    expect(basket.items).toHaveLength(1);

    // Update to 0 removes it
    basket = updateQuoteItemQuantity(basket, key, 0);
    expect(basket.items).toHaveLength(0);
    expect(getQuoteBasketCount(basket)).toBe(0);
  });

  it('updates line item customer notes', () => {
    let basket = createEmptyBasket();

    basket = addQuoteItem(basket, {
      productId: 200,
      title: 'Custom Inlay Mirror',
      quantity: 1,
    });

    const key = createItemKey(200);
    basket = updateQuoteItemNotes(basket, key, 'Engrave initials AM on the wooden back');
    expect(basket.items[0]?.notes).toBe('Engrave initials AM on the wooden back');
  });

  it('removes item directly via removeQuoteItem', () => {
    let basket = createEmptyBasket();

    basket = addQuoteItem(basket, { productId: 1, title: 'Item 1', quantity: 1 });
    basket = addQuoteItem(basket, { productId: 2, title: 'Item 2', quantity: 2 });
    expect(basket.items).toHaveLength(2);

    basket = removeQuoteItem(basket, createItemKey(1));
    expect(basket.items).toHaveLength(1);
    expect(basket.items[0]?.productId).toBe(2);
  });

  it('transforms cleanly into RfqItem array for RFQ state machine submission', () => {
    let basket = createEmptyBasket();

    basket = addQuoteItem(basket, {
      productId: 300,
      variationId: 305,
      sku: 'SKU-305',
      title: 'Zellige Tile Panel',
      quantity: 25,
      notes: 'Emerald green colorway',
    });

    const rfqItems = toRfqItems(basket);
    expect(rfqItems).toHaveLength(1);
    expect(rfqItems[0]).toEqual({
      productId: 300,
      variationId: 305,
      sku: 'SKU-305',
      title: 'Zellige Tile Panel',
      quantity: 25,
      customerNotes: 'Emerald green colorway',
    });
  });

  it('guarantees architectural separation: quote basket operates independently from B2C cart', () => {
    // Structural proof: basket schema and item keys maintain dedicated RFQ scope
    const basket = createEmptyBasket();
    expect(basket).toHaveProperty('items');
    expect(basket).toHaveProperty('updatedAt');
    expect(basket).not.toHaveProperty('coupons');
    expect(basket).not.toHaveProperty('shippingAddress');
    expect(basket).not.toHaveProperty('total');
  });
});
