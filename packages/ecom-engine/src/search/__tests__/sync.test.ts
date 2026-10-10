import { describe, it, expect, beforeEach } from 'vitest';
import type { Product } from '../../types';
import { NativeWooSearchProvider } from '../native-woo-provider';
import { SearchSyncManager } from '../sync';
import type { SearchProvider, SearchDocument } from '../types';

describe('ECO-303: Reliable Search Synchronization Lifecycle', () => {
  let provider: NativeWooSearchProvider;
  let syncManager: SearchSyncManager;

  const mockProductA: Product = {
    id: 'prod_argan_oil',
    slug: 'huile-argan-pure',
    name: 'Huile d’Argan Pure 100ml',
    sku: 'ARGAN-100',
    description: 'Huile cosmétique pressée à froid.',
    price: { amount_minor: 15000, currency: 'MAD' },
    images: [{ url: 'https://cdn.example.com/argan.jpg', altText: 'Huile argan' }],
    categories: ['huiles', 'visage'],
    inventory: {
      status: 'IN_STOCK',
      quantity: 50,
      backordersAllowed: false,
      isPurchasable: true,
    },
  };

  const mockProductB: Product = {
    id: 'prod_rose_water',
    slug: 'eau-de-rose-kelat',
    name: 'Eau de Rose de Kelaat M’Gouna',
    sku: 'ROSE-250',
    description: 'Distillation artisanale.',
    price: { amount_minor: 8500, currency: 'MAD' },
    images: [{ url: 'https://cdn.example.com/rose.jpg', altText: 'Eau de rose' }],
    categories: ['eaux-florales'],
    inventory: {
      status: 'IN_STOCK',
      quantity: 20,
      backordersAllowed: false,
      isPurchasable: true,
    },
  };

  beforeEach(() => {
    provider = new NativeWooSearchProvider();
    syncManager = new SearchSyncManager({
      provider,
      maxRetries: 3,
      initialBackoffMs: 10,
      batchSize: 20,
    });
  });

  describe('1. Decoupled Event Queue & Ingestion', () => {
    it('enqueues events non-blockingly without immediate synchronous indexing', () => {
      const event = syncManager.enqueue({
        type: 'product.created',
        entityId: mockProductA.id,
        version: 1,
        product: mockProductA,
      });

      expect(event.id).toBeDefined();
      expect(event.type).toBe('product.created');
      expect(syncManager.getPendingEvents()).toHaveLength(1);

      // Verify provider has not yet indexed before processing
      const initialHealth = provider.health();
      return expect(initialHealth).resolves.toMatchObject({ documentCount: 0 });
    });

    it('processes queued product events and indexes them into search provider', async () => {
      syncManager.enqueue({
        type: 'product.created',
        entityId: mockProductA.id,
        version: 1,
        product: mockProductA,
      });

      const result = await syncManager.processAll();
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);

      const searchResult = await provider.search({ term: 'argan' });
      expect(searchResult.items).toHaveLength(1);
      expect(searchResult.items[0]?.id).toBe('prod_argan_oil');
    });
  });

  describe('2. Idempotency & Out-of-Order Version Protection', () => {
    it('safely skips stale out-of-order events with older versions', async () => {
      // 1. Process version 2
      syncManager.enqueue({
        type: 'product.created',
        entityId: mockProductA.id,
        version: 2,
        product: mockProductA,
      });
      await syncManager.processAll();

      // 2. An older version 1 arrives (e.g. delayed webhook or reordered network packet)
      syncManager.enqueue({
        type: 'product.updated',
        entityId: mockProductA.id,
        version: 1,
        product: {
          ...mockProductA,
          name: 'Old Outdated Name That Should Be Ignored',
        },
      });

      const batchResult = await syncManager.processAll();
      expect(batchResult.skipped).toBe(1);
      expect(batchResult.processed).toBe(0);

      // Verify title remained the version 2 title
      const searchResult = await provider.search({ term: 'argan' });
      expect(searchResult.items[0]?.title).toBe('Huile d’Argan Pure 100ml');
    });

    it('processes newer version 3 and updates the indexed document', async () => {
      syncManager.enqueue({
        type: 'product.created',
        entityId: mockProductA.id,
        version: 1,
        product: mockProductA,
      });
      await syncManager.processAll();

      syncManager.enqueue({
        type: 'product.updated',
        entityId: mockProductA.id,
        version: 3,
        product: {
          ...mockProductA,
          name: 'Huile d’Argan Bio Premium 100ml',
        },
      });
      const batchResult = await syncManager.processAll();
      expect(batchResult.processed).toBe(1);

      const searchResult = await provider.search({ term: 'premium' });
      expect(searchResult.items).toHaveLength(1);
      expect(searchResult.items[0]?.title).toBe('Huile d’Argan Bio Premium 100ml');
    });
  });

  describe('3. Document Removals (product.deleted)', () => {
    it('removes deleted product from the search index upon delete event', async () => {
      // Index product first
      syncManager.enqueue({
        type: 'product.created',
        entityId: mockProductA.id,
        version: 1,
        product: mockProductA,
      });
      await syncManager.processAll();

      let searchResult = await provider.search({ term: 'argan' });
      expect(searchResult.items).toHaveLength(1);

      // Now enqueue deletion event
      syncManager.enqueue({
        type: 'product.deleted',
        entityId: mockProductA.id,
        version: 2,
      });
      await syncManager.processAll();

      searchResult = await provider.search({ term: 'argan' });
      expect(searchResult.items).toHaveLength(0);
    });
  });

  describe('4. Lightweight Stock Updates (stock.updated)', () => {
    it('updates inStock and availabilityStatus on indexed document without full product payload', async () => {
      syncManager.enqueue({
        type: 'product.created',
        entityId: mockProductA.id,
        version: 1,
        product: mockProductA,
      });
      await syncManager.processAll();

      // Enqueue stock update
      syncManager.enqueue({
        type: 'stock.updated',
        entityId: mockProductA.id,
        version: 2,
        stock: {
          status: 'OUT_OF_STOCK',
          quantity: 0,
        },
      });
      await syncManager.processAll();

      const searchResult = await provider.search({ term: 'argan' });
      expect(searchResult.items[0]?.inStock).toBe(false);
      expect(searchResult.items[0]?.availabilityStatus).toBe('OUT_OF_STOCK');
    });
  });

  describe('5. Fault Tolerance & Dead-Letter Queue', () => {
    it('retries failing provider operations and routes to dead-letter queue after max retries', async () => {
      // Create a faulty search provider that always throws on sync
      const failingProvider: SearchProvider = {
        name: 'failing-provider',
        search: async () => ({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 1, query: '', provider: 'failing' }),
        suggest: async () => [],
        health: async () => ({ status: 'unhealthy', provider: 'failing', documentCount: 0 }),
        sync: async () => { throw new Error('Search cluster timeout'); },
        delete: async () => ({ deleted: 0 }),
        clear: async () => {},
      };

      const faultManager = new SearchSyncManager({
        provider: failingProvider,
        maxRetries: 3,
      });

      faultManager.enqueue({
        type: 'product.created',
        entityId: mockProductA.id,
        version: 1,
        product: mockProductA,
      });

      const batchResult = await faultManager.processAll();
      expect(batchResult.failed).toBe(1);
      expect(faultManager.getDeadLetterQueue()).toHaveLength(1);

      const deadLetter = faultManager.getDeadLetterQueue()[0];
      expect(deadLetter?.retries).toBe(3);
      expect(deadLetter?.error).toContain('Search cluster timeout');
    });
  });

  describe('6. Full Rebuild (rebuild)', () => {
    it('performs full index rebuild, synchronizes batch, and updates version state', async () => {
      const rebuildResult = await syncManager.rebuild([mockProductA, mockProductB]);

      expect(rebuildResult.indexed).toBe(2);
      expect(rebuildResult.failed).toBe(0);
      expect(rebuildResult.durationMs).toBeGreaterThanOrEqual(0);

      const health = await provider.health();
      expect(health.documentCount).toBe(2);

      const searchArgan = await provider.search({ term: 'argan' });
      expect(searchArgan.items).toHaveLength(1);

      const searchRose = await provider.search({ term: 'rose' });
      expect(searchRose.items).toHaveLength(1);
    });
  });

  describe('7. Periodic Reconciliation (reconcile)', () => {
    it('detects missing products, stale stock and orphaned docs, repairing discrepancies', async () => {
      // Setup initial index with Product A (in stock) and an orphaned product
      const orphanedDoc: SearchDocument = {
        id: 'prod_orphaned_deleted',
        slug: 'vieux-produit-supprime',
        title: 'Vieux Produit Supprimé',
        description: 'Doit être retiré',
        priceMinor: 1000,
        currency: 'MAD',
        categories: [],
        inStock: true,
      };
      await provider.sync([orphanedDoc]);

      // Authoritative list has Product A (out of stock) and Product B (missing from index)
      const authoritativeCatalog: Product[] = [
        {
          ...mockProductA,
          inventory: {
            status: 'OUT_OF_STOCK',
            quantity: 0,
            backordersAllowed: false,
            isPurchasable: false,
          },
        },
        mockProductB,
      ];

      const report = await syncManager.reconcile(authoritativeCatalog);

      expect(report.checkedCount).toBe(2);
      expect(report.missingCount).toBe(2); // Both were missing or repaired
      expect(report.orphanedCount).toBe(1); // Orphaned doc was detected and deleted
      expect(report.repairedCount).toBeGreaterThanOrEqual(2);

      // Verify orphaned document was deleted
      const searchOrphaned = await provider.search({ term: 'supprime' });
      expect(searchOrphaned.items).toHaveLength(0);

      // Verify Product B was indexed
      const searchRose = await provider.search({ term: 'rose' });
      expect(searchRose.items).toHaveLength(1);
    });
  });

  describe('8. Freshness Metrics & Propagation Lag', () => {
    it('measures propagation lag and tracks freshness metrics', async () => {
      syncManager.enqueue({
        type: 'product.created',
        entityId: mockProductA.id,
        version: 1,
        product: mockProductA,
        timestamp: new Date(Date.now() - 50).toISOString(), // 50ms ago
      });

      await syncManager.processAll();

      const metrics = syncManager.getFreshnessMetrics();
      expect(metrics.totalEventsProcessed).toBe(1);
      expect(metrics.totalEventsFailed).toBe(0);
      expect(metrics.lastProcessedAt).toBeDefined();
      expect(metrics.averagePropagationLagMs).toBeGreaterThanOrEqual(40);
    });
  });
});
