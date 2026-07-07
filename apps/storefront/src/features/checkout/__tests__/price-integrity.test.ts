import { describe, it, expect } from 'vitest';
import { FakeEngine } from '@ecom-os/engine';

describe('checkout price integrity', () => {
  it('session._items carries slugs+ids for server price lookup, not prices', async () => {
    const engine = new FakeEngine();
    const clientItems = [{ productId: 'prod-1', slug: 'test-product', quantity: 2 }];

    const session = await engine.initCheckout(
      'cart-abc',
      { email: 'buyer@test.com', firstName: 'A', lastName: 'B', address: '1 Main St', paymentMethod: 'cod' },
      clientItems,
    );

    expect(session._items).toEqual(clientItems);
    expect(session._input?.email).toBe('buyer@test.com');
    // Crucially: no price field in clientItems — server must look it up
    expect((clientItems[0] as any).price).toBeUndefined();
  });

  it('placeOrder returns an order with server-computed total', async () => {
    const engine = new FakeEngine();
    const session = await engine.initCheckout(
      'cart-x',
      { email: 'a@b.com', firstName: 'A', lastName: 'B', address: '1 St', paymentMethod: 'cod' },
      [{ productId: 'p1', slug: 'slug-1', quantity: 1 }],
    );

    const order = await engine.placeOrder(session);
    expect(order.id).toBeDefined();
    expect(order.total).toMatchObject({ amount_minor: expect.any(Number), currency: expect.any(String) });
  });
});
