import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WooCommerceEngine } from '../client';
import { fetchProducts, mapSortToOrderby } from '../products';
import { gqlClient } from '../graphql';
import * as currencyModule from '../currency';

describe('WooCommerce product queries and sorting', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('mapSortToOrderby', () => {
    it('correctly maps all supported sort keys to WPGraphQL orderby structure', () => {
      expect(mapSortToOrderby('price_asc')).toEqual([{ field: 'PRICE', order: 'ASC' }]);
      expect(mapSortToOrderby('price_desc')).toEqual([{ field: 'PRICE', order: 'DESC' }]);
      expect(mapSortToOrderby('newest')).toEqual([{ field: 'DATE', order: 'DESC' }]);
      expect(mapSortToOrderby('title_asc')).toEqual([{ field: 'NAME', order: 'ASC' }]);
      expect(mapSortToOrderby('title_desc')).toEqual([{ field: 'NAME', order: 'DESC' }]);
      expect(mapSortToOrderby(undefined)).toBeNull();
    });
  });

  describe('fetchProducts GraphQL variable binding', () => {
    it('passes pagination, filters, sorting, and stock status to GraphQL client', async () => {
      const mockPageInfo = {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'cur_start',
        endCursor: 'cur_end',
      };
      const mockNodes = [
        {
          databaseId: 101,
          slug: 'blood-pressure-monitor',
          name: 'Digital BP Monitor',
          sku: 'BPM-101',
          price: '499.00',
          stockStatus: 'IN_STOCK',
          stockQuantity: 15,
        },
      ];

      const spy = vi.spyOn(gqlClient, 'request').mockResolvedValueOnce({
        products: {
          pageInfo: mockPageInfo,
          nodes: mockNodes,
        },
      });

      const result = await fetchProducts({
        category: 'diagnostics',
        brand: 'omron',
        minPrice: 100,
        maxPrice: 600,
        search: 'digital',
        limit: 15,
        after: 'cur_prev',
        sort: 'price_asc',
        inStockOnly: true,
      });

      expect(spy).toHaveBeenCalledTimes(1);
      const [, variables] = spy.mock.calls[0] as unknown as [string, Record<string, any>];
      expect(variables.first).toBe(15);
      expect(variables.after).toBe('cur_prev');
      expect(variables.minPrice).toBe(100);
      expect(variables.maxPrice).toBe(600);
      expect(variables.category).toBe('diagnostics');
      expect(variables.search).toBe('digital');
      expect(variables.orderby).toEqual([{ field: 'PRICE', order: 'ASC' }]);
      expect(variables.stockStatus).toBe('IN_STOCK');

      expect(result.nodes).toEqual(mockNodes);
      expect(result.pageInfo).toEqual(mockPageInfo);
    });

    it('throws explicit error when GraphQL request fails', async () => {
      vi.spyOn(gqlClient, 'request').mockRejectedValueOnce(new Error('Network failure 503'));

      await expect(fetchProducts({ limit: 10 })).rejects.toThrow(
        /Failed to fetch products from WooCommerce: Network failure 503/
      );
    });
  });

  describe('WooCommerceEngine.listProducts', () => {
    it('validates query inputs and rejects cursor + offset combination', async () => {
      const engine = new WooCommerceEngine();
      await expect(
        engine.listProducts({
          cursor: 'cursor_1',
          offset: 10,
        })
      ).rejects.toThrow(/Cannot combine cursor-based and offset-based pagination/);
    });

    it('rejects negative price limits', async () => {
      const engine = new WooCommerceEngine();
      await expect(
        engine.listProducts({
          minPrice: -10,
        })
      ).rejects.toThrow(/Minimum price cannot be negative/);
    });

    it('maps products and returns complete ProductListResult with PageInfo', async () => {
      vi.spyOn(currencyModule, 'fetchCurrency').mockResolvedValue('MAD');
      vi.spyOn(gqlClient, 'request').mockResolvedValueOnce({
        products: {
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: 'c1',
            endCursor: 'c2',
          },
          nodes: [
            {
              databaseId: 201,
              slug: 'ecg-recorder',
              name: 'Portable ECG',
              sku: 'ECG-201',
              price: '1200.00',
              stockStatus: 'IN_STOCK',
              stockQuantity: 5,
            },
          ],
        },
      });

      const engine = new WooCommerceEngine();
      const res = await engine.listProducts({
        limit: 10,
        sort: 'newest',
      });

      expect(res.total).toBe(1);
      expect(res.items.length).toBe(1);
      expect(res.items[0]!.sku).toBe('ECG-201');
      expect(res.items[0]!.price).toEqual({ amount_minor: 120000, currency: 'MAD' });
      expect(res.pageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'c1',
        endCursor: 'c2',
      });
    });

    it('avoids N+1 queries: returns products in a single GraphQL query without extra individual fetches', async () => {
      vi.spyOn(currencyModule, 'fetchCurrency').mockResolvedValue('MAD');
      const gqlSpy = vi.spyOn(gqlClient, 'request').mockResolvedValueOnce({
        products: {
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
          },
          nodes: [
            { databaseId: 1, slug: 'p1', name: 'Product 1', price: '10.00' },
            { databaseId: 2, slug: 'p2', name: 'Product 2', price: '20.00' },
            { databaseId: 3, slug: 'p3', name: 'Product 3', price: '30.00' },
          ],
        },
      });

      const engine = new WooCommerceEngine();
      const res = await engine.listProducts({ limit: 10 });

      expect(res.items.length).toBe(3);
      // Exactly 1 GraphQL request for all products
      expect(gqlSpy).toHaveBeenCalledTimes(1);
    });
  });
});
