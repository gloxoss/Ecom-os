import { describe, expect, it } from "vitest";
import { createRateLimiter, isRateLimitError } from "./rate-limit";

describe("search rate limiter", () => {
  it("allows requests within budget and reports no wait", () => {
    const limiter = createRateLimiter({
      maxRequests: 3,
      windowMs: 10_000,
      minIntervalMs: 0,
      rejectionBackoffMs: 1_000,
    });
    expect(limiter.tryAcquire(1_000)).toBe(true);
    expect(limiter.tryAcquire(1_001)).toBe(true);
    expect(limiter.retryAfterMs(1_001)).toBe(0);
  });

  it("blocks when the window budget is exhausted", () => {
    const limiter = createRateLimiter({
      maxRequests: 2,
      windowMs: 10_000,
      minIntervalMs: 0,
      rejectionBackoffMs: 1_000,
    });
    expect(limiter.tryAcquire(1_000)).toBe(true);
    expect(limiter.tryAcquire(1_001)).toBe(true);
    expect(limiter.tryAcquire(1_002)).toBe(false);
    expect(limiter.retryAfterMs(1_002)).toBeGreaterThan(0);
  });

  it("enforces a minimum interval between keystrokes", () => {
    const limiter = createRateLimiter({
      maxRequests: 20,
      windowMs: 10_000,
      minIntervalMs: 120,
      rejectionBackoffMs: 1_000,
    });
    expect(limiter.tryAcquire(5_000)).toBe(true);
    expect(limiter.tryAcquire(5_050)).toBe(false);
    expect(limiter.tryAcquire(5_200)).toBe(true);
  });

  it("backs off after a server 429 rejection", () => {
    const limiter = createRateLimiter({
      maxRequests: 20,
      windowMs: 10_000,
      minIntervalMs: 0,
      rejectionBackoffMs: 5_000,
    });
    limiter.recordRejection(7_000);
    expect(limiter.tryAcquire(7_100)).toBe(false);
    expect(limiter.retryAfterMs(7_100)).toBeGreaterThan(0);
    expect(limiter.tryAcquire(12_001)).toBe(true);
  });

  it("recognizes rate-limit shaped errors", () => {
    expect(isRateLimitError({ status: 429 })).toBe(true);
    expect(isRateLimitError({ code: "RATE_LIMITED" })).toBe(true);
    expect(isRateLimitError(new Error("boom"))).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
  });
});
