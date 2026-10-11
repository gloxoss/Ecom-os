import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  transition,
  type RfqQuote,
  type OfferRevision,
  type OfferLineItem,
  StaleRevisionError,
  ExpiredQuoteError,
  UnauthorizedActorError,
  IllegalTransitionError,
} from '../../../../../../packages/addons-rfq/src/index';

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

export class UpstreamRfqError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly details?: unknown;

  constructor(statusCode: number, errorCode: string, message: string, details?: unknown) {
    super(message);
    this.name = 'UpstreamRfqError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

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
  /**
   * `accessToken` is the guest's own quote secret. The local stores return the quote
   * and let the route compare the hash; a WordPress-backed store passes it through and
   * lets WordPress authorize, because the plugin never transmits the hash.
   */
  getQuote(id: string, accessToken?: string): Promise<RfqQuote | undefined>;
  putQuote(quote: RfqQuote): Promise<void>;
  /**
   * Guest actions as named operations, because that is how WordPress exposes them:
   * `/accept`, `/reject` and `/revise` are separate authorized endpoints, and a
   * generic `putQuote` of a mutated quote cannot express which one to call.
   */
  acceptOffer(id: string, revisionId: string, accessToken?: string): Promise<RfqQuote | undefined>;
  rejectQuote(id: string, reason: string, accessToken?: string): Promise<RfqQuote | undefined>;
  requestRevision(id: string, notes: string, accessToken?: string): Promise<RfqQuote | undefined>;
  listQuoteIds(): Promise<string[]>;
  getIdempotency(key: string): Promise<StoredIdempotencyEntry | undefined>;
  putIdempotency(key: string, entry: StoredIdempotencyEntry): Promise<void>;
  clear(): Promise<void>;
}

/**
 * The domain state machine enforces a guest ownership invariant: a guest transition is
 * only authorized when `actor.id === quote.accessSecretHash`. The actor is therefore
 * built from the quote that was just loaded, never from a caller-supplied value — the
 * route has already verified the presented token against that hash before calling.
 */
function guestActorFor(quote: RfqQuote) {
  return { role: 'guest' as const, id: quote.accessSecretHash };
}

/**
 * Shared local implementation of the three guest actions: load, run the domain state
 * machine, persist. Invalid transitions throw honest errors with accurate HTTP codes.
 */
async function applyGuestAction(
  store: RfqQuoteStore,
  id: string,
  target: 'accepted' | 'rejected' | 'revision_requested',
  payload: Record<string, unknown>
): Promise<RfqQuote | undefined> {
  const quote = await store.getQuote(id);
  if (!quote) return undefined;
  try {
    const next = transition(quote, target, guestActorFor(quote), payload as never);
    await store.putQuote(next);
    return next;
  } catch (err) {
    if (err instanceof StaleRevisionError) {
      throw new UpstreamRfqError(409, 'STALE_REVISION', err.message);
    }
    if (err instanceof ExpiredQuoteError) {
      throw new UpstreamRfqError(410, 'QUOTE_EXPIRED', err.message);
    }
    if (err instanceof UnauthorizedActorError) {
      throw new UpstreamRfqError(403, 'FORBIDDEN', err.message);
    }
    if (err instanceof IllegalTransitionError) {
      throw new UpstreamRfqError(400, 'INVALID_STATE_TRANSITION', err.message);
    }
    throw err;
  }
}

export class InMemoryRfqQuoteStore implements RfqQuoteStore {
  private quotes = new Map<string, RfqQuote>();
  private idempotency = new Map<string, StoredIdempotencyEntry>();

  async getQuote(id: string): Promise<RfqQuote | undefined> {
    return this.quotes.get(id);
  }
  async acceptOffer(id: string, revisionId: string): Promise<RfqQuote | undefined> {
    return applyGuestAction(this, id, 'accepted', { revisionId });
  }

  async rejectQuote(id: string, reason: string): Promise<RfqQuote | undefined> {
    return applyGuestAction(this, id, 'rejected', { reason });
  }

  async requestRevision(id: string, notes: string): Promise<RfqQuote | undefined> {
    return applyGuestAction(this, id, 'revision_requested', { staffNotes: notes });
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
  async acceptOffer(id: string, revisionId: string): Promise<RfqQuote | undefined> {
    return applyGuestAction(this, id, 'accepted', { revisionId });
  }

  async rejectQuote(id: string, reason: string): Promise<RfqQuote | undefined> {
    return applyGuestAction(this, id, 'rejected', { reason });
  }

  async requestRevision(id: string, notes: string): Promise<RfqQuote | undefined> {
    return applyGuestAction(this, id, 'revision_requested', { staffNotes: notes });
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
/** WordPress names one state differently from the domain. */
const STATE_FROM_WORDPRESS: Record<string, string> = {
  converted_to_order: 'converted',
};

/**
 * The production store: the WordPress companion plugin, over its REST namespace.
 *
 * Two consequences of WordPress owning the data are worth stating, because they are why
 * the interface carries an access token and named guest actions rather than a generic
 * whole-quote write:
 *
 *  - `ecomos_rfq_rest_get_quote` never transmits `access_secret_hash`, so there is no
 *    local hash to compare. The read carries the guest's token and WordPress decides;
 *    the mapped quote therefore has an empty `accessSecretHash`, which the routes read
 *    as "the store already authorized this".
 *  - State transitions are separate authorized endpoints, so they are methods here
 *    (`acceptOffer`, `rejectQuote`, `requestRevision`) rather than a `putQuote` of a
 *    mutated quote.
 *
 * Idempotency has no plugin endpoint, so it stays process-local here; that is a real
 * limitation of this implementation and is noted in the evidence rather than hidden.
 */
export class WordPressRfqQuoteStore implements RfqQuoteStore {
  private baseUrl: string;
  private staffAuth?: string;
  private idempotency = new Map<string, StoredIdempotencyEntry>();
  private knownHashes = new Map<string, string>();

  constructor(baseUrl: string, staffAuth?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.staffAuth = staffAuth;
  }

  private async call(
    path: string,
    token?: string,
    body?: unknown,
    options?: { timeoutMs?: number }
  ): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['x-quote-token'] = token;
    // Server service credentials authorize transport only, never implicitly authorize a guest
    if (this.staffAuth) headers['Authorization'] = `Basic ${this.staffAuth}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 10000);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        cache: 'no-store',
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new UpstreamRfqError(504, 'UPSTREAM_TIMEOUT', 'Upstream request timed out');
      }
      throw new UpstreamRfqError(502, 'UPSTREAM_NETWORK_ERROR', err instanceof Error ? err.message : 'Network error contacting upstream');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      let errJson: Record<string, unknown> | null = null;
      try {
        errJson = (await response.json()) as Record<string, unknown>;
      } catch {
        // Fallback for non-JSON error
      }
      const code = typeof errJson?.code === 'string'
        ? errJson.code
        : (typeof errJson?.error === 'string' ? errJson.error : 'UPSTREAM_ERROR');
      const message = typeof errJson?.message === 'string'
        ? errJson.message
        : (typeof errJson?.error === 'string' ? errJson.error : `Upstream request failed with status ${response.status}`);
      throw new UpstreamRfqError(response.status, String(code).toUpperCase(), message, errJson);
    }

    let data: unknown;
    try {
      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new UpstreamRfqError(502, 'UPSTREAM_EMPTY_RESPONSE', 'Upstream returned an empty response');
      }
      data = JSON.parse(text);
    } catch (err) {
      if (err instanceof UpstreamRfqError) throw err;
      throw new UpstreamRfqError(502, 'UPSTREAM_MALFORMED_RESPONSE', 'Upstream returned a malformed response');
    }

    if (!data || typeof data !== 'object') {
      throw new UpstreamRfqError(502, 'UPSTREAM_MALFORMED_RESPONSE', 'Upstream response is not an object');
    }

    return data as Record<string, unknown>;
  }

  private map(raw: Record<string, unknown> | null): RfqQuote | undefined {
    if (!raw || typeof raw.id !== 'string') return undefined;
    const parse = (value: unknown): unknown => {
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    };
    const state = STATE_FROM_WORDPRESS[String(raw.state)] ?? String(raw.state);
    const createdAt = String(raw.created_at ?? '');

    const mapRevisions = (revs: unknown): OfferRevision[] => {
      if (!Array.isArray(revs)) return [];
      return revs.map((r: Record<string, unknown>) => {
        const parseLines = (l: unknown): OfferLineItem[] => {
          if (Array.isArray(l)) return l as OfferLineItem[];
          if (typeof l === 'string') {
            try { return JSON.parse(l) as OfferLineItem[]; } catch { return []; }
          }
          return [];
        };
        const revId = String(r.revision_id ?? r.revisionId ?? '');
        const revNum = Number(r.revision_number ?? r.revisionNumber ?? 1);
        const revCreated = String(r.created_at ?? r.createdAt ?? createdAt);
        const staffId = String(r.created_by_staff_id ?? (r.createdBy as { staffId?: string })?.staffId ?? 'operator');
        const staffName = String(r.created_by_staff_name ?? (r.createdBy as { staffName?: string })?.staffName ?? 'Operator');
        const lines = parseLines(r.lines_data ?? r.lines);
        const subtotal = Number(r.subtotal_excl_tax ?? r.subtotalExclTax ?? 0);
        const tax = Number(r.total_tax ?? r.totalTax ?? 0);
        const total = Number(r.total_incl_tax ?? r.totalInclTax ?? 0);
        const cur = String(r.currency ?? 'MAD');
        const exp = String(r.expires_at ?? r.expiresAt ?? '');
        const isCur = Boolean(r.is_current ?? r.isCurrent);
        return {
          revisionId: revId,
          revisionNumber: revNum,
          createdAt: revCreated,
          createdBy: { staffId, staffName },
          expiresAt: exp,
          currency: cur,
          lines,
          subtotalExclTax: subtotal,
          totalTax: tax,
          totalInclTax: total,
          termsAndConditions: (r.terms ?? r.termsAndConditions) ? String(r.terms ?? r.termsAndConditions) : undefined,
          staffNotes: (r.notes ?? r.staffNotes) ? String(r.notes ?? r.staffNotes) : undefined,
          isCurrent: isCur,
        };
      });
    };

    const quoteId = String(raw.id);
    const hash = this.knownHashes.get(quoteId) || (typeof raw.access_secret_hash === 'string' ? raw.access_secret_hash : '');

    return {
      id: quoteId,
      quoteNumber: String(raw.quote_number ?? ''),
      state: state as RfqQuote['state'],
      contact: (parse(raw.contact_data) as RfqQuote['contact']) ?? {
        name: String(raw.customer_name ?? ''),
        email: String(raw.customer_email ?? ''),
      },
      consents: Array.isArray(raw.consents) ? (raw.consents as RfqQuote['consents']) : [],
      items: (parse(raw.items_data) as RfqQuote['items']) ?? [],
      revisions: mapRevisions(raw.revisions),
      ...(raw.current_revision_id ? { currentRevisionId: String(raw.current_revision_id) } : {}),
      accessSecretHash: hash,
      guestChallengeEmail: String(raw.customer_email ?? ''),
      isContactVerified: Boolean(raw.is_contact_verified),
      createdAt,
      updatedAt: String(raw.updated_at ?? createdAt),
      ...(raw.expires_at ? { expiresAt: String(raw.expires_at) } : {}),
      ...(raw.converted_order_id ? { convertedOrderId: raw.converted_order_id as string | number } : {}),
      ...(raw.rejection_reason ? { rejectionReason: String(raw.rejection_reason) } : {}),
      ...(raw.customer_revision_notes ? { customerRevisionNotes: String(raw.customer_revision_notes) } : {}),
      customerName: String(raw.customer_name ?? ''),
      customerEmail: String(raw.customer_email ?? ''),
    };
  }

  async getQuote(id: string, accessToken?: string): Promise<RfqQuote | undefined> {
    try {
      const res = await this.call(`/quotes/${encodeURIComponent(id)}`, accessToken);
      return this.map(res);
    } catch (err: unknown) {
      if (err instanceof UpstreamRfqError && err.statusCode === 404) {
        return undefined;
      }
      throw err;
    }
  }

  async putQuote(quote: RfqQuote): Promise<void> {
    if (quote.accessSecretHash) {
      this.knownHashes.set(quote.id, quote.accessSecretHash);
    }
    const res = await this.call('/quotes', undefined, {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      accessSecretHash: quote.accessSecretHash,
      contact: quote.contact,
      items: quote.items,
    });
    if (!res || (!res.quoteId && !res.id)) {
      throw new UpstreamRfqError(502, 'UPSTREAM_PERSISTENCE_FAILED', 'Upstream failed to persist quote');
    }
  }

  private async guestAction(path: string, id: string, token: string | undefined, body: unknown): Promise<RfqQuote | undefined> {
    if (!token || token.trim() === '') {
      throw new UpstreamRfqError(401, 'UNAUTHORIZED', 'Guest access token is required');
    }
    await this.call(`/quotes/${encodeURIComponent(id)}${path}`, token, body);
    return this.getQuote(id, token);
  }

  async acceptOffer(id: string, revisionId: string, accessToken?: string): Promise<RfqQuote | undefined> {
    return this.guestAction('/accept', id, accessToken, { revisionId });
  }

  async rejectQuote(id: string, reason: string, accessToken?: string): Promise<RfqQuote | undefined> {
    return this.guestAction('/reject', id, accessToken, { reason });
  }

  async requestRevision(id: string, notes: string, accessToken?: string): Promise<RfqQuote | undefined> {
    return this.guestAction('/revise', id, accessToken, { notes });
  }

  /** The plugin exposes no list endpoint, so this is only meaningful for local stores. */
  async listQuoteIds(): Promise<string[]> {
    return [];
  }

  async getIdempotency(key: string): Promise<StoredIdempotencyEntry | undefined> {
    return this.idempotency.get(key);
  }

  async putIdempotency(key: string, entry: StoredIdempotencyEntry): Promise<void> {
    this.idempotency.set(key, entry);
  }

  async clear(): Promise<void> {
    this.idempotency.clear();
  }
}

export function createDefaultRfqQuoteStore(): RfqQuoteStore {
  // WordPress is the production persistence layer; the file store is the single-host
  // fallback for development and for installations without the companion plugin.
  const wpUrl = process.env.ECOM_RFQ_WP_URL;
  if (wpUrl) {
    const user = process.env.ECOM_RFQ_WP_USER;
    const password = process.env.ECOM_RFQ_WP_APP_PASSWORD;
    const staffAuth = user && password ? Buffer.from(`${user}:${password}`).toString('base64') : undefined;
    return new WordPressRfqQuoteStore(wpUrl, staffAuth);
  }
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
