export type AttemptStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface CheckoutAttempt {
  attemptKey: string;
  cartToken: string;
  status: AttemptStatus;
  orderId?: string | number;
  orderKey?: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

export type StartAttemptResult =
  | { ok: true; isNew: true }
  | { ok: true; isNew: false; status: 'CONFIRMED'; orderId: string | number; orderKey?: string }
  | { ok: false; status: 'PENDING'; error: string };

export class CheckoutAttemptManager {
  private attempts = new Map<string, CheckoutAttempt>();
  private maxAgeMs: number;

  constructor(maxAgeMs = 1000 * 60 * 60) {
    this.maxAgeMs = maxAgeMs;
  }

  private sweepExpired(): void {
    const now = Date.now();
    for (const [key, attempt] of this.attempts.entries()) {
      if (now - attempt.updatedAt > this.maxAgeMs) {
        this.attempts.delete(key);
      }
    }
  }

  async startAttempt(attemptKey: string, cartToken: string): Promise<StartAttemptResult> {
    this.sweepExpired();
    const existing = this.attempts.get(attemptKey);

    if (existing) {
      if (existing.status === 'CONFIRMED') {
        return {
          ok: true,
          isNew: false,
          status: 'CONFIRMED',
          orderId: existing.orderId!,
          ...(existing.orderKey ? { orderKey: existing.orderKey } : {}),
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
    this.attempts.set(attemptKey, {
      attemptKey,
      cartToken,
      status: 'PENDING',
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    });

    return { ok: true, isNew: true };
  }

  async confirmAttempt(
    attemptKey: string,
    orderId: string | number,
    orderKey?: string
  ): Promise<CheckoutAttempt> {
    const existing = this.attempts.get(attemptKey);
    const now = Date.now();
    const confirmed: CheckoutAttempt = {
      attemptKey,
      cartToken: existing?.cartToken || '',
      status: 'CONFIRMED',
      orderId,
      ...(orderKey ? { orderKey } : {}),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    this.attempts.set(attemptKey, confirmed);
    return confirmed;
  }

  async failAttempt(attemptKey: string, error: string): Promise<CheckoutAttempt> {
    const existing = this.attempts.get(attemptKey);
    const now = Date.now();
    const failed: CheckoutAttempt = {
      attemptKey,
      cartToken: existing?.cartToken || '',
      status: 'FAILED',
      error,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    this.attempts.set(attemptKey, failed);
    return failed;
  }

  getAttempt(attemptKey: string): CheckoutAttempt | undefined {
    return this.attempts.get(attemptKey);
  }

  clear(): void {
    this.attempts.clear();
  }
}

export const globalAttemptManager = new CheckoutAttemptManager();

