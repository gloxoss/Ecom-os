import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { RfqQuote } from '../../../../../../packages/addons-rfq/src/index';

/**
 * Server-side quote persistence for the RFQ addon.
 *
 * Both RFQ API routes (submission and offers) read and write through this single
 * store, so a quote submitted at `/api/rfq` is immediately the quote a merchant
 * offer endpoint or guest token read resolves against. Before this module each
 * route kept its own private `Map`, which is why a submitted quote never became
 * a readable offer.
 *
 * WordPress integration point: the companion plugin (`plugins/wp-ecomos-rfq/`,
 * REST namespace `ecomos/v1/rfq`) is the production persistence layer. A
 * WordPress-backed implementation of `RfqQuoteStore` that calls
 * `POST /wp-json/ecomos/v1/rfq/quotes` and `GET /wp-json/ecomos/v1/rfq/quotes/{id}`
 * should replace the local store returned by `createDefaultRfqQuoteStore()`.
 * That implementation is NOT shipped here: no live WordPress instance is
 * available in this environment, so the durable path below is local-only.
 */

/**
 * A cached submission response, bound to the guest who created it.
 *
 * `ownerKey` is what makes idempotent replay safe. The cached response contains
 * the quote's `accessSecret`, which is a bearer grant to read and accept the
 * offer, so a different caller presenting the same Idempotency-Key must never
 * receive this entry.
 */
export interface StoredIdempotencyEntry {
  ownerKey: string;
  statusCode: number;
  data: {
    success: boolean;
    quoteId: string;
    quoteNumber: string;
    accessSecret: string;
    state: string;
  };
}

/**
 * Persistence for RFQ quotes.
 *
 * Every method is asynchronous because the production implementation is the
 * WordPress companion plugin, reached over HTTP. A synchronous interface could
 * only be satisfied by blocking the event loop on a network call inside a Next.js
 * route, so the interface was made async when the WordPress store was added.
 */
export interface RfqQuoteStore {
  getQuote(id: string): Promise<RfqQuote | undefined>;
  putQuote(quote: RfqQuote): Promise<void>;
  listQuoteIds(): Promise<string[]>;
  getIdempotency(key: string): Promise<StoredIdempotencyEntry | undefined>;
  putIdempotency(key: string, entry: StoredIdempotencyEntry): Promise<void>;
  clear(): Promise<void>;
}

export class InMemoryRfqQuoteStore implements RfqQuoteStore {
  private quotes = new Map<string, RfqQuote>();
  private idempotency = new Map<string, StoredIdempotencyEntry>();

  async getQuote(id: string): Promise<RfqQuote | undefined> {
    return this.quotes.get(id);
  }

  async putQuote(quote: RfqQuote): Promise<void> {
    this.quotes.set(quote.id, quote);
  }

  async listQuoteIds(): Promise<string[]> {
    return [...this.quotes.keys()];
  }

  async getIdempotency(key: string): Promise<StoredIdempotencyEntry | undefined> {
    return this.idempotency.get(key);
  }

  async putIdempotency(key: string, entry: StoredIdempotencyEntry): Promise<void> {
    this.idempotency.set(key, entry);
  }

  async clear(): Promise<void> {
    this.quotes.clear();
    this.idempotency.clear();
  }
}

interface PersistedRfqState {
  version: 1;
  quotes: Record<string, RfqQuote>;
  idempotency: Record<string, StoredIdempotencyEntry>;
}

/**
 * File-backed store for a single host, mirroring `JsonFileAttemptStore` in
 * `packages/engine-woocommerce/src/checkout-attempts.ts`.
 *
 * Writes are atomic (temp file + rename) so a crash mid-write cannot leave a
 * quote or an idempotency entry half-written. The file is the source of truth on
 * construction, so a rebuilt process (dev reload, restart, redeploy on one host)
 * reads back quotes and replays it already accepted. It is not a distributed
 * lock: multiple hosts still need a shared store or the WordPress repository.
 */
export class JsonFileRfqQuoteStore implements RfqQuoteStore {
  private filePath: string;
  private loaded = false;
  private quotes = new Map<string, RfqQuote>();
  private idempotency = new Map<string, StoredIdempotencyEntry>();

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private load(): void {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const raw = readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<PersistedRfqState>;
      if (parsed && typeof parsed === 'object') {
        for (const [id, quote] of Object.entries(parsed.quotes ?? {})) {
          this.quotes.set(id, quote);
        }
        for (const [key, entry] of Object.entries(parsed.idempotency ?? {})) {
          this.idempotency.set(key, entry);
        }
      }
    } catch {
      // Absent or unreadable store: start empty rather than failing a guest submission.
    }
  }

  private persist(): void {
    const dir = path.dirname(this.filePath);
    mkdirSync(dir, { recursive: true });
    const payload: PersistedRfqState = {
      version: 1,
      quotes: Object.fromEntries(this.quotes),
      idempotency: Object.fromEntries(this.idempotency),
    };
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf8');
    renameSync(tmp, this.filePath);
  }

  async getQuote(id: string): Promise<RfqQuote | undefined> {
    this.load();
    return this.quotes.get(id);
  }

  async putQuote(quote: RfqQuote): Promise<void> {
    this.load();
    this.quotes.set(quote.id, quote);
    this.persist();
  }

  async listQuoteIds(): Promise<string[]> {
    this.load();
    return [...this.quotes.keys()];
  }

  async getIdempotency(key: string): Promise<StoredIdempotencyEntry | undefined> {
    this.load();
    return this.idempotency.get(key);
  }

  async putIdempotency(key: string, entry: StoredIdempotencyEntry): Promise<void> {
    this.load();
    this.idempotency.set(key, entry);
    this.persist();
  }

  async clear(): Promise<void> {
    this.load();
    this.quotes.clear();
    this.idempotency.clear();
    this.persist();
  }
}

/**
 * Picks the store for this process. `ECOM_RFQ_STORE_PATH` switches on the
 * durable file store (the same convention as `ECOM_ATTEMPT_STORE_PATH` for
 * checkout attempts); without it the process keeps an in-memory store, which is
 * only correct for tests and single-shot local runs.
 */
export function createDefaultRfqQuoteStore(): RfqQuoteStore {
  const filePath = process.env.ECOM_RFQ_STORE_PATH;
  return filePath ? new JsonFileRfqQuoteStore(filePath) : new InMemoryRfqQuoteStore();
}

let sharedStore: RfqQuoteStore | null = null;

/** The one store both RFQ routes share. */
export function getRfqQuoteStore(): RfqQuoteStore {
  if (!sharedStore) sharedStore = createDefaultRfqQuoteStore();
  return sharedStore;
}

/** Swaps the shared store (tests, or a WordPress-backed implementation later). */
export function setRfqQuoteStoreForTesting(store: RfqQuoteStore | null): void {
  sharedStore = store;
}

/**
 * Test helpers live here rather than in the route files on purpose: a Next.js
 * route module may only export its HTTP handlers, and any extra export fails the
 * generated route type check during `next build`.
 */
export async function clearRfqStoresForTesting(): Promise<void> {
  await getRfqQuoteStore().clear();
}

export async function getQuoteForTesting(id: string): Promise<RfqQuote | undefined> {
  return getRfqQuoteStore().getQuote(id);
}

export async function setOfferQuoteForTesting(quote: RfqQuote): Promise<void> {
  await getRfqQuoteStore().putQuote(quote);
}

export async function clearOfferQuotesForTesting(): Promise<void> {
  await getRfqQuoteStore().clear();
}

export async function getOfferQuoteForTesting(id: string): Promise<RfqQuote | undefined> {
  return getRfqQuoteStore().getQuote(id);
}
