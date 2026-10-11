import { linkSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type AttemptStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface CheckoutAttempt {
  attemptKey: string;
  /** Operation this attempt belongs to, so checkout and RFQ keys never collide. */
  operation: string;
  /**
   * Who owns this attempt: the guest's cart/session token. A different owner
   * presenting the same attempt key must never see this record.
   */
  ownerKey: string;
  status: AttemptStatus;
  orderId?: string | number;
  orderKey?: string;
  /** Contact captured when the attempt first started; reused on replay. */
  email?: string;
  /**
   * Fingerprint of the order details bound at first submission. A retry that
   * presents the same key and owner but different details is refused instead
   * of confirming or duplicating an order for the wrong payload.
   */
  payloadHash?: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

export type StartAttemptResult =
  | { ok: true; isNew: true }
  | {
      ok: true;
      isNew: false;
      status: 'CONFIRMED';
      orderId: string | number;
      orderKey?: string;
      email?: string;
    }
  | { ok: false; status: 'PENDING'; error: string }
  | { ok: false; status: 'OWNER_MISMATCH'; error: string }
  | { ok: false; status: 'PAYLOAD_MISMATCH'; error: string };

export const BUSY_ATTEMPT_ERROR = 'A checkout attempt for this submission is currently processing.';

/**
 * Raised when an attempt record exists but cannot be parsed. The record is
 * never deleted or reset: an unreadable store fails closed so a retry can
 * neither confirm an unknown order nor authorize a duplicate.
 */
export class CorruptAttemptStoreError extends Error {
  readonly storageKey: string;
  readonly location: string;

  constructor(storageKey: string, location: string) {
    super(
      `Checkout attempt storage at ${location} is unreadable; refusing to proceed rather than risk a duplicate order.`
    );
    this.name = 'CorruptAttemptStoreError';
    this.storageKey = storageKey;
    this.location = location;
  }
}

/**
 * Persistence for attempts. Plain `AttemptStore` implementations are only
 * safe for a single process (see `JsonFileAttemptStore`). Multi-process and
 * restart-safe deployments must use a `ClaimAttemptStore`, whose claim
 * operations are atomic: exactly one OS process can win a pending claim, and
 * confirmations can never be silently overwritten.
 */
export interface AttemptStore {
  get(key: string): Promise<CheckoutAttempt | undefined>;
  set(key: string, attempt: CheckoutAttempt): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export type ClaimOutcome = 'claimed' | 'exists';

export interface ClaimAttemptStore extends AttemptStore {
  /** Durably read the authoritative record; throws CorruptAttemptStoreError when unreadable. */
  readState(key: string): Promise<CheckoutAttempt | undefined>;
  /** Atomically create a pending claim. Returns 'exists' without changing anything when any record is present. */
  claimPending(key: string, attempt: CheckoutAttempt): Promise<ClaimOutcome>;
  /**
   * Atomically record a confirmation. Idempotent when the same order is
   * confirmed twice; throws on a conflicting order, on a failed record, or
   * when no pending claim exists. Never downgrades or overwrites.
   */
  confirmPending(key: string, confirmed: CheckoutAttempt): Promise<CheckoutAttempt>;
  /** Atomically record a failure from a pending claim. Throws when already confirmed. */
  failPending(key: string, failed: CheckoutAttempt): Promise<CheckoutAttempt>;
  /** Atomically revive a failed claim into a confirmed order (response-loss recovery). */
  reviveToConfirmed(key: string, confirmed: CheckoutAttempt): Promise<CheckoutAttempt>;
  /** Atomically replace a failed claim with a fresh pending claim for retry. */
  retryFromFailed(key: string, pending: CheckoutAttempt): Promise<ClaimOutcome>;
}

function assertStatus(attempt: CheckoutAttempt, status: AttemptStatus, what: string): void {
  if (attempt.status !== status) {
    throw new Error(`Cannot ${what}: attempt record has status ${attempt.status}.`);
  }
}

function assertIdentity(attemptKey: string, ownerKey: string): void {
  if (!attemptKey || attemptKey.length > 200) {
    throw new Error('Invalid checkout attempt key.');
  }
  if (!ownerKey || ownerKey.length > 300) {
    throw new Error('Invalid checkout attempt owner.');
  }
}

export class InMemoryAttemptStore implements ClaimAttemptStore {
  private records = new Map<string, CheckoutAttempt>();

  async get(key: string): Promise<CheckoutAttempt | undefined> {
    return this.records.get(key);
  }

  async set(key: string, attempt: CheckoutAttempt): Promise<void> {
    this.records.set(key, attempt);
  }

  async delete(key: string): Promise<void> {
    this.records.delete(key);
  }

  async keys(): Promise<string[]> {
    return [...this.records.keys()];
  }

  async readState(key: string): Promise<CheckoutAttempt | undefined> {
    return this.records.get(key);
  }

  // The bodies below run synchronously between awaits, which is atomic on a
  // single Node.js event loop. Cross-process safety needs FileClaimAttemptStore.
  async claimPending(key: string, attempt: CheckoutAttempt): Promise<ClaimOutcome> {
    assertStatus(attempt, 'PENDING', 'claim a pending attempt');
    if (this.records.has(key)) return 'exists';
    this.records.set(key, attempt);
    return 'claimed';
  }

  async confirmPending(key: string, confirmed: CheckoutAttempt): Promise<CheckoutAttempt> {
    assertStatus(confirmed, 'CONFIRMED', 'confirm an attempt');
    const existing = this.records.get(key);
    if (!existing) throw new Error('Cannot confirm a checkout attempt with no pending claim.');
    if (existing.ownerKey !== confirmed.ownerKey) {
      throw new Error('Refusing to confirm a checkout attempt owned by a different session.');
    }
    if (existing.status === 'CONFIRMED') {
      if (existing.orderId === confirmed.orderId) return existing;
      throw new Error('Refusing to overwrite a confirmed checkout attempt with a different order.');
    }
    if (existing.status !== 'PENDING') {
      throw new Error('Cannot confirm a checkout attempt that already failed; reconcile it first.');
    }
    this.records.set(key, confirmed);
    return confirmed;
  }

  async failPending(key: string, failed: CheckoutAttempt): Promise<CheckoutAttempt> {
    assertStatus(failed, 'FAILED', 'fail an attempt');
    const existing = this.records.get(key);
    if (!existing) throw new Error('Cannot fail a checkout attempt with no pending claim.');
    if (existing.ownerKey !== failed.ownerKey) {
      throw new Error('Refusing to fail a checkout attempt owned by a different session.');
    }
    if (existing.status === 'CONFIRMED') {
      throw new Error('Refusing to overwrite a confirmed checkout attempt with a failure.');
    }
    if (existing.status === 'FAILED') return existing;
    this.records.set(key, failed);
    return failed;
  }

  async reviveToConfirmed(key: string, confirmed: CheckoutAttempt): Promise<CheckoutAttempt> {
    assertStatus(confirmed, 'CONFIRMED', 'revive an attempt');
    const existing = this.records.get(key);
    if (!existing) throw new Error('Cannot revive a checkout attempt with no record.');
    if (existing.ownerKey !== confirmed.ownerKey) {
      throw new Error('Refusing to revive a checkout attempt owned by a different session.');
    }
    if (existing.status === 'CONFIRMED') {
      if (existing.orderId === confirmed.orderId) return existing;
      throw new Error('Refusing to overwrite a confirmed checkout attempt with a different order.');
    }
    this.records.set(key, confirmed);
    return confirmed;
  }

  async retryFromFailed(key: string, pending: CheckoutAttempt): Promise<ClaimOutcome> {
    assertStatus(pending, 'PENDING', 'retry an attempt');
    const existing = this.records.get(key);
    if (!existing || existing.status !== 'FAILED') return 'exists';
    if (existing.ownerKey !== pending.ownerKey) {
      throw new Error('Refusing to retry a checkout attempt owned by a different session.');
    }
    this.records.set(key, pending);
    return 'claimed';
  }
}

/**
 * Single-process development store. Whole-file read-modify-write plus an
 * in-memory cache mean two OS processes (or a restart that loses the cache
 * while another writer holds the file) can both believe they won a claim and
 * duplicate an order. Never use it where more than one process submits
 * checkout attempts; use FileClaimAttemptStore instead.
 */
export class JsonFileAttemptStore implements AttemptStore {
  private filePath: string;
  private loaded = false;
  private records = new Map<string, CheckoutAttempt>();

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private load(): void {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const raw = readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, CheckoutAttempt>;
      if (parsed && typeof parsed === 'object') {
        for (const [key, value] of Object.entries(parsed)) this.records.set(key, value);
      }
    } catch {
      // Absent or unreadable store: start empty rather than failing checkout.
    }
  }

  private persist(): void {
    const dir = path.dirname(this.filePath);
    mkdirSync(dir, { recursive: true });
    const payload = JSON.stringify(Object.fromEntries(this.records), null, 2);
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    writeFileSync(tmp, payload, 'utf8');
    renameSync(tmp, this.filePath);
  }

  async get(key: string): Promise<CheckoutAttempt | undefined> {
    this.load();
    return this.records.get(key);
  }

  async set(key: string, attempt: CheckoutAttempt): Promise<void> {
    this.load();
    this.records.set(key, attempt);
    this.persist();
  }

  async delete(key: string): Promise<void> {
    this.load();
    if (this.records.delete(key)) this.persist();
  }

  async keys(): Promise<string[]> {
    this.load();
    return [...this.records.keys()];
  }
}

const PENDING_SUFFIX = '.pending.json';
const CONFIRMED_SUFFIX = '.confirmed.json';
const FAILED_SUFFIX = '.failed.json';

function encodeStorageKey(key: string): string {
  return Buffer.from(key, 'utf8').toString('base64url');
}

function decodeStorageKey(file: string): string | null {
  for (const suffix of [PENDING_SUFFIX, CONFIRMED_SUFFIX, FAILED_SUFFIX]) {
    if (file.endsWith(suffix)) {
      try {
        return Buffer.from(file.slice(0, -suffix.length), 'base64url').toString('utf8');
      } catch {
        return null;
      }
    }
  }
  return null;
}

function uniqueTmpName(dir: string): string {
  return path.join(dir, `.tmp.${process.pid}.${Date.now()}.${Math.floor(Math.random() * 1e9)}`);
}

/**
 * Durable, cross-process attempt storage for a single host. Each attempt state
 * is its own file and every transition is an atomic filesystem operation:
 * claims use exclusive hard-link creation so exactly one OS process wins, and
 * confirmations are never overwritten. State precedence is
 * confirmed > failed > pending, so a crash between creating the new state
 * file and removing the old one always resolves to the further-progressed
 * outcome. Corrupt files fail closed and are never deleted or reset.
 */
export class FileClaimAttemptStore implements ClaimAttemptStore {
  readonly dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  private fileFor(key: string, suffix: string): string {
    if (!key) throw new Error('Invalid checkout attempt storage key.');
    return path.join(this.dir, `${encodeStorageKey(key)}${suffix}`);
  }

  private parseFile(file: string, key: string): CheckoutAttempt {
    let raw: string;
    try {
      raw = readFileSync(file, 'utf8');
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
        throw new Error(`Checkout attempt record disappeared for ${key}.`);
      }
      throw err;
    }
    try {
      const parsed = JSON.parse(raw) as CheckoutAttempt;
      if (!parsed || typeof parsed !== 'object' || typeof parsed.attemptKey !== 'string') {
        throw new Error('not an attempt record');
      }
      return parsed;
    } catch (err: unknown) {
      if (err instanceof CorruptAttemptStoreError) throw err;
      throw new CorruptAttemptStoreError(key, file);
    }
  }

  /** Atomically publish content: fully written temp file, then one atomic link. */
  private publish(target: string, attempt: CheckoutAttempt): ClaimOutcome {
    const tmp = uniqueTmpName(this.dir);
    try {
      writeFileSync(tmp, JSON.stringify(attempt), 'utf8');
      try {
        linkSync(tmp, target);
        return 'claimed';
      } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException)?.code === 'EEXIST') return 'exists';
        throw err;
      }
    } finally {
      try {
        unlinkSync(tmp);
      } catch {
        // Best effort; stray tmp files never influence reads.
      }
    }
  }

  private forget(file: string): void {
    try {
      unlinkSync(file);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err;
    }
  }

  async readState(key: string): Promise<CheckoutAttempt | undefined> {
    const confirmed = this.fileFor(key, CONFIRMED_SUFFIX);
    const failed = this.fileFor(key, FAILED_SUFFIX);
    const pending = this.fileFor(key, PENDING_SUFFIX);
    try {
      const record = this.parseFile(confirmed, key);
      this.forget(failed);
      this.forget(pending);
      return record;
    } catch (err: unknown) {
      if (err instanceof CorruptAttemptStoreError) throw err;
      // ENOENT falls through to the next state.
    }
    try {
      const record = this.parseFile(failed, key);
      this.forget(pending);
      return record;
    } catch (err: unknown) {
      if (err instanceof CorruptAttemptStoreError) throw err;
    }
    try {
      return this.parseFile(pending, key);
    } catch (err: unknown) {
      if (err instanceof CorruptAttemptStoreError) throw err;
      return undefined;
    }
  }

  async claimPending(key: string, attempt: CheckoutAttempt): Promise<ClaimOutcome> {
    assertStatus(attempt, 'PENDING', 'claim a pending attempt');
    if (!attempt.ownerKey) throw new Error('Cannot claim a checkout attempt without an owner.');
    mkdirSync(this.dir, { recursive: true });
    const existing = await this.readState(key);
    if (existing) return 'exists';
    return this.publish(this.fileFor(key, PENDING_SUFFIX), attempt);
  }

  async confirmPending(key: string, confirmed: CheckoutAttempt): Promise<CheckoutAttempt> {
    assertStatus(confirmed, 'CONFIRMED', 'confirm an attempt');
    mkdirSync(this.dir, { recursive: true });
    const existing = await this.readState(key);
    if (!existing) throw new Error('Cannot confirm a checkout attempt with no pending claim.');
    if (existing.ownerKey !== confirmed.ownerKey) {
      throw new Error('Refusing to confirm a checkout attempt owned by a different session.');
    }
    if (existing.status === 'CONFIRMED') {
      if (existing.orderId === confirmed.orderId) return existing;
      throw new Error('Refusing to overwrite a confirmed checkout attempt with a different order.');
    }
    if (existing.status !== 'PENDING') {
      throw new Error('Cannot confirm a checkout attempt that already failed; reconcile it first.');
    }
    if (this.publish(this.fileFor(key, CONFIRMED_SUFFIX), confirmed) === 'exists') {
      const raced = await this.readState(key);
      if (raced?.status === 'CONFIRMED' && raced.orderId === confirmed.orderId) return raced;
      throw new Error('Refusing to overwrite a concurrently confirmed checkout attempt.');
    }
    this.forget(this.fileFor(key, PENDING_SUFFIX));
    return confirmed;
  }

  async failPending(key: string, failed: CheckoutAttempt): Promise<CheckoutAttempt> {
    assertStatus(failed, 'FAILED', 'fail an attempt');
    mkdirSync(this.dir, { recursive: true });
    const existing = await this.readState(key);
    if (!existing) throw new Error('Cannot fail a checkout attempt with no pending claim.');
    if (existing.ownerKey !== failed.ownerKey) {
      throw new Error('Refusing to fail a checkout attempt owned by a different session.');
    }
    if (existing.status === 'CONFIRMED') {
      throw new Error('Refusing to overwrite a confirmed checkout attempt with a failure.');
    }
    if (existing.status === 'FAILED') return existing;
    if (this.publish(this.fileFor(key, FAILED_SUFFIX), failed) === 'exists') {
      const raced = await this.readState(key);
      if (raced) return raced;
      throw new Error('Checkout attempt record disappeared while recording failure.');
    }
    this.forget(this.fileFor(key, PENDING_SUFFIX));
    return failed;
  }

  async reviveToConfirmed(key: string, confirmed: CheckoutAttempt): Promise<CheckoutAttempt> {
    assertStatus(confirmed, 'CONFIRMED', 'revive an attempt');
    mkdirSync(this.dir, { recursive: true });
    const existing = await this.readState(key);
    if (!existing) throw new Error('Cannot revive a checkout attempt with no record.');
    if (existing.ownerKey !== confirmed.ownerKey) {
      throw new Error('Refusing to revive a checkout attempt owned by a different session.');
    }
    if (existing.status === 'CONFIRMED') {
      if (existing.orderId === confirmed.orderId) return existing;
      throw new Error('Refusing to overwrite a confirmed checkout attempt with a different order.');
    }
    if (this.publish(this.fileFor(key, CONFIRMED_SUFFIX), confirmed) === 'exists') {
      const raced = await this.readState(key);
      if (raced?.status === 'CONFIRMED' && raced.orderId === confirmed.orderId) return raced;
      throw new Error('Refusing to overwrite a concurrently confirmed checkout attempt.');
    }
    this.forget(this.fileFor(key, PENDING_SUFFIX));
    this.forget(this.fileFor(key, FAILED_SUFFIX));
    return confirmed;
  }

  async retryFromFailed(key: string, pending: CheckoutAttempt): Promise<ClaimOutcome> {
    assertStatus(pending, 'PENDING', 'retry an attempt');
    mkdirSync(this.dir, { recursive: true });
    const existing = await this.readState(key);
    if (!existing || existing.status !== 'FAILED') return 'exists';
    if (existing.ownerKey !== pending.ownerKey) {
      throw new Error('Refusing to retry a checkout attempt owned by a different session.');
    }
    this.forget(this.fileFor(key, FAILED_SUFFIX));
    return this.publish(this.fileFor(key, PENDING_SUFFIX), pending);
  }

  async get(key: string): Promise<CheckoutAttempt | undefined> {
    if (!path.resolve(this.dir)) throw new Error('Invalid attempt store directory.');
    try {
      return await this.readState(key);
    } catch (err: unknown) {
      if (err instanceof Error && (err as NodeJS.ErrnoException)?.code === 'ENOENT') return undefined;
      throw err;
    }
  }

  async set(key: string, attempt: CheckoutAttempt): Promise<void> {
    mkdirSync(this.dir, { recursive: true });
    const suffix =
      attempt.status === 'CONFIRMED' ? CONFIRMED_SUFFIX : attempt.status === 'FAILED' ? FAILED_SUFFIX : PENDING_SUFFIX;
    for (const other of [PENDING_SUFFIX, CONFIRMED_SUFFIX, FAILED_SUFFIX]) {
      if (other !== suffix) this.forget(this.fileFor(key, other));
    }
    const target = this.fileFor(key, suffix);
    const tmp = uniqueTmpName(this.dir);
    writeFileSync(tmp, JSON.stringify(attempt), 'utf8');
    renameSync(tmp, target);
  }

  async delete(key: string): Promise<void> {
    this.forget(this.fileFor(key, PENDING_SUFFIX));
    this.forget(this.fileFor(key, CONFIRMED_SUFFIX));
    this.forget(this.fileFor(key, FAILED_SUFFIX));
  }

  async keys(): Promise<string[]> {
    let entries: string[];
    try {
      entries = readdirSync(this.dir);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
      throw err;
    }
    const out = new Set<string>();
    for (const entry of entries) {
      const decoded = decodeStorageKey(entry);
      if (decoded) out.add(decoded);
    }
    return [...out];
  }
}

function isClaimStore(store: AttemptStore): store is ClaimAttemptStore {
  return typeof (store as ClaimAttemptStore).claimPending === 'function';
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  const text = JSON.stringify(value);
  return typeof text === 'string' ? text : 'null';
}

function fnv1aHex(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Fingerprint binding one purchase attempt to the exact order details it was
 * created with. Retries presenting the same key and owner but different
 * details are refused rather than confirming or duplicating an order.
 */
export function attemptPayloadHash(
  ownerKey: string,
  input: { billing_address?: unknown; shipping_address?: unknown; payment_method?: string }
): string {
  return fnv1aHex(
    stableStringify({
      owner: ownerKey,
      billing: input.billing_address ?? null,
      shipping: input.shipping_address ?? null,
      method: input.payment_method ?? 'cod',
    })
  );
}

export function defaultAttemptStoreDir(): string {
  return path.join(process.cwd(), '.ecomos', 'attempts');
}

export function createDefaultAttemptStore(): AttemptStore {
  const configured = process.env.ECOM_ATTEMPT_STORE_PATH;
  if (configured) {
    return configured.endsWith('.json') ? new JsonFileAttemptStore(configured) : new FileClaimAttemptStore(configured);
  }
  // Test runners stay hermetic: no filesystem writes outside the test's own
  // temporary directories. Production defaults to durable file claims.
  if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.VITEST_POOL_ID) {
    return new InMemoryAttemptStore();
  }
  return new FileClaimAttemptStore(defaultAttemptStoreDir());
}

const DEFAULT_CONFIRMED_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export class CheckoutAttemptManager {
  private store: AttemptStore;
  private maxAgeMs: number;
  private operation: string;
  private confirmedAgeMs: number;

  constructor(
    maxAgeMs = 1000 * 60 * 60,
    store: AttemptStore = new InMemoryAttemptStore(),
    operation = 'checkout',
    confirmedAgeMs = DEFAULT_CONFIRMED_AGE_MS
  ) {
    this.maxAgeMs = maxAgeMs;
    this.store = store;
    this.operation = operation;
    this.confirmedAgeMs = confirmedAgeMs;
  }

  private storageKey(attemptKey: string): string {
    return `${this.operation}\u0000${attemptKey}`;
  }

  /**
   * Sweep policy that can never authorize a duplicate: pending attempts have
   * an unknown outcome and are never swept; failed attempts become retryable
   * anyway; confirmed attempts are kept for a long replay window.
   */
  private async sweepExpired(): Promise<void> {
    const now = Date.now();
    let keys: string[];
    try {
      keys = await this.store.keys();
    } catch {
      return;
    }
    for (const key of keys) {
      let attempt: CheckoutAttempt | undefined;
      try {
        attempt = await this.store.get(key);
      } catch {
        continue;
      }
      if (!attempt || attempt.status === 'PENDING') continue;
      try {
        if (attempt.status === 'FAILED' && now - attempt.updatedAt > this.maxAgeMs) {
          await this.store.delete(key);
        } else if (attempt.status === 'CONFIRMED' && now - attempt.updatedAt > this.confirmedAgeMs) {
          await this.store.delete(key);
        }
      } catch {
        // Best effort; a leftover record fails safe on next access.
      }
    }
  }

  private payloadRefusal(
    existing: CheckoutAttempt,
    payloadHash?: string
  ): Extract<StartAttemptResult, { ok: false }> | null {
    if (existing.payloadHash && payloadHash && existing.payloadHash !== payloadHash) {
      return {
        ok: false,
        status: 'PAYLOAD_MISMATCH',
        error: 'This submission key was already used with different order details.',
      };
    }
    return null;
  }

  private replay(existing: CheckoutAttempt): StartAttemptResult {
    return {
      ok: true,
      isNew: false,
      status: 'CONFIRMED',
      orderId: existing.orderId!,
      ...(existing.orderKey ? { orderKey: existing.orderKey } : {}),
      ...(existing.email ? { email: existing.email } : {}),
    };
  }

  async startAttempt(attemptKey: string, ownerKey: string, payloadHash?: string): Promise<StartAttemptResult> {
    assertIdentity(attemptKey, ownerKey);
    await this.sweepExpired();
    const key = this.storageKey(attemptKey);
    const claim = this.store;
    if (!isClaimStore(claim)) {
      return this.legacyStartAttempt(key, attemptKey, ownerKey, payloadHash);
    }

    const now = Date.now();
    const fresh: CheckoutAttempt = {
      attemptKey,
      operation: this.operation,
      ownerKey,
      status: 'PENDING',
      ...(payloadHash ? { payloadHash } : {}),
      createdAt: now,
      updatedAt: now,
    };
    if ((await claim.claimPending(key, fresh)) === 'claimed') {
      return { ok: true, isNew: true };
    }
    // Lost the atomic claim race: read the winner. Unreadable storage fails
    // closed via CorruptAttemptStoreError rather than authorizing a duplicate.
    const existing = await claim.readState(key);
    if (!existing) {
      return (await claim.claimPending(key, fresh)) === 'claimed'
        ? { ok: true, isNew: true }
        : { ok: false, status: 'PENDING', error: BUSY_ATTEMPT_ERROR };
    }
    // A key bound to a different owner is never served, and never adopted.
    if (existing.ownerKey !== ownerKey) {
      return {
        ok: false,
        status: 'OWNER_MISMATCH',
        error: 'This submission key belongs to a different session.',
      };
    }
    const payload = this.payloadRefusal(existing, payloadHash);
    if (payload) return payload;
    if (existing.status === 'CONFIRMED') return this.replay(existing);
    if (existing.status === 'PENDING') {
      return { ok: false, status: 'PENDING', error: BUSY_ATTEMPT_ERROR };
    }
    // FAILED attempts are eligible for retry; the atomic replace guarantees a
    // concurrent retry cannot mint a second pending claim.
    const retry: CheckoutAttempt = {
      attemptKey,
      operation: existing.operation,
      ownerKey,
      status: 'PENDING',
      ...(existing.email ? { email: existing.email } : {}),
      ...(payloadHash ?? existing.payloadHash ? { payloadHash: payloadHash ?? existing.payloadHash! } : {}),
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };
    return (await claim.retryFromFailed(key, retry)) === 'claimed'
      ? { ok: true, isNew: true }
      : { ok: false, status: 'PENDING', error: BUSY_ATTEMPT_ERROR };
  }

  private async legacyStartAttempt(
    key: string,
    attemptKey: string,
    ownerKey: string,
    payloadHash?: string
  ): Promise<StartAttemptResult> {
    const existing = await this.store.get(key);
    if (existing) {
      if (existing.ownerKey !== ownerKey) {
        return {
          ok: false,
          status: 'OWNER_MISMATCH',
          error: 'This submission key belongs to a different session.',
        };
      }
      const payload = this.payloadRefusal(existing, payloadHash);
      if (payload) return payload;
      if (existing.status === 'CONFIRMED') return this.replay(existing);
      if (existing.status === 'PENDING') {
        return { ok: false, status: 'PENDING', error: BUSY_ATTEMPT_ERROR };
      }
      // FAILED attempts are eligible for retry
    }

    const now = Date.now();
    await this.store.set(key, {
      attemptKey,
      operation: this.operation,
      ownerKey,
      status: 'PENDING',
      ...(existing?.email ? { email: existing.email } : {}),
      ...(payloadHash ?? existing?.payloadHash ? { payloadHash: payloadHash ?? existing?.payloadHash! } : {}),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    });

    return { ok: true, isNew: true };
  }

  async confirmAttempt(
    attemptKey: string,
    orderId: string | number,
    orderKey?: string,
    ownerKey?: string,
    email?: string
  ): Promise<CheckoutAttempt> {
    if (!attemptKey) throw new Error('Invalid checkout attempt key.');
    const key = this.storageKey(attemptKey);
    const existing = await this.store.get(key);

    if (ownerKey && existing && existing.ownerKey !== ownerKey) {
      throw new Error('Refusing to confirm a checkout attempt owned by a different session.');
    }

    const now = Date.now();
    const contactEmail = email ?? existing?.email;
    const confirmed: CheckoutAttempt = {
      attemptKey,
      operation: existing?.operation ?? this.operation,
      ownerKey: ownerKey ?? existing?.ownerKey ?? '',
      status: 'CONFIRMED',
      orderId,
      ...(orderKey ? { orderKey } : {}),
      ...(contactEmail ? { email: contactEmail } : {}),
      ...(existing?.payloadHash ? { payloadHash: existing.payloadHash } : {}),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    const claim = this.store;
    if (isClaimStore(claim)) return claim.confirmPending(key, confirmed);
    await this.store.set(key, confirmed);
    return confirmed;
  }

  async failAttempt(attemptKey: string, error: string, ownerKey?: string): Promise<CheckoutAttempt> {
    if (!attemptKey) throw new Error('Invalid checkout attempt key.');
    const key = this.storageKey(attemptKey);
    const existing = await this.store.get(key);

    if (ownerKey && existing && existing.ownerKey !== ownerKey) {
      throw new Error('Refusing to fail a checkout attempt owned by a different session.');
    }

    const now = Date.now();
    const failed: CheckoutAttempt = {
      attemptKey,
      operation: existing?.operation ?? this.operation,
      ownerKey: ownerKey ?? existing?.ownerKey ?? '',
      status: 'FAILED',
      error,
      ...(existing?.email ? { email: existing.email } : {}),
      ...(existing?.payloadHash ? { payloadHash: existing.payloadHash } : {}),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    const claim = this.store;
    if (isClaimStore(claim)) return claim.failPending(key, failed);
    await this.store.set(key, failed);
    return failed;
  }

  /**
   * Reconcile a response-loss: WooCommerce already owns an order for this
   * attempt but success was never recorded. Revives the record to the
   * authoritative order instead of allowing a retry to duplicate it.
   */
  async reconcileFound(
    attemptKey: string,
    ownerKey: string,
    orderId: string | number,
    orderKey?: string,
    email?: string
  ): Promise<CheckoutAttempt> {
    assertIdentity(attemptKey, ownerKey);
    const key = this.storageKey(attemptKey);
    const claim = this.store;
    const now = Date.now();
    if (isClaimStore(claim)) {
      const existing = await claim.readState(key);
      if (!existing) throw new Error('Cannot reconcile a checkout attempt with no record.');
      if (existing.ownerKey !== ownerKey) {
        throw new Error('Refusing to reconcile a checkout attempt owned by a different session.');
      }
      const contactEmail = email ?? existing.email;
      return claim.reviveToConfirmed(key, {
        attemptKey,
        operation: existing.operation,
        ownerKey,
        status: 'CONFIRMED',
        orderId,
        ...(orderKey ?? existing.orderKey ? { orderKey: orderKey ?? existing.orderKey! } : {}),
        ...(contactEmail ? { email: contactEmail } : {}),
        ...(existing.payloadHash ? { payloadHash: existing.payloadHash } : {}),
        createdAt: existing.createdAt,
        updatedAt: now,
      });
    }
    return this.confirmAttempt(attemptKey, orderId, orderKey, ownerKey, email);
  }

  /**
   * Mark a stuck pending attempt as failed so the same key may retry exactly
   * once more. Only used after an order-correlation lookup proves WooCommerce
   * owns no order for the attempt. Refuses to downgrade confirmations.
   */
  async markFailedRetryable(attemptKey: string, ownerKey: string, error: string): Promise<CheckoutAttempt> {
    assertIdentity(attemptKey, ownerKey);
    const key = this.storageKey(attemptKey);
    const existing = await this.store.get(key);
    if (!existing) throw new Error('Cannot mark a checkout attempt with no record as failed.');
    if (existing.ownerKey !== ownerKey) {
      throw new Error('Refusing to fail a checkout attempt owned by a different session.');
    }
    if (existing.status === 'CONFIRMED') {
      throw new Error('Refusing to overwrite a confirmed checkout attempt with a failure.');
    }
    if (existing.status === 'FAILED') return existing;
    return this.failAttempt(attemptKey, error, ownerKey);
  }

  async getAttempt(attemptKey: string): Promise<CheckoutAttempt | undefined> {
    return this.store.get(this.storageKey(attemptKey));
  }

  async clear(): Promise<void> {
    for (const key of await this.store.keys()) await this.store.delete(key);
  }
}

export const globalAttemptManager = new CheckoutAttemptManager(1000 * 60 * 60, createDefaultAttemptStore());
