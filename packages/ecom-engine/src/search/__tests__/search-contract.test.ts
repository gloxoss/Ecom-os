import { describe, it, expect, vi } from 'vitest';
import {
  SearchDocument,
  NativeWooSearchProvider,
  MeilisearchProvider,
  TypesenseProvider,
  FallbackSearchProvider,
  sanitizeSearchDocument,
} from '../index';

describe('SearchProvider Abstraction & Contract Tests (ECO-301)', () => {
  const sampleCatalog: SearchDocument[] = [
    {
      id: 'prod-1',
      slug: 'creme-hydratante-bio',
      title: 'Crème Hydratante Bio',
      description: 'Soin visage apaisant et nourrissant pour peaux sensibles',
      sku: 'SKU-CREME-BIO',
      priceMinor: 14900,
      currency: 'MAD',
      brand: { id: 'brand-1', name: 'Dar Botanica', slug: 'dar-botanica' },
      categories: [{ id: 'cat-1', name: 'Soins Visage', slug: 'soins-visage' }],
      inStock: true,
      tags: ['bio', 'visage', 'naturel'],
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'prod-2',
      slug: 'huile-argan-pure',
      title: "Huile d'Argan Pure 100ml",
      description: 'Huile cosmétique pressée à froid du terroir marocain',
      sku: 'SKU-ARGAN-100',
      priceMinor: 22000,
      currency: 'MAD',
      brand: { id: 'brand-1', name: 'Dar Botanica', slug: 'dar-botanica' },
      categories: [
        { id: 'cat-1', name: 'Soins Visage', slug: 'soins-visage' },
        { id: 'cat-2', name: 'Huiles & Sérums', slug: 'huiles-serums' },
      ],
      inStock: true,
      tags: ['argan', 'maroc', 'bio'],
      createdAt: '2026-02-15T12:00:00Z',
    },
    {
      id: 'prod-3',
      slug: 'savon-noir-eucalyptus',
      title: "Savon Noir Beldi à l'Eucalyptus",
      description: 'Gommage traditionnel pour le hammam',
      sku: 'SKU-SAVON-EUC',
      priceMinor: 6500,
      currency: 'MAD',
      brand: { id: 'brand-2', name: 'Atlas Pure', slug: 'atlas-pure' },
      categories: [{ id: 'cat-3', name: 'Corps & Bain', slug: 'corps-bain' }],
      inStock: false,
      tags: ['hammam', 'savon', 'corps'],
      createdAt: '2026-03-01T09:00:00Z',
    },
  ];

  describe('Search Document Sanitizer & Invariant Guards', () => {
    it('accepts and sanitizes valid public document fields', () => {
      const sanitized = sanitizeSearchDocument(sampleCatalog[0] as unknown as Record<string, unknown>);
      expect(sanitized.id).toBe('prod-1');
      expect(sanitized.title).toBe('Crème Hydratante Bio');
      expect(sanitized.priceMinor).toBe(14900);
      expect(sanitized.brand?.name).toBe('Dar Botanica');
    });

    it('rejects documents containing customer data or private tokens', () => {
      expect(() =>
        sanitizeSearchDocument({
          ...sampleCatalog[0],
          customerEmail: 'leak@example.com',
        } as unknown as Record<string, unknown>)
      ).toThrow(/Security violation: private field "customerEmail"/);

      expect(() =>
        sanitizeSearchDocument({
          ...sampleCatalog[0],
          cartToken: 'cart_token_xyz',
        } as unknown as Record<string, unknown>)
      ).toThrow(/Security violation: private field "cartToken"/);

      expect(() =>
        sanitizeSearchDocument({
          ...sampleCatalog[0],
          orderKey: 'wc_order_secret',
        } as unknown as Record<string, unknown>)
      ).toThrow(/Security violation: private field "orderKey"/);
    });

    it('rejects documents with invalid required fields', () => {
      expect(() => sanitizeSearchDocument({ title: 'No ID' })).toThrow(/requires a non-empty string "id"/);
      expect(() => sanitizeSearchDocument({ id: '1', title: 'No slug' })).toThrow(/requires a non-empty string "slug"/);
      expect(() => sanitizeSearchDocument({ id: '1', slug: 's', title: 'No price' })).toThrow(/requires a valid numeric "priceMinor"/);
    });
  });

  describe('Repaired NativeWooSearchProvider', () => {
    it('indexes and executes text search with French accent normalization', async () => {
      const provider = new NativeWooSearchProvider(sampleCatalog);

      // Search with unaccented term "creme" matches "Crème"
      const res = await provider.search({ term: 'creme' });
      expect(res.total).toBe(1);
      expect(res.items[0]?.id).toBe('prod-1');
      expect(res.fallbackUsed).toBe(false);

      // Search by SKU
      const resSku = await provider.search({ term: 'SKU-ARGAN' });
      expect(resSku.total).toBe(1);
      expect(resSku.items[0]?.id).toBe('prod-2');
    });

    it('filters by category, brand, stock, and price boundaries', async () => {
      const provider = new NativeWooSearchProvider(sampleCatalog);

      // Filter by category
      const resCat = await provider.search({ term: '', categorySlug: 'soins-visage' });
      expect(resCat.total).toBe(2);

      // Filter in-stock only (excludes out-of-stock Savon Noir)
      const resStock = await provider.search({ term: '', inStockOnly: true });
      expect(resStock.total).toBe(2);
      expect(resStock.items.some((i) => i.id === 'prod-3')).toBe(false);

      // Price filter
      const resPrice = await provider.search({ term: '', minPriceMinor: 10000, maxPriceMinor: 20000 });
      expect(resPrice.total).toBe(1);
      expect(resPrice.items[0]?.id).toBe('prod-1');
    });

    it('computes accurate category, brand, and stock facets', async () => {
      const provider = new NativeWooSearchProvider(sampleCatalog);
      const res = await provider.search({
        term: '',
        facets: ['categories', 'brands', 'inStock'],
      });

      expect(res.facets).toBeDefined();
      expect(res.facets?.categories?.counts.length).toBeGreaterThanOrEqual(2);
      expect(res.facets?.brands?.counts.length).toBe(2);
      expect(res.facets?.inStock?.counts.find((c) => c.value === 'true')?.count).toBe(2);
      expect(res.facets?.inStock?.counts.find((c) => c.value === 'false')?.count).toBe(1);
    });

    it('supports sorting by price and newest', async () => {
      const provider = new NativeWooSearchProvider(sampleCatalog);

      const resAsc = await provider.search({ term: '', sort: 'price_asc' });
      expect(resAsc.items[0]?.id).toBe('prod-3'); // 6500 MAD
      expect(resAsc.items[2]?.id).toBe('prod-2'); // 22000 MAD

      const resDesc = await provider.search({ term: '', sort: 'price_desc' });
      expect(resDesc.items[0]?.id).toBe('prod-2'); // 22000 MAD
      expect(resDesc.items[2]?.id).toBe('prod-3'); // 6500 MAD
    });

    it('provides typeahead suggestions for terms', async () => {
      const provider = new NativeWooSearchProvider(sampleCatalog);
      const suggestions = await provider.suggest('argan', 5);

      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      expect(suggestions.some((s) => s.text.includes('Argan'))).toBe(true);
    });

    it('reports index health and handles sync/deletion', async () => {
      const provider = new NativeWooSearchProvider(sampleCatalog);
      const health = await provider.health();
      expect(health.status).toBe('healthy');
      expect(health.documentCount).toBe(3);

      // Delete an item
      await provider.delete(['prod-1']);
      const updatedHealth = await provider.health();
      expect(updatedHealth.documentCount).toBe(2);

      // Clear
      await provider.clear();
      expect((await provider.health()).documentCount).toBe(0);
    });
  });

  describe('MeilisearchProvider & TypesenseProvider Contracts', () => {
    it('Meilisearch conforms to contract and handles sync and offline state', async () => {
      const meili = new MeilisearchProvider({ host: 'http://localhost:7700' });
      await meili.sync(sampleCatalog);

      const health = await meili.health();
      expect(health.status).toBe('healthy');
      expect(health.documentCount).toBe(3);

      const searchRes = await meili.search({ term: 'argan' });
      expect(searchRes.items.length).toBe(1);

      // Simulate connection outage
      meili.setOnlineStatus(false);
      await expect(meili.search({ term: 'argan' })).rejects.toThrow(/Meilisearch connection error/);
      expect((await meili.health()).status).toBe('unhealthy');
    });

    it('Typesense conforms to contract and handles sync and offline state', async () => {
      const typesense = new TypesenseProvider({
        nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
      });
      await typesense.sync(sampleCatalog);

      const health = await typesense.health();
      expect(health.status).toBe('healthy');
      expect(health.documentCount).toBe(3);

      const searchRes = await typesense.search({ term: 'argan' });
      expect(searchRes.items.length).toBe(1);

      // Simulate cluster outage
      typesense.setOnlineStatus(false);
      await expect(typesense.search({ term: 'argan' })).rejects.toThrow(/Typesense node connection error/);
      expect((await typesense.health()).status).toBe('unhealthy');
    });
  });

  describe('FallbackSearchProvider Resilience & Explicit Failure', () => {
    it('routes to primary when primary is online', async () => {
      const primary = new MeilisearchProvider({ host: 'http://localhost:7700' });
      const fallback = new NativeWooSearchProvider(sampleCatalog);
      await primary.sync(sampleCatalog);

      const fallbackProvider = new FallbackSearchProvider({ primary, fallback });
      const res = await fallbackProvider.search({ term: 'argan' });

      expect(res.fallbackUsed).toBe(false);
      expect(res.items.length).toBe(1);
      expect(res.provider).toBe('meilisearch');
    });

    it('seamlessly falls back to native search when primary throws an error', async () => {
      const primary = new MeilisearchProvider({ host: 'http://localhost:7700' });
      const fallback = new NativeWooSearchProvider(sampleCatalog);
      const loggerSpy = vi.fn();

      const fallbackProvider = new FallbackSearchProvider({
        primary,
        fallback,
        logger: loggerSpy,
      });

      // Break primary
      primary.setOnlineStatus(false);

      const res = await fallbackProvider.search({ term: 'argan' });
      expect(res.fallbackUsed).toBe(true);
      expect(res.items.length).toBe(1);
      expect(res.provider).toBe('native-woocommerce');
      expect(loggerSpy).toHaveBeenCalledWith(
        'warn',
        expect.stringContaining('Primary search provider "meilisearch" failed, falling back to "native-woocommerce"'),
        expect.any(Object)
      );
    });

    it('fails explicitly without returning silent empty results when both fail', async () => {
      const primary = new MeilisearchProvider({ host: 'http://localhost:7700' });
      const fallback = new NativeWooSearchProvider();
      vi.spyOn(fallback, 'search').mockRejectedValueOnce(new Error('Native catalog database error'));

      primary.setOnlineStatus(false);

      const fallbackProvider = new FallbackSearchProvider({ primary, fallback });

      await expect(fallbackProvider.search({ term: 'argan' })).rejects.toThrow(
        /Search service unavailable. Primary error: .* Fallback error: .*/
      );
    });

    it('reports degraded health when primary is down but fallback is healthy', async () => {
      const primary = new MeilisearchProvider({ host: 'http://localhost:7700' });
      const fallback = new NativeWooSearchProvider(sampleCatalog);
      const fallbackProvider = new FallbackSearchProvider({ primary, fallback });

      // When primary is healthy
      expect((await fallbackProvider.health()).status).toBe('healthy');

      // When primary fails
      primary.setOnlineStatus(false);
      const health = await fallbackProvider.health();
      expect(health.status).toBe('degraded');
      expect(health.message).toContain('serving from fallback [native-woocommerce]');
    });
  });
});

