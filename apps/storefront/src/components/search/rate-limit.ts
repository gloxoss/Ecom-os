export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  minIntervalMs: number;
  rejectionBackoffMs: number;
}

export const DEFAULT_RATE_LIMITER_OPTIONS: RateLimiterOptions = {
  maxRequests: 20,
  windowMs: 10_000,
  minIntervalMs: 120,
  rejectionBackoffMs: 5_000,
};

export function createRateLimiter(
  options: Partial<RateLimiterOptions> = {},
) {
  const config = { ...DEFAULT_RATE_LIMITER_OPTIONS, ...options };
  let timestamps: number[] = [];
  let lastAllowedAt = 0;
  let blockedUntil = 0;

  function prune(now: number): void {
    timestamps = timestamps.filter((t) => now - t < config.windowMs);
  }

  function tryAcquire(now: number = Date.now()): boolean {
    prune(now);
    if (now < blockedUntil) return false;
    if (now - lastAllowedAt < config.minIntervalMs) return false;
    if (timestamps.length >= config.maxRequests) return false;
    timestamps.push(now);
    lastAllowedAt = now;
    return true;
  }

  function retryAfterMs(now: number = Date.now()): number {
    prune(now);
    const candidates: number[] = [];
    if (now < blockedUntil) candidates.push(blockedUntil - now);
    const intervalWait = config.minIntervalMs - (now - lastAllowedAt);
    if (intervalWait > 0) candidates.push(intervalWait);
    if (timestamps.length >= config.maxRequests) {
      const oldest = Math.min(...timestamps);
      candidates.push(oldest + config.windowMs - now);
    }
    return candidates.length > 0 ? Math.max(0, Math.ceil(Math.max(...candidates))) : 0;
  }

  function recordRejection(now: number = Date.now()): void {
    blockedUntil = Math.max(blockedUntil, now + config.rejectionBackoffMs);
  }

  function reset(): void {
    timestamps = [];
    lastAllowedAt = 0;
    blockedUntil = 0;
  }

  return { tryAcquire, retryAfterMs, recordRejection, reset };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  if (status === 429) return true;
  const code = (error as { code?: unknown }).code;
  return code === "RATE_LIMITED" || code === 429;
}
