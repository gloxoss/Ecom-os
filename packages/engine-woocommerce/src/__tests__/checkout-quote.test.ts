import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  updateStoreCustomer,
  selectStoreShippingRate,
  extractShippingPackages,
  type UpdateCustomerInput,
} from '../cart';
import { WooCommerceEngine } from '../client';

describe('Authoritative Destination-Based Checkout Quotation (ECO-203)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubEnv('WC_STORE_API_URL', 'https://paraloca.local/wp-json/wc/store/v1');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('extractShippingPackages', () => {
    it('returns empty array when raw data or shipping_rates is missing', () => {
      expect(extractShippingPackages(null)).toEqual([]);
      expect(extractShippingPackages({})).toEqual([]);
      expect(extractShippingPackages({ shipping_rates: [] })).toEqual([]);
    });

    it('extracts packages and rates with minor units and currency', () => {
      const raw = {
        shipping_rates: [
          {
            package_id: 0,
            name: 'Standard Package',
            shipping_rates: [
              {
                rate_id: 'flat_rate:1',
                name: 'Livraison Casablanca',
                description: 'Livraison express 24h',
                delivery_time: '24-48h',
                price: '3500',
                taxes: '700',
                selected: true,
                currency_code: 'MAD',
                method_id: 'flat_rate',
                instance_id: 1,
              },
              {
                rate_id: 'free_shipping:2',
                name: 'Livraison Gratuite',
                price: '0',
                taxes: '0',
                selected: false,
                currency_code: 'MAD',
                method_id: 'free_shipping',
              },
            ],
          },
        ],
      };

      const packages = extractShippingPackages(raw, 'MAD');
      expect(packages).toHaveLength(1);
      expect(packages[0]?.package_id).toBe(0);
      expect(packages[0]?.rates).toHaveLength(2);

      const r1 = packages[0]!.rates[0]!;
      expect(r1.rate_id).toBe('flat_rate:1');
      expect(r1.price_minor).toBe(3500);
      expect(r1.taxes_minor).toBe(700);
      expect(r1.selected).toBe(true);
      expect(r1.currency).toBe('MAD');

      const r2 = packages[0]!.rates[1]!;
      expect(r2.rate_id).toBe('free_shipping:2');
      expect(r2.price_minor).toBe(0); // Zero-fee delivery distinguished from unavailable
      expect(r2.selected).toBe(false);
    });
  });

  describe('updateStoreCustomer', () => {
    it('sends customer addresses to Store API and receives destination-quoted rates and totals', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Cart-Token': 'sess-token-123' }),
        json: async () => ({
          items: [{ key: 'line-1', id: 10, quantity: 2, prices: { price: '5000', currency_code: 'MAD' } }],
          totals: {
            currency_code: 'MAD',
            total_items: '10000',
            total_shipping: '3500',
            total_tax: '700',
            total_discount: '0',
            total_price: '14200',
          },
          shipping_rates: [
            {
              package_id: 0,
              name: 'Shipping',
              shipping_rates: [
                {
                  rate_id: 'flat_rate:1',
                  name: 'Livraison Standard',
                  price: '3500',
                  taxes: '700',
                  selected: true,
                  currency_code: 'MAD',
                },
              ],
            },
          ],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const addressInput: UpdateCustomerInput = {
        billing_address: {
          first_name: 'Fatima',
          last_name: 'Zahra',
          address_1: 'Avenue des FAR',
          city: 'Casablanca',
          country: 'MA',
          postcode: '20000',
          email: 'fatima@example.com',
          phone: '+212612345678',
        },
        shipping_address: {
          first_name: 'Fatima',
          last_name: 'Zahra',
          address_1: 'Avenue des FAR',
          city: 'Casablanca',
          country: 'MA',
          postcode: '20000',
        },
      };

      const result = await updateStoreCustomer('sess-token-123', addressInput);

      expect(mockFetch.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'POST')).toBe(true);
      const call = mockFetch.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === 'POST') ?? mockFetch.mock.calls[0]!;
      expect(call[0]).toContain('/cart/update-customer');
      const headers = call[1]?.headers as Headers;
      expect(headers.get('Cart-Token')).toBe('sess-token-123');

      expect(result.cart.total.amount_minor).toBe(14200);
      expect(result.shippingTotal.amount_minor).toBe(3500);
      expect(result.taxTotal.amount_minor).toBe(700);
      expect(result.shippingPackages).toHaveLength(1);
      expect(result.shippingPackages[0]?.rates[0]?.rate_id).toBe('flat_rate:1');
    });

    it('rejects unsupported destination or invalid customer data with authoritative Store API error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        json: async () => ({
          code: 'rest_invalid_param',
          message: 'Invalid country code provided.',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(
        updateStoreCustomer('sess-err', {
          shipping_address: { country: 'INVALID' },
        })
      ).rejects.toThrow('Store API request failed [400]: Invalid country code provided.');
    });
  });

  describe('selectStoreShippingRate', () => {
    it('dispatches selected shipping rate and recalculates authoritative cart totals', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Cart-Token': 'sess-ship-456' }),
        json: async () => ({
          items: [{ key: 'line-1', id: 10, quantity: 1, prices: { price: '20000', currency_code: 'MAD' } }],
          totals: {
            currency_code: 'MAD',
            total_items: '20000',
            total_shipping: '5000',
            total_tax: '1000',
            total_discount: '0',
            total_price: '26000',
          },
          shipping_rates: [
            {
              package_id: 0,
              name: 'Shipping',
              shipping_rates: [
                {
                  rate_id: 'express:9',
                  name: 'Livraison Express Prioritaire',
                  price: '5000',
                  taxes: '1000',
                  selected: true,
                  currency_code: 'MAD',
                },
              ],
            },
          ],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await selectStoreShippingRate('sess-ship-456', 0, 'express:9');

      expect(mockFetch.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'POST')).toBe(true);
      const call = mockFetch.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === 'POST') ?? mockFetch.mock.calls[0]!;
      expect(call[0]).toContain('/cart/select-shipping-rate');
      const body = JSON.parse(call[1]?.body as string);
      expect(body).toEqual({ package_id: 0, rate_id: 'express:9' });

      expect(result.cart.total.amount_minor).toBe(26000);
      expect(result.shippingTotal.amount_minor).toBe(5000);
      expect(result.taxTotal.amount_minor).toBe(1000);
      expect(result.shippingPackages[0]?.rates[0]?.selected).toBe(true);
    });
  });

  describe('WooCommerceEngine Quotation Integration', () => {
    it('delegates updateCustomerAddress and selectShippingRate through engine methods', async () => {
      const engine = new WooCommerceEngine();

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Cart-Token': 'engine-tok' }),
        json: async () => ({
          items: [],
          totals: { currency_code: 'MAD', total_items: '0', total_price: '0' },
          shipping_rates: [],
        }),
      }));

      const quote = await engine.updateCustomerAddress('engine-tok', {
        shipping_address: { country: 'MA', city: 'Fes' },
      });
      expect(quote.cartToken).toBe('engine-tok');
      expect(quote.shippingPackages).toEqual([]);

      const selected = await engine.selectShippingRate('engine-tok', 'rate-1', 0);
      expect(selected.cartToken).toBe('engine-tok');
    });
  });
});

