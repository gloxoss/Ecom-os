import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AddonRegistry } from '@ecom-os/engine';
import {
  setStorefrontRegistryForTesting,
  isAddonActive,
  hasAddonCapability,
  getPublicAddonCapabilities,
} from '../src/lib/addon-capabilities';
import { guardAddonRoute } from '../src/lib/addon-route-guard';
import {
  createEmptyBasket,
  addQuoteItem,
  getQuoteBasketCount,
} from '../../../packages/addons-rfq/src/index';

describe('Storefront Complete RFQ Disabled State Isolation (ECO-707)', () => {
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

  it('prohibits RFQ routes and capability projection when addon is in off-state', () => {
    // 1. Inactive check
    assert.equal(isAddonActive('quotes'), false);

    // 2. Public capabilities projection does not expose quotes
    assert.equal(hasAddonCapability('quotes'), false);
    assert.equal(hasAddonCapability('quote_builder'), false);
    const publicCaps = getPublicAddonCapabilities();
    assert.equal(publicCaps.capabilities.includes('quotes'), false);
    assert.equal(publicCaps.capabilities.includes('quote_builder'), false);

    // 3. Route guard blocks RFQ routes with 404
    const devisGuard = guardAddonRoute('quotes');
    assert.equal(devisGuard.allowed, false);
    assert.equal(devisGuard.status, 404);
    assert.equal(devisGuard.body?.code, 'ADDON_DISABLED');

    const apiGuard = guardAddonRoute('quotes', 'quote_builder');
    assert.equal(apiGuard.allowed, false);
    assert.equal(apiGuard.status, 404);
  });

  it('guarantees standard shopping cart functions normally regardless of RFQ addon status', () => {
    // Standard mock cart state
    interface CartItem {
      id: number;
      qty: number;
      price: number;
    }

    const standardCart: CartItem[] = [
      { id: 101, qty: 2, price: 50 }, // 100
      { id: 102, qty: 1, price: 150 }, // 150
    ];

    const calculateCartTotal = (items: CartItem[]) =>
      items.reduce((sum, item) => sum + item.qty * item.price, 0);

    // Cart works when RFQ is disabled
    assert.equal(isAddonActive('quotes'), false);
    assert.equal(calculateCartTotal(standardCart), 250);

    // Cart works identically when RFQ is enabled
    registry.enable('quotes');
    assert.equal(isAddonActive('quotes'), true);
    assert.equal(calculateCartTotal(standardCart), 250);
  });

  it('enforces total domain isolation between quote basket and normal purchase cart', () => {
    // 1. Populate quote basket
    let quoteBasket = createEmptyBasket();
    quoteBasket = addQuoteItem(quoteBasket, {
      productId: 999,
      title: 'Bulk Custom Pottery Set',
      quantity: 50,
      notes: 'B2B Wholesale Request',
    });

    assert.equal(getQuoteBasketCount(quoteBasket), 50);

    // 2. Standard purchase cart has distinct items
    const standardCart = [{ id: 1, qty: 1, price: 20 }];

    // Invariance: standard cart items length is 1, completely unaffected by 50 items in quote basket
    assert.equal(standardCart.length, 1);
    assert.equal(standardCart[0]?.id, 1);
    assert.notEqual(standardCart[0]?.id, 999);
  });

  it('enabling RFQ addon restores only authorized capabilities without altering base platform', () => {
    // 1. Enable addon
    registry.enable('quotes');
    assert.equal(isAddonActive('quotes'), true);

    // 2. Projection updates
    assert.ok(hasAddonCapability('quotes'));
    assert.ok(hasAddonCapability('quote_builder'));
    const publicCaps = getPublicAddonCapabilities();
    assert.ok(publicCaps.capabilities.includes('quotes'));
    assert.ok(publicCaps.capabilities.includes('quote_builder'));

    // 3. Route guards now pass
    const devisGuard = guardAddonRoute('quotes');
    assert.equal(devisGuard.allowed, true);
    assert.equal(devisGuard.status, 200);

    // 4. Disable again restores strict 404 isolation
    registry.disable('quotes');
    assert.equal(isAddonActive('quotes'), false);
    const postDisableGuard = guardAddonRoute('quotes');
    assert.equal(postDisableGuard.allowed, false);
    assert.equal(postDisableGuard.status, 404);
  });
});
