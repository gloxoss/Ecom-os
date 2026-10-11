import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStoreApiUrl,
  storeApiFetch,
  fetchStoreCart,
  addItemToStoreCart,
  updateStoreCartItem,
  removeStoreCartItem,
  reconcileStoreCart,
  cartLineKey,
  type IntendedCartLine,
} from '../cart';
import { mapStoreCart, mapStoreCartItem } from '../mappers';
import { WooCommerceEngine } from '../client';

describe('WooCommerce Store API Cart & Session Adapter', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    delete process.env.WC_STORE_API_URL;
    delete process.env.WC_REST_URL;
    delete process.env.WC_GRAPHQL_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Store API URL Resolution', () => {
    it('uses explicit WC_STORE_API_URL when provided', () => {
      process.env.WC_STORE_API_URL = 'https://custom-wc.example.com/wp-json/wc/store/v1/';
      expect(getStoreApiUrl()).toBe('https://custom-wc.example.com/wp-json/wc/store/v1');
    });

    it('derives Store API URL from WC_REST_URL', () => {
      process.env.WC_REST_URL = 'https://paraloca.local/wp-json/wc/v3';
      expect(getStoreApiUrl()).toBe('https://paraloca.local/wp-json/wc/store/v1');
    });

    it('derives Store API URL from WC_GRAPHQL_URL', () => {
      process.env.WC_GRAPHQL_URL = 'https://paraloca.local/graphql';
      expect(getStoreApiUrl()).toBe('https://paraloca.local/wp-json/wc/store/v1');
    });

    it('falls back to default paraloca.local Store API endpoint', () => {
      expect(getStoreApiUrl()).toBe('https://paraloca.local/wp-json/wc/store/v1');
    });
  });

  describe('storeApiFetch HTTP transport & headers', () => {
    it('sends Cart-Token header and parses returned Cart-Token header', async () => {
      const mockHeaders = new Headers();
      mockHeaders.set('Cart-Token', 'new-token-abc-123');
      mockHeaders.set('Nonce', 'test-nonce-456');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => ({ items: [], totals: { currency_code: 'MAD', total_items: '0', total_price: '0' } }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await storeApiFetch('/cart', { cartToken: 'initial-token' });

      // A read is a single request: no nonce seeding, which only writes need.
      expect(mockFetch).toHaveBeenCalledOnce();
      const call = mockFetch.mock.calls[0]!;
      const calledUrl = call[0] as string;
      const calledOpts = call[1] as RequestInit;

      expect(calledUrl).toContain('/cart');
      expect((calledOpts.headers as Headers).get('Cart-Token')).toBe('initial-token');
      expect(res.cartToken).toBe('new-token-abc-123');
      expect(res.nonce).toBe('test-nonce-456');
    });

    it('throws explicit error with status and message on failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        json: async () => ({ code: 'woocommerce_rest_cart_item_out_of_stock', message: 'Item is out of stock.' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(
        storeApiFetch('/cart/add-item', { method: 'POST', body: { id: 99, quantity: 1 } })
      ).rejects.toThrow('Store API request failed [400]: Item is out of stock.');
    });

    it('enforces HTTPS in production environment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.WC_STORE_API_URL = 'http://insecure-site.com/wp-json/wc/store/v1';

      await expect(storeApiFetch('/cart')).rejects.toThrow('WooCommerce Store API requires HTTPS in production.');
    });
  });

  describe('Domain Cart Mapping', () => {
    it('maps Store API cart item for simple product', () => {
      const rawItem = {
        key: 'cart-line-1',
        id: 12,
        type: 'simple',
        quantity: 2,
        prices: {
          price: '3995',
          currency_code: 'MAD',
        },
      };

      const mapped = mapStoreCartItem(rawItem, 'MAD');
      expect(mapped.id).toBe('cart-line-1');
      expect(mapped.productId).toBe('12');
      expect(mapped.variantId).toBeUndefined();
      expect(mapped.quantity).toBe(2);
      expect(mapped.price).toEqual({ amount_minor: 3995, currency: 'MAD' });
    });

    it('maps Store API cart item for variable product with exact variation ID', () => {
      const rawItem = {
        key: 'cart-line-2',
        id: 14,
        type: 'variation',
        quantity: 1,
        variation: [{ attribute: 'pa_size', value: 'standard' }],
        prices: {
          price: '7950',
          currency_code: 'MAD',
        },
      };

      const mapped = mapStoreCartItem(rawItem, 'MAD');
      expect(mapped.id).toBe('cart-line-2');
      expect(mapped.productId).toBe('14');
      expect(mapped.variantId).toBe('14');
      expect(mapped.quantity).toBe(1);
      expect(mapped.price).toEqual({ amount_minor: 7950, currency: 'MAD' });
    });

    it('maps full Store API cart with items, subtotal, and total', () => {
      const rawCart = {
        items: [
          {
            key: 'line-1',
            id: 12,
            type: 'simple',
            quantity: 2,
            prices: { price: '3995', currency_code: 'MAD' },
          },
          {
            key: 'line-2',
            id: 14,
            type: 'variation',
            quantity: 1,
            prices: { price: '7950', currency_code: 'MAD' },
          },
        ],
        totals: {
          currency_code: 'MAD',
          total_items: '15940',
          total_price: '20284',
        },
      };

      const cart = mapStoreCart(rawCart, 'test-cart-token-xyz', 'MAD');
      expect(cart.id).toBe('test-cart-token-xyz');
      expect(cart.items).toHaveLength(2);
      expect(cart.subtotal).toEqual({ amount_minor: 15940, currency: 'MAD' });
      expect(cart.total).toEqual({ amount_minor: 20284, currency: 'MAD' });
    });
  });

  describe('WooCommerceEngine Cart Methods', () => {
    it('getCart fetches cart via Store API and returns domain Cart', async () => {
      const mockHeaders = new Headers();
      mockHeaders.set('Cart-Token', 'session-token-111');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => ({
          items: [
            { key: 'line-1', id: 12, type: 'simple', quantity: 1, prices: { price: '3995', currency_code: 'MAD' } },
          ],
          totals: { currency_code: 'MAD', total_items: '3995', total_price: '3995' },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const engine = new WooCommerceEngine();
      const cart = await engine.getCart('session-token-111');

      expect(cart.id).toBe('session-token-111');
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]?.productId).toBe('12');
      expect(cart.total.amount_minor).toBe(3995);
    });

    it('addToCart dispatches target ID and quantity to Store API', async () => {
      const mockHeaders = new Headers();
      mockHeaders.set('Cart-Token', 'session-token-222');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: mockHeaders,
        json: async () => ({
          items: [
            { key: 'line-v', id: 14, type: 'variation', quantity: 2, prices: { price: '7950', currency_code: 'MAD' } },
          ],
          totals: { currency_code: 'MAD', total_items: '15900', total_price: '15900' },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const engine = new WooCommerceEngine();
      const cart = await engine.addToCart('session-token-222', {
        productId: '13',
        variantId: '14',
        quantity: 2,
      });

      expect(mockFetch.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'POST')).toBe(true);
      const call = mockFetch.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === 'POST')!;
      const body = JSON.parse((call[1] as RequestInit).body as string);
      expect(body).toEqual({ id: 14, quantity: 2 });
      expect(cart.items[0]?.variantId).toBe('14');
      expect(cart.total.amount_minor).toBe(15900);
    });

    it('addToCart rejects invalid or non-numeric IDs', async () => {
      const engine = new WooCommerceEngine();
      await expect(
        engine.addToCart('token', { productId: 'invalid', quantity: 1 })
      ).rejects.toThrow('Invalid product or variation ID for addToCart: invalid');
    });
  });

  describe('Guest Session Isolation', () => {
    it('handles distinct guest sessions with different Cart-Tokens without leaking lines', async () => {
      const sessionCalls: string[] = [];

      vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url, opts) => {
        const token = (opts.headers as Headers).get('Cart-Token');
        sessionCalls.push(token || 'empty');
        if (token === 'guest-A') {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'Cart-Token': 'guest-A' }),
            json: async () => ({
              items: [{ key: 'item-a', id: 12, quantity: 1, prices: { price: '3995', currency_code: 'MAD' } }],
              totals: { currency_code: 'MAD', total_items: '3995', total_price: '3995' },
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'Cart-Token': 'guest-B' }),
          json: async () => ({
            items: [],
            totals: { currency_code: 'MAD', total_items: '0', total_price: '0' },
          }),
        };
      }));

      const resA = await fetchStoreCart('guest-A');
      const resB = await fetchStoreCart('guest-B');

      expect(resA.cart.items).toHaveLength(1);
      expect(resB.cart.items).toHaveLength(0);
    });
  });

  describe('Line Item Mutations & Authoritative Revalidation', () => {
    it('updates line item quantity via Store API update-item', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Cart-Token': 'tok-update' }),
        json: async () => ({
          items: [{ key: 'line-xyz', id: 14, quantity: 3, prices: { price: '7950', currency_code: 'MAD' } }],
          totals: { currency_code: 'MAD', total_items: '23850', total_price: '23850' },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const engine = new WooCommerceEngine();
      const cart = await engine.updateCartItem('tok-update', 'line-xyz', 3);

      expect(mockFetch.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'POST')).toBe(true);
      const call = mockFetch.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === 'POST')!;
      expect(call[0]).toContain('/cart/update-item');
      const body = JSON.parse((call[1] as RequestInit).body as string);
      expect(body).toEqual({ key: 'line-xyz', quantity: 3 });
      expect(cart.items[0]?.quantity).toBe(3);
      expect(cart.total.amount_minor).toBe(23850);
    });

    it('removes line item when quantity is 0 or via removeCartItem', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Cart-Token': 'tok-del' }),
        json: async () => ({
          items: [],
          totals: { currency_code: 'MAD', total_items: '0', total_price: '0' },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const engine = new WooCommerceEngine();
      const cart0 = await engine.updateCartItem('tok-del', 'line-xyz', 0);
      expect(cart0.items).toHaveLength(0);

      const cartDel = await engine.removeCartItem('tok-del', 'line-xyz');
      expect(cartDel.items).toHaveLength(0);
    });

    it('rejects line update exceeding stock with authoritative Store API error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        json: async () => ({
          code: 'woocommerce_rest_cart_item_stock_limit',
          message: 'You cannot add that amount to the cart — we have 5 in stock and you already have 5 in your cart.',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const engine = new WooCommerceEngine();
      await expect(
        engine.updateCartItem('tok-stock', 'line-xyz', 99)
      ).rejects.toThrow('Store API request failed [400]: You cannot add that amount to the cart');
    });
  });

  describe('Authoritative Store API Coupon Rules', () => {
    it('applies valid coupon and computes discount through Store API', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Cart-Token': 'tok-coupon' }),
        json: async () => ({
          items: [{ key: 'line-1', id: 12, quantity: 1, prices: { price: '10000', currency_code: 'MAD' } }],
          totals: {
            currency_code: 'MAD',
            total_items: '10000',
            total_discount: '2000',
            total_price: '8000',
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const engine = new WooCommerceEngine();
      const result = await engine.applyCoupon('tok-coupon', 'DISCOUNT20', 10000);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.discount.amount_minor).toBe(2000);
        expect(result.discount.currency).toBe('MAD');
      }
    });

    it('maps Store API coupon errors to typed error categories', async () => {
      const engine = new WooCommerceEngine();

      // Expired coupon
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers(),
        json: async () => ({ message: 'This coupon has expired.' }),
      }));
      expect(await engine.applyCoupon('tok', 'EXPIRED', 5000)).toEqual({ ok: false, error: 'expired' });

      // Already applied
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers(),
        json: async () => ({ message: 'Coupon code already applied!' }),
      }));
      expect(await engine.applyCoupon('tok', 'DUP', 5000)).toEqual({ ok: false, error: 'already_applied' });

      // Minimum order
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers(),
        json: async () => ({ message: 'The minimum spend for this coupon is 500 MAD.' }),
      }));
      expect(await engine.applyCoupon('tok', 'MIN', 1000)).toEqual({ ok: false, error: 'min_order' });

      // Invalid code
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: async () => ({ message: 'Coupon "BOGUS" does not exist!' }),
      }));
      expect(await engine.applyCoupon('tok', 'BOGUS', 5000)).toEqual({ ok: false, error: 'invalid' });
    });

    it('removes coupon via Store API remove-coupon', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Cart-Token': 'tok-del' }),
        json: async () => ({
          totals: { currency_code: 'MAD', total_discount: '0', total_price: '10000' },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const engine = new WooCommerceEngine();
      const removed = await engine.removeCoupon('tok-del', 'DISCOUNT20');
      expect(removed).toBe(true);
    });
  });

  describe('Authoritative cart multiset reconciliation (ECO-1101)', () => {
    interface FakeLine {
      key: string;
      id: number;
      type: 'simple' | 'variation';
      quantity: number;
      price: string;
    }

    interface RecordedRequest {
      endpoint: string;
      method: string;
      nonce: string | null;
      token: string | null;
      expectedNonce: string | null;
      body: any;
    }

    /**
     * Stateful fake of the WooCommerce Store API cart endpoints. Issues a fresh
     * Nonce on every response so tests can prove the client threads the rotated
     * value instead of reusing a stale one or omitting it.
     */
    function createFakeWoo(initial: FakeLine[], variationIds: number[] = [14]) {
      let lines = initial.map((l) => ({ ...l }));
      let nonceCounter = 0;
      let seq = 100;
      let lastIssuedNonce: string | null = null;
      const requests: RecordedRequest[] = [];

      const payload = () => {
        const sum = lines.reduce((acc, l) => acc + parseInt(l.price, 10) * l.quantity, 0);
        return {
          items: lines.map((l) => ({
            key: l.key,
            id: l.id,
            type: l.type,
            quantity: l.quantity,
            ...(l.type === 'variation' ? { variation: [{ attribute: 'pa_size', value: 'standard' }] } : {}),
            prices: { price: l.price, currency_code: 'MAD' },
          })),
          totals: { currency_code: 'MAD', total_items: String(sum), total_price: String(sum) },
        };
      };

      const respond = (data: any, status = 200, ok = true) => {
        lastIssuedNonce = `nonce-${++nonceCounter}`;
        return {
          ok,
          status,
          statusText: ok ? 'OK' : 'Bad Request',
          headers: new Headers({ 'Cart-Token': 'tok-reconcile', Nonce: lastIssuedNonce }),
          json: async () => data,
        };
      };

      const fakeFetch = vi.fn().mockImplementation(async (url: string, init: RequestInit = {}) => {
        const headers = new Headers(init.headers as HeadersInit);
        const method = (init.method || 'GET').toUpperCase();
        const endpoint = String(url).replace(/.*\/wp-json\/wc\/store\/v1/, '');
        const body = init.body ? JSON.parse(String(init.body)) : undefined;
        if (method === 'POST') {
          requests.push({
            endpoint,
            method,
            nonce: headers.get('Nonce'),
            token: headers.get('Cart-Token'),
            expectedNonce: lastIssuedNonce,
            body,
          });
        }
        if (method === 'GET' && endpoint === '/cart') return respond(payload());
        if (endpoint === '/cart/add-item') {
          if (body.id === 999) {
            return respond(
              { code: 'woocommerce_rest_cart_item_out_of_stock', message: 'Item 999 is out of stock.' },
              400,
              false
            );
          }
          seq += 1;
          lines.push({
            key: `w-${seq}`,
            id: body.id,
            type: variationIds.includes(body.id) ? 'variation' : 'simple',
            quantity: body.quantity,
            price: '1000',
          });
          return respond(payload(), 201);
        }
        if (endpoint === '/cart/update-item') {
          const line = lines.find((l) => l.key === body.key);
          if (!line) return respond({ code: 'not_found', message: 'Line not found.' }, 404, false);
          line.quantity = body.quantity;
          return respond(payload());
        }
        if (endpoint === '/cart/remove-item') {
          lines = lines.filter((l) => l.key !== body.key);
          return respond(payload());
        }
        return respond({ code: 'unknown', message: `Unexpected ${method} ${endpoint}` }, 500, false);
      });

      return { fakeFetch, requests };
    }

    const multisetOf = (items: Array<{ productId: string; variantId?: string; quantity: number }>) =>
      items.map((i) => `${cartLineKey(i.productId, i.variantId)}x${i.quantity}`).sort();

    it('adds a missing simple product and verifies the exact final multiset', async () => {
      const woo = createFakeWoo([{ key: 'w-1', id: 12, type: 'simple', quantity: 1, price: '3995' }]);
      vi.stubGlobal('fetch', woo.fakeFetch);

      const intended: IntendedCartLine[] = [
        { productId: '12', quantity: 1 },
        { productId: '13', quantity: 2 },
      ];
      const result = await reconcileStoreCart('tok-reconcile', intended);

      const add = woo.requests.find((r) => r.endpoint === '/cart/add-item');
      expect(add?.body).toEqual({ id: 13, quantity: 2 });
      expect(result.diff).toMatchObject({ added: 1, updated: 0, removed: 0, variationMismatches: 0 });
      expect(multisetOf(result.cart.items)).toEqual(['p:12x1', 'p:13x2']);
    });

    it('removes an unexpected surplus line present in Woo but not intended', async () => {
      const woo = createFakeWoo([
        { key: 'w-1', id: 12, type: 'simple', quantity: 1, price: '3995' },
        { key: 'w-2', id: 99, type: 'simple', quantity: 1, price: '500' },
      ]);
      vi.stubGlobal('fetch', woo.fakeFetch);

      const result = await reconcileStoreCart('tok-reconcile', [{ productId: '12', quantity: 1 }]);

      const remove = woo.requests.find((r) => r.endpoint === '/cart/remove-item');
      expect(remove?.body).toEqual({ key: 'w-2' });
      expect(result.diff).toMatchObject({ added: 0, updated: 0, removed: 1 });
      expect(multisetOf(result.cart.items)).toEqual(['p:12x1']);
    });

    it('reconciles quantity drift through update-item', async () => {
      const woo = createFakeWoo([{ key: 'w-1', id: 12, type: 'simple', quantity: 1, price: '3995' }]);
      vi.stubGlobal('fetch', woo.fakeFetch);

      const result = await reconcileStoreCart('tok-reconcile', [{ productId: '12', quantity: 3 }]);

      const update = woo.requests.find((r) => r.endpoint === '/cart/update-item');
      expect(update?.body).toEqual({ key: 'w-1', quantity: 3 });
      expect(result.diff).toMatchObject({ added: 0, updated: 1, removed: 0 });
      expect(multisetOf(result.cart.items)).toEqual(['p:12x3']);
    });

    it('atomically swaps a simple line for a different variation of the same product', async () => {
      const woo = createFakeWoo([{ key: 'w-9', id: 13, type: 'simple', quantity: 1, price: '2000' }]);
      vi.stubGlobal('fetch', woo.fakeFetch);

      const result = await reconcileStoreCart('tok-reconcile', [
        { productId: '13', variationId: '14', quantity: 1 },
      ]);

      expect(woo.requests.find((r) => r.endpoint === '/cart/remove-item')?.body).toEqual({ key: 'w-9' });
      expect(woo.requests.find((r) => r.endpoint === '/cart/add-item')?.body).toEqual({ id: 14, quantity: 1 });
      expect(result.diff).toMatchObject({ added: 1, removed: 1, variationMismatches: 1 });
      expect(multisetOf(result.cart.items)).toEqual(['v:14x1']);
    });

    it('threads the rotated Nonce and Cart-Token through every sequential mutation', async () => {
      const woo = createFakeWoo([
        { key: 'w-1', id: 12, type: 'simple', quantity: 1, price: '3995' },
        { key: 'w-2', id: 99, type: 'simple', quantity: 1, price: '500' },
      ]);
      vi.stubGlobal('fetch', woo.fakeFetch);

      await reconcileStoreCart('tok-reconcile', [{ productId: '12', quantity: 3 }]);

      expect(woo.requests.length).toBeGreaterThanOrEqual(2);
      for (const req of woo.requests) {
        expect(req.token).toBe('tok-reconcile');
        expect(req.nonce).toBeTruthy();
        // Each mutation carries the nonce issued by the immediately preceding
        // response: no stale reuse, no fabricated value.
        expect(req.nonce).toBe(req.expectedNonce);
      }
    });

    it('issues no mutations when Woo already matches the intended multiset', async () => {
      const woo = createFakeWoo([{ key: 'w-1', id: 12, type: 'simple', quantity: 2, price: '3995' }]);
      vi.stubGlobal('fetch', woo.fakeFetch);

      const result = await reconcileStoreCart('tok-reconcile', [{ productId: '12', quantity: 2 }]);

      expect(woo.requests).toHaveLength(0);
      expect(result.diff).toMatchObject({ added: 0, updated: 0, removed: 0 });
      expect(multisetOf(result.cart.items)).toEqual(['p:12x2']);
    });

    it('fails closed with the authoritative stock error and stops further mutations', async () => {
      const woo = createFakeWoo([{ key: 'w-1', id: 12, type: 'simple', quantity: 1, price: '3995' }]);
      vi.stubGlobal('fetch', woo.fakeFetch);

      await expect(
        reconcileStoreCart('tok-reconcile', [
          { productId: '12', quantity: 1 },
          { productId: '999', quantity: 1 },
        ])
      ).rejects.toThrow('Store API request failed [400]: Item 999 is out of stock.');
      expect(woo.requests).toHaveLength(1);
    });

    it('rejects an invalid intended quantity without calling Woo mutations', async () => {
      const woo = createFakeWoo([{ key: 'w-1', id: 12, type: 'simple', quantity: 1, price: '3995' }]);
      vi.stubGlobal('fetch', woo.fakeFetch);

      await expect(reconcileStoreCart('tok-reconcile', [{ productId: '12', quantity: 0 }])).rejects.toThrow(
        /Invalid intended quantity/
      );
      expect(woo.requests).toHaveLength(0);
    });
  });
});
