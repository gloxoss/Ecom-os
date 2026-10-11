import { describe, it, expect } from 'vitest';
import {
  serializeCartItems,
  parseCartItems,
  cartCoversPayload,
  buildCartPayload,
} from './cart-payload';

describe('checkout cart payload serialization', () => {
  it('includes the variation id and quantity for each line', () => {
    const serialized = serializeCartItems([
      { id: 'prod-1', slug: 'coffee', quantity: 2, variationId: 'var-large' },
      { id: 'prod-2', slug: 'mug', quantity: 1 },
    ]);

    expect(JSON.parse(serialized)).toEqual([
      { productId: 'prod-1', slug: 'coffee', quantity: 2, variationId: 'var-large' },
      { productId: 'prod-2', slug: 'mug', quantity: 1 },
    ]);
  });

  it('never includes a price or total in the browser payload', () => {
    const lines = buildCartPayload([{ id: 'prod-1', slug: 'coffee', quantity: 2, variationId: 'var-large' }]);
    expect(lines[0]).not.toHaveProperty('price');
    expect(JSON.stringify(lines)).not.toContain('amount_minor');
  });

  it('round-trips through parseCartItems', () => {
    const serialized = serializeCartItems([{ id: 'prod-1', slug: 'coffee', quantity: 5, variationId: 'var-small' }]);
    const parsed = parseCartItems(serialized);

    expect(parsed.ok).toBe(true);
    expect(parsed.lines).toEqual([{ productId: 'prod-1', slug: 'coffee', quantity: 5, variationId: 'var-small' }]);
  });
});

describe('checkout cart payload server-side validation', () => {
  it('rejects a missing or empty payload', () => {
    expect(parseCartItems('').ok).toBe(false);
    expect(parseCartItems(null).ok).toBe(false);
    expect(parseCartItems('[]').ok).toBe(false);
  });

  it('rejects malformed json and non-object lines', () => {
    expect(parseCartItems('{not json').ok).toBe(false);
    expect(parseCartItems('["nope"]').ok).toBe(false);
  });

  it('rejects a missing product id', () => {
    const result = parseCartItems(JSON.stringify([{ slug: 'coffee', quantity: 2 }]));
    expect(result.ok).toBe(false);
    expect(result.error).toBe('cart_items_invalid_line');
  });

  it('rejects a non-positive or non-integer quantity', () => {
    expect(parseCartItems(JSON.stringify([{ productId: 'p1', slug: 's', quantity: 0 }])).ok).toBe(false);
    expect(parseCartItems(JSON.stringify([{ productId: 'p1', slug: 's', quantity: 1.5 }])).ok).toBe(false);
    expect(parseCartItems(JSON.stringify([{ productId: 'p1', slug: 's', quantity: '2' }])).ok).toBe(false);
  });

  it('drops an empty variation id rather than keeping a blank one', () => {
    const parsed = parseCartItems(JSON.stringify([{ productId: 'p1', slug: 's', quantity: 1, variationId: '  ' }]));
    expect(parsed.ok).toBe(true);
    expect(parsed.lines[0]?.variationId).toBeUndefined();
  });
});

describe('cartCoversPayload guards the submitted payload against the authoritative cart', () => {
  it('accepts a variation line matched by the authoritative variation id', () => {
    const ok = cartCoversPayload(
      [{ productId: 'parent-1', slug: 'coffee', quantity: 2, variationId: 'var-large' }],
      [{ productId: 'var-large', variantId: 'var-large', quantity: 2 }]
    );
    expect(ok).toBe(true);
  });

  it('accepts a simple product line', () => {
    const ok = cartCoversPayload(
      [{ productId: 'prod-1', slug: 'mug', quantity: 1 }],
      [{ productId: 'prod-1', quantity: 1 }]
    );
    expect(ok).toBe(true);
  });

  it('rejects when the authoritative cart does not contain the requested variation', () => {
    const ok = cartCoversPayload(
      [{ productId: 'parent-1', slug: 'coffee', quantity: 1, variationId: 'var-large' }],
      [{ productId: 'var-small', variantId: 'var-small', quantity: 1 }]
    );
    expect(ok).toBe(false);
  });

  it('rejects when the request drops the variation the cart carries', () => {
    const ok = cartCoversPayload(
      [{ productId: 'parent-1', slug: 'coffee', quantity: 1 }],
      [{ productId: 'var-large', variantId: 'var-large', quantity: 1 }]
    );
    expect(ok).toBe(false);
  });

  it('rejects an empty authoritative cart or empty payload', () => {
    expect(cartCoversPayload([{ productId: 'p1', slug: 's', quantity: 1 }], [])).toBe(false);
    expect(cartCoversPayload([], [{ productId: 'p1', quantity: 1 }])).toBe(false);
  });
});
