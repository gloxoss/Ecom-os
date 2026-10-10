import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStoreApiUrl,
  storeApiFetch,
  fetchStoreCart,
  addItemToStoreCart,
  updateStoreCartItem,
  removeStoreCartItem,
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

      expect(mockFetch).toHaveBeenCalledOnce();
      const call = mockFetch.mock.calls[0]!;
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
      expect(sessionCalls).toEqual(['guest-A', 'guest-B']);
    });
  });
});
