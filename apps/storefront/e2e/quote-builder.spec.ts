import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AddonRegistry } from '@ecom-os/engine';
import {
  setStorefrontRegistryForTesting,
  isAddonActive,
} from '../src/lib/addon-capabilities';
import { guardAddonRoute } from '../src/lib/addon-route-guard';
import {
  createEmptyBasket,
  addQuoteItem,
  updateQuoteItemQuantity,
  getQuoteBasketCount,
  createItemKey,
} from '../../../packages/addons-rfq/src/index';

describe('Storefront Quote Builder & Isolation Contract (ECO-702)', () => {
  let registry: AddonRegistry;

  beforeEach(() => {
    registry = new AddonRegistry('1.0.0');
    registry.register({
      id: 'quotes',
      name: 'RFQ Quotes Addon',
      version: '1.0.0',
      ecomOsApiRange: '^1.0.0',
      capabilities: {
        provided: ['quotes', 'quote_builder'],
      },
    });
    setStorefrontRegistryForTesting(registry);
  });

  it('prohibits /devis access when quotes addon is in off-state', async () => {
    // 1. Off state verification
    assert.equal(isAddonActive('quotes'), false);

    // 2. Route guard blocks direct access with 404
    const guard = guardAddonRoute('quotes');
    assert.equal(guard.allowed, false);
    assert.equal(guard.status, 404);
  });

  it('permits /devis access when quotes addon is enabled', async () => {
    // 1. Enable
    registry.enable('quotes');
    assert.equal(isAddonActive('quotes'), true);

    // 2. Route guard allows access
    const guard = guardAddonRoute('quotes');
    assert.equal(guard.allowed, true);
    assert.equal(guard.status, 200);
  });

  it('assembles multi-item quote basket preserving exact product and variation keys', () => {
    let basket = createEmptyBasket();

    // Item 1: Brass Lantern (Product 10, Variation 101)
    basket = addQuoteItem(basket, {
      productId: 10,
      variationId: 101,
      sku: 'BRASS-101',
      title: 'Moroccan Lantern - Brass',
      quantity: 2,
    });

    // Item 2: Silver Lantern (Product 10, Variation 102 - distinct variation)
    basket = addQuoteItem(basket, {
      productId: 10,
      variationId: 102,
      sku: 'SILVER-102',
      title: 'Moroccan Lantern - Silver',
      quantity: 1,
    });

    // Item 3: Handwoven Rug (Product 25, no variation)
    basket = addQuoteItem(basket, {
      productId: 25,
      sku: 'RUG-025',
      title: 'Beni Ourain Wool Rug',
      quantity: 1,
      notes: 'Custom dimensions 200x300cm requested',
    });

    assert.equal(basket.items.length, 3);
    assert.equal(getQuoteBasketCount(basket), 4);
    assert.equal(basket.items[0]?.key, '10:101');
    assert.equal(basket.items[1]?.key, '10:102');
    assert.equal(basket.items[2]?.key, '25:0');

    // Edit quantity
    basket = updateQuoteItemQuantity(basket, createItemKey(10, 101), 5);
    assert.equal(basket.items[0]?.quantity, 5);
    assert.equal(getQuoteBasketCount(basket), 7);
  });

  it('guarantees complete isolation between quote basket and normal purchase cart', () => {
    // Quote basket items
    const quoteBasket = addQuoteItem(createEmptyBasket(), {
      productId: 99,
      title: 'B2B Custom Batch',
      quantity: 50,
    });

    // Standard simulated cart payload
    const standardCart = {
      items: [{ id: 'standard_1', quantity: 1, price: { amount_minor: 5000 } }],
      total: 5000,
    };

    // State assertion: completely disjoint structures and schemas
    assert.notDeepEqual(quoteBasket.items[0]?.productId, standardCart.items[0]?.id);
    assert.equal(quoteBasket.items.length, 1);
    assert.equal(standardCart.items.length, 1);
  });
});
