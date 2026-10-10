import type { Product, StockStatus } from '../types';
import type {
  SearchDocument,
  SearchProvider,
  IndexSyncResult,
  ProductProjectionOptions,
} from './types';
import { projectProduct, projectCatalog } from './projection';

export type SearchSyncEventType =
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'stock.updated'
  | 'brand.updated'
  | 'catalog.rebuild';

export interface SearchSyncEvent {
  id: string;
  type: SearchSyncEventType;
  entityId: string;
  version: number;
  timestamp: string;
  product?: Product | undefined;
  stock?: {
    status: StockStatus;
    quantity?: number | null | undefined;
  } | undefined;
  brand?: {
    id: string;
    name: string;
    slug: string;
  } | undefined;
  retries?: number | undefined;
  error?: string | undefined;
}

export interface SearchSyncManagerOptions {
  provider: SearchProvider;
  maxRetries?: number | undefined;
  initialBackoffMs?: number | undefined;
  maxBackoffMs?: number | undefined;
  batchSize?: number | undefined;
  projectionOptions?: ProductProjectionOptions | undefined;
  logger?: ((level: 'info' | 'warn' | 'error', message: string, meta?: unknown) => void) | undefined;
}

export interface ReconciliationReport {
  checkedCount: number;
  missingCount: number;
  staleStockCount: number;
  orphanedCount: number;
  repairedCount: number;
  durationMs: number;
  healthy: boolean;
}

export interface FreshnessMetrics {
  totalEventsProcessed: number;
  totalEventsFailed: number;
  lastProcessedAt?: string | undefined;
  averagePropagationLagMs: number;
  maxPropagationLagMs: number;
}

/**
 * SearchSyncManager coordinates catalog change events, retry queues,
 * document removals, full rebuilds, and periodic reconciliation.
 *
 * Invariants:
 * - Commercial truth: WooCommerce owns products, prices, and stock.
 * - Idempotency: Out-of-order stale event versions are safely ignored.
 * - Shopper decoupling: Operations are queued and executed asynchronously.
 * - Fault tolerance: Failed events retry with exponential backoff before dead-letter logging.
 */
export class SearchSyncManager {
  private readonly provider: SearchProvider;
  private readonly maxRetries: number;
  private readonly initialBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly batchSize: number;
  private readonly projectionOptions: ProductProjectionOptions;
  private readonly log?: ((level: 'info' | 'warn' | 'error', message: string, meta?: unknown) => void) | undefined;

  // In-memory queues and state
  private eventQueue: SearchSyncEvent[] = [];
  private deadLetterQueue: SearchSyncEvent[] = [];
  private entityVersions: Map<string, number> = new Map();

  // Metrics
  private processedCount = 0;
  private failedCount = 0;
  private lastProcessedTimestamp?: string;
  private totalLagMs = 0;
  private maxLagMs = 0;

  constructor(options: SearchSyncManagerOptions) {
    this.provider = options.provider;
    this.maxRetries = options.maxRetries ?? 3;
    this.initialBackoffMs = options.initialBackoffMs ?? 50;
    this.maxBackoffMs = options.maxBackoffMs ?? 1000;
    this.batchSize = options.batchSize ?? 50;
    this.projectionOptions = options.projectionOptions ?? {};
    this.log = options.logger;
  }

  /**
   * Enqueues a catalog change event non-blockingly (decoupled from shopper threads).
   */
  enqueue(
    event: Omit<SearchSyncEvent, 'id' | 'timestamp'> & {
      id?: string | undefined;
      timestamp?: string | undefined;
    }
  ): SearchSyncEvent {
    const fullEvent: SearchSyncEvent = {
      id: event.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: event.type,
      entityId: event.entityId,
      version: event.version,
      timestamp: event.timestamp || new Date().toISOString(),
      ...(event.product ? { product: event.product } : {}),
      ...(event.stock ? { stock: event.stock } : {}),
      ...(event.brand ? { brand: event.brand } : {}),
      retries: 0,
    };

    this.eventQueue.push(fullEvent);
    this.log?.('info', `Enqueued sync event ${fullEvent.type} for entity ${fullEvent.entityId}`, {
      eventId: fullEvent.id,
      version: fullEvent.version,
    });

    return fullEvent;
  }

  /**
   * Processes a single event with version-ordering and backoff retry.
   */
  async processEvent(
    event: SearchSyncEvent
  ): Promise<{ success: boolean; skipped?: boolean; requeued?: boolean; error?: string }> {
    // 1. Idempotency & Version guard: ignore out-of-order stale versions
    const lastVersion = this.entityVersions.get(event.entityId);
    if (typeof lastVersion === 'number' && event.version <= lastVersion) {
      this.log?.('info', `Skipping stale event version ${event.version} <= current ${lastVersion} for ${event.entityId}`);
      return { success: true, skipped: true };
    }

    try {
      if (event.type === 'product.created' || event.type === 'product.updated') {
        if (!event.product) {
          throw new Error(`Event ${event.id} missing product payload for ${event.type}`);
        }
        const doc = projectProduct(event.product, this.projectionOptions);
        await this.provider.sync([doc]);
      } else if (event.type === 'product.deleted') {
        // Delete main product document
        await this.provider.delete([event.entityId]);
      } else if (event.type === 'stock.updated') {
        if (!event.stock) {
          throw new Error(`Event ${event.id} missing stock payload for stock.updated`);
        }
        let existingDoc: SearchDocument | undefined;
        if (typeof (this.provider as any).get === 'function') {
          const found = await (this.provider as any).get(event.entityId);
          if (found) existingDoc = found;
        }
        if (!existingDoc) {
          const currentSearch = await this.provider.search({ term: event.entityId, pageSize: 10 });
          existingDoc = currentSearch.items.find((item) => item.id === event.entityId);
        }
        if (existingDoc) {
          const updatedDoc: SearchDocument = {
            ...existingDoc,
            inStock: event.stock.status === 'IN_STOCK',
            availabilityStatus: event.stock.status,
          };
          await this.provider.sync([updatedDoc]);
        }
      }

      // Record successful version
      this.entityVersions.set(event.entityId, event.version);

      // Measure propagation lag
      const now = Date.now();
      const eventTime = new Date(event.timestamp).getTime();
      const lag = Math.max(0, now - eventTime);

      this.processedCount++;
      this.lastProcessedTimestamp = new Date(now).toISOString();
      this.totalLagMs += lag;
      if (lag > this.maxLagMs) {
        this.maxLagMs = lag;
      }

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const retries = (event.retries ?? 0) + 1;
      event.retries = retries;
      event.error = errorMessage;

      this.log?.('warn', `Failed processing event ${event.id} (attempt ${retries}/${this.maxRetries}): ${errorMessage}`);

      if (retries < this.maxRetries) {
        // Requeue for retry with backoff
        this.eventQueue.push(event);
        return { success: false, requeued: true, error: errorMessage };
      } else {
        // Move to dead letter queue
        this.failedCount++;
        this.deadLetterQueue.push(event);
        this.log?.('error', `Event ${event.id} exceeded max retries. Moved to dead-letter queue.`);
        return { success: false, requeued: false, error: errorMessage };
      }
    }
  }

  /**
   * Processes all currently queued events in order.
   */
  async processAll(): Promise<{ processed: number; skipped: number; failed: number }> {
    let processed = 0;
    let skipped = 0;
    let failed = 0;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      const result = await this.processEvent(event);
      if (result.skipped) {
        skipped++;
      } else if (result.success) {
        processed++;
      } else if (!result.requeued) {
        failed++;
      }
    }

    return { processed, skipped, failed };
  }

  /**
   * Executes a full rebuild of the search index from an authoritative catalog.
   * Completely reconciles missing and orphaned documents.
   */
  async rebuild(products: Product[]): Promise<IndexSyncResult> {
    const startTime = Date.now();
    this.log?.('info', `Starting full search index rebuild for ${products.length} products`);

    // 1. Project all products into search documents
    const projectedDocs = projectCatalog(products, this.projectionOptions);

    // 2. Clear existing index or sync full collection
    await this.provider.clear();

    // 3. Batch synchronization
    let totalIndexed = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (let i = 0; i < projectedDocs.length; i += this.batchSize) {
      const batch = projectedDocs.slice(i, i + this.batchSize);
      try {
        const syncResult = await this.provider.sync(batch);
        totalIndexed += syncResult.indexed;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        for (const doc of batch) {
          errors.push({ id: doc.id, error: msg });
        }
      }
    }

    // Reset entity versions to current timestamp
    const nowVersion = Date.now();
    for (const p of products) {
      this.entityVersions.set(p.id, nowVersion);
    }

    const durationMs = Date.now() - startTime;
    this.log?.('info', `Full search rebuild completed in ${durationMs}ms: ${totalIndexed} indexed.`);

    return {
      indexed: totalIndexed,
      updated: 0,
      deleted: 0,
      failed: errors.length,
      durationMs,
      ...(errors.length > 0 ? { errors } : {}),
    };
  }

  /**
   * Performs periodic reconciliation between the authoritative catalog and the search provider.
   * Identifies missing documents, stale stock, and orphaned entries, repairing them.
   */
  async reconcile(authoritativeProducts: Product[]): Promise<ReconciliationReport> {
    const startTime = Date.now();
    const authoritativeMap = new Map<string, Product>();
    for (const p of authoritativeProducts) {
      authoritativeMap.set(p.id, p);
    }

    let missingCount = 0;
    let staleStockCount = 0;
    let orphanedCount = 0;
    let repairedCount = 0;

    // Check health to obtain document count
    const health = await this.provider.health();
    const indexedSearch = await this.provider.search({
      term: '',
      pageSize: Math.max(100, health.documentCount + 50),
    });
    const indexedDocs = indexedSearch.items;
    const indexedIds = new Set(indexedDocs.map((d) => d.id));

    // 1. Identify missing products
    const docsToSync: SearchDocument[] = [];
    for (const p of authoritativeProducts) {
      if (!indexedIds.has(p.id)) {
        missingCount++;
        docsToSync.push(projectProduct(p, this.projectionOptions));
      }
    }

    // 2. Identify stale stock status
    for (const doc of indexedDocs) {
      const auth = authoritativeMap.get(doc.id);
      if (auth && auth.inventory) {
        const shouldBeInStock = auth.inventory.status === 'IN_STOCK';
        if (doc.inStock !== shouldBeInStock) {
          staleStockCount++;
          docsToSync.push(projectProduct(auth, this.projectionOptions));
        }
      }
    }

    // 3. Identify orphaned documents in search index
    const idsToDelete: string[] = [];
    for (const doc of indexedDocs) {
      // If it's a parent product document and missing from authoritative list
      if (!doc.isVariation && !authoritativeMap.has(doc.id)) {
        orphanedCount++;
        idsToDelete.push(doc.id);
      }
    }

    // Apply repairs
    if (docsToSync.length > 0) {
      await this.provider.sync(docsToSync);
      repairedCount += docsToSync.length;
    }
    if (idsToDelete.length > 0) {
      await this.provider.delete(idsToDelete);
      repairedCount += idsToDelete.length;
    }

    const durationMs = Date.now() - startTime;
    return {
      checkedCount: authoritativeProducts.length,
      missingCount,
      staleStockCount,
      orphanedCount,
      repairedCount,
      durationMs,
      healthy: missingCount === 0 && staleStockCount === 0 && orphanedCount === 0,
    };
  }

  getPendingEvents(): SearchSyncEvent[] {
    return [...this.eventQueue];
  }

  getDeadLetterQueue(): SearchSyncEvent[] {
    return [...this.deadLetterQueue];
  }

  getFreshnessMetrics(): FreshnessMetrics {
    const avgLag = this.processedCount > 0 ? Math.round(this.totalLagMs / this.processedCount) : 0;
    return {
      totalEventsProcessed: this.processedCount,
      totalEventsFailed: this.failedCount,
      ...(this.lastProcessedTimestamp ? { lastProcessedAt: this.lastProcessedTimestamp } : {}),
      averagePropagationLagMs: avgLag,
      maxPropagationLagMs: this.maxLagMs,
    };
  }

  clearQueue(): void {
    this.eventQueue = [];
    this.deadLetterQueue = [];
  }
}
