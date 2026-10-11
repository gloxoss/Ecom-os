import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
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
  | { ok: false; status: 'OWNER_MISMATCH'; error: string };

/**
 * Persistence for attempts. The manager is deliberately store-agnostic:
 * `InMemoryAttemptStore` is fine for a single process, but a deployment that
 * restarts or runs more than one worker needs `JsonFileAttemptStore` (single
 * host) or a shared store, otherwise a retry can duplicate an order.
 */
export interface AttemptStore {
  get(key: string): Promise<CheckoutAttempt | undefined>;
  set(key: string, attempt: CheckoutAttempt): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export class InMemoryAttemptStore implements AttemptStore {
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
}

/**
 * File-backed store for a single host. Writes are atomic (temp file + rename)
 * so a crash mid-write cannot leave a half-written attempt that would make a
 * retry look new. It is not a distributed lock: multiple hosts still need a
 * shared store.
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

export function createDefaultAttemptStore(): AttemptStore {
  const filePath = process.env.ECOM_ATTEMPT_STORE_PATH;
  return filePath ? new JsonFileAttemptStore(filePath) : new InMemoryAttemptStore();
}

export class CheckoutAttemptManager {
  private store: AttemptStore;
  private maxAgeMs: number;
  private operation: string;

  constructor(
    maxAgeMs = 1000 * 60 * 60,
    store: AttemptStore = new InMemoryAttemptStore(),
    operation = 'checkout'
  ) {
    this.maxAgeMs = maxAgeMs;
    this.store = store;
    this.operation = operation;
  }

  private storageKey(attemptKey: string): string {
    return `${this.operation}\u0000${attemptKey}`;
  }

  private async sweepExpired(): Promise<void> {
    const now = Date.now();
    for (const key of await this.store.keys()) {
      const attempt = await this.store.get(key);
      if (attempt && now - attempt.updatedAt > this.maxAgeMs) {
        await this.store.delete(key);
      }
    }
  }

  async startAttempt(attemptKey: string, ownerKey: string): Promise<StartAttemptResult> {
    await this.sweepExpired();
    const key = this.storageKey(attemptKey);
    const existing = await this.store.get(key);

    if (existing) {
      // A key bound to a different owner is never served, and never adopted.
      // Fail closed instead of handing over another guest's order or starting a
      // fresh attempt that could shadow theirs.
      if (existing.ownerKey !== ownerKey) {
        return {
          ok: false,
          status: 'OWNER_MISMATCH',
          error: 'This submission key belongs to a different session.',
        };
      }

      if (existing.status === 'CONFIRMED') {
        return {
          ok: true,
          isNew: false,
          status: 'CONFIRMED',
          orderId: existing.orderId!,
          ...(existing.orderKey ? { orderKey: existing.orderKey } : {}),
          ...(existing.email ? { email: existing.email } : {}),
        };
      }

      if (existing.status === 'PENDING') {
        return {
          ok: false,
          status: 'PENDING',
          error: 'A checkout attempt for this submission is currently processing.',
        };
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
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    await this.store.set(key, confirmed);
    return confirmed;
  }

  async failAttempt(attemptKey: string, error: string, ownerKey?: string): Promise<CheckoutAttempt> {
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
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    await this.store.set(key, failed);
    return failed;
  }

  async getAttempt(attemptKey: string): Promise<CheckoutAttempt | undefined> {
    return this.store.get(this.storageKey(attemptKey));
  }

  async clear(): Promise<void> {
    for (const key of await this.store.keys()) await this.store.delete(key);
  }
}

export const globalAttemptManager = new CheckoutAttemptManager(
  1000 * 60 * 60,
  createDefaultAttemptStore()
);
