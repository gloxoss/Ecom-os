import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, lineKeyFor, resolveLineKey, type CartItem } from './cart-store';
import { resolvePurchaseIntent } from '@/features/product/model/purchase-intent';
import type { Product, Variation } from '@ecom-os/engine';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    slug: 'coffee-beans',
    name: 'Coffee Beans',
    description: 'Test product',
    price: { amount_minor: 1500, currency: 'MAD' },
    images: [],
    categories: ['coffee'],
    type: 'simple',
    ...overrides,
  };
}

function makeVariation(id: string, attributes: Record<string, string>, priceMinor = 2000): Variation {
  return {
    id,
    sku: `SKU-${id}`,
    name: id,
    price: { amount_minor: priceMinor, currency: 'MAD' },
    stock_quantity: 10,
    attributes: Object.entries(attributes).map(([name, value]) => ({ name, value })),
    inventory: { status: 'IN_STOCK', quantity: 10, backordersAllowed: false, isPurchasable: true },
    isPurchasable: true,
  };
}

const small = makeVariation('var-small', { Size: 'Small' }, 1800);
const large = makeVariation('var-large', { Size: 'Large' }, 2200);

const variableProduct = makeProduct({
  id: 'prod-var',
  slug: 'variable-coffee',
  type: 'variable',
  variations: [small, large],
});

beforeEach(() => {
  useCartStore.setState({ items: [], coupon: null, shippingMethod: null });
});

describe('cart store line identity', () => {
  it('keeps two variations of one product as separate lines with the right quantities', () => {
    const { addItem } = useCartStore.getState();

    addItem(variableProduct, { quantity: 2, variationId: 'var-small', variationName: 'Small' });
    addItem(variableProduct, { quantity: 3, variationId: 'var-large', variationName: 'Large' });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);

    const smallLine = items.find((item) => item.variationId === 'var-small');
    const largeLine = items.find((item) => item.variationId === 'var-large');
    expect(smallLine?.quantity).toBe(2);
    expect(largeLine?.quantity).toBe(3);
    expect(smallLine?.lineKey).toBe('prod-var::var-small');
    expect(largeLine?.lineKey).toBe('prod-var::var-large');
  });

  it('increments by the requested quantity when the same variation is added twice', () => {
    const { addItem } = useCartStore.getState();

    addItem(variableProduct, { quantity: 2, variationId: 'var-small' });
    addItem(variableProduct, { quantity: 3, variationId: 'var-small' });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(5);
  });

  it('retains the variation id and name on the cart line', () => {
    const { addItem } = useCartStore.getState();
    addItem(variableProduct, { quantity: 1, variationId: 'var-large', variationName: 'Large' });

    const line = useCartStore.getState().items[0];
    expect(line?.variationId).toBe('var-large');
    expect(line?.variationName).toBe('Large');
  });

  it('stores the requested quantity on first add instead of a hardcoded 1', () => {
    const { addItem } = useCartStore.getState();
    addItem(makeProduct(), { quantity: 7 });

    expect(useCartStore.getState().items[0]?.quantity).toBe(7);
  });

  it('defaults to quantity 1 when none is given', () => {
    const { addItem } = useCartStore.getState();
    addItem(makeProduct());

    expect(useCartStore.getState().items[0]?.quantity).toBe(1);
  });

  it('merges repeated whole-product adds by the requested quantity', () => {
    const { addItem } = useCartStore.getState();
    addItem(makeProduct(), { quantity: 2 });
    addItem(makeProduct(), { quantity: 4 });

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]?.quantity).toBe(6);
  });

  it('updateQty and removeItem act on the line key, leaving other variations intact', () => {
    const { addItem } = useCartStore.getState();
    addItem(variableProduct, { quantity: 1, variationId: 'var-small' });
    addItem(variableProduct, { quantity: 1, variationId: 'var-large' });

    useCartStore.getState().updateQty('prod-var::var-small', 9);
    expect(useCartStore.getState().items.find((i) => i.variationId === 'var-small')?.quantity).toBe(9);
    expect(useCartStore.getState().items.find((i) => i.variationId === 'var-large')?.quantity).toBe(1);

    useCartStore.getState().updateQty('prod-var::var-small', 0);
    const remaining = useCartStore.getState().items;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.variationId).toBe('var-large');

    useCartStore.getState().removeItem('prod-var::var-large');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('handles a legacy persisted line that has no variationId or lineKey', () => {
    const legacy = { ...makeProduct({ id: 'legacy-1' }), quantity: 2 } as unknown as CartItem;

    expect(resolveLineKey(legacy)).toBe('legacy-1');

    useCartStore.setState({ items: [legacy] });
    useCartStore.getState().updateQty('legacy-1', 5);
    expect(useCartStore.getState().items[0]?.quantity).toBe(5);

    useCartStore.getState().removeItem('legacy-1');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('exposes a stable composite line key helper', () => {
    expect(lineKeyFor('p1')).toBe('p1');
    expect(lineKeyFor('p1', 'v1')).toBe('p1::v1');
  });
});

describe('resolvePurchaseIntent feeding the cart', () => {
  it('carries the selected variation and quantity into the cart line', () => {
    const result = resolvePurchaseIntent(variableProduct, { Size: 'Large' }, 4);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const { intent } = result;
    useCartStore.getState().addItem(variableProduct, {
      quantity: intent.quantity,
      ...(intent.variationId ? { variationId: intent.variationId } : {}),
      ...(intent.variationName ? { variationName: intent.variationName } : {}),
      unitPrice: intent.unitPrice,
    });

    const line = useCartStore.getState().items[0];
    expect(line?.variationId).toBe('var-large');
    expect(line?.quantity).toBe(4);
    expect(line?.price.amount_minor).toBe(2200);
  });

  it('carries an exact variation and quantity for a simple product with no variation', () => {
    const simple = makeProduct({ id: 'simple-1' });
    const result = resolvePurchaseIntent(simple, {}, 3);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const { intent } = result;
    useCartStore.getState().addItem(simple, {
      quantity: intent.quantity,
      ...(intent.variationId ? { variationId: intent.variationId } : {}),
      ...(intent.variationName ? { variationName: intent.variationName } : {}),
      unitPrice: intent.unitPrice,
    });

    const line = useCartStore.getState().items[0];
    expect(line?.variationId).toBeUndefined();
    expect(line?.quantity).toBe(3);
    expect(line?.lineKey).toBe('simple-1');
  });
});
