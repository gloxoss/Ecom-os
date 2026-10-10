import { afterEach, describe, expect, it, vi } from "vitest";
import { createSuggestionController } from "./suggestion-controller";
import { createRateLimiter } from "./rate-limit";
import type { SuggestionGroups } from "./types";

const GROUPS: SuggestionGroups = {
  products: [
    { id: "p1", kind: "product", label: "Aspirator X", href: "/product/a" },
  ],
  categories: [
    { id: "c1", kind: "category", label: "Surgery", href: "/catalog?surgery" },
  ],
  brands: [{ id: "b1", kind: "brand", label: "MediCo", href: "/brand/medico" }],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("suggestion controller debounce", () => {
  it("emits loading then ready only for the last query", async () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    const snapshots: string[] = [];
    const controller = createSuggestionController({
      debounceMs: 180,
      fetchSuggestions: async (query) => {
        seen.push(query);
        return GROUPS;
      },
      onSnapshot: (snapshot) => snapshots.push(snapshot.status),
    });

    controller.request("as");
    controller.request("asp");
    controller.request("aspi");
    expect(seen).toEqual([]);
    await vi.advanceTimersByTimeAsync(180);
    expect(seen).toEqual(["aspi"]);
    expect(snapshots).toContain("loading");
    expect(snapshots.at(-1)).toBe("ready");
    expect(controller.getSnapshot().groups.products).toHaveLength(1);
    controller.dispose();
  });

  it("stays idle below the minimum query length", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const controller = createSuggestionController({
      debounceMs: 10,
      minQueryLength: 2,
      fetchSuggestions: async () => {
        calls += 1;
        return GROUPS;
      },
    });
    controller.request("a");
    await vi.advanceTimersByTimeAsync(50);
    expect(calls).toBe(0);
    expect(controller.getSnapshot().status).toBe("idle");
    controller.dispose();
  });
});

describe("suggestion controller AbortController", () => {
  it("aborts the previous request when a newer query fires", async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const first = deferred<SuggestionGroups>();
    const controller = createSuggestionController({
      debounceMs: 10,
      rateLimiter: createRateLimiter({
        maxRequests: 20,
        windowMs: 10_000,
        minIntervalMs: 0,
        rejectionBackoffMs: 5_000,
      }),
      fetchSuggestions: (query, signal) => {
        signals.push(signal);
        if (query === "first-query") return first.promise;
        return Promise.resolve(GROUPS);
      },
    });

    controller.request("first-query");
    await vi.advanceTimersByTimeAsync(10);
    expect(controller.getSnapshot().status).toBe("loading");

    controller.request("second-query");
    await vi.advanceTimersByTimeAsync(10);
    expect(signals[0].aborted).toBe(true);
    first.resolve(GROUPS);
    await vi.advanceTimersByTimeAsync(10);
    expect(controller.getSnapshot().query).toBe("second-query");
    expect(controller.getSnapshot().status).toBe("ready");
    controller.dispose();
  });

  it("ignores aborted responses instead of surfacing an error", async () => {
    vi.useFakeTimers();
    const gate = deferred<SuggestionGroups>();
    const snapshots: string[] = [];
    const controller = createSuggestionController({
      debounceMs: 10,
      fetchSuggestions: () => gate.promise,
      onSnapshot: (snapshot) => snapshots.push(snapshot.status),
    });
    controller.request("needle");
    await vi.advanceTimersByTimeAsync(10);
    controller.cancel();
    const abortError = new DOMException("Aborted", "AbortError");
    gate.reject(abortError);
    await vi.advanceTimersByTimeAsync(10);
    expect(controller.getSnapshot().status).toBe("idle");
    expect(snapshots).not.toContain("error");
    controller.dispose();
  });
});

describe("suggestion controller rate-limit protection", () => {
  it("enters rate-limited state without fetching when the client budget is spent", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const limiter = createRateLimiter({
      maxRequests: 1,
      windowMs: 10_000,
      minIntervalMs: 0,
      rejectionBackoffMs: 5_000,
    });
    const controller = createSuggestionController({
      debounceMs: 10,
      rateLimiter: limiter,
      fetchSuggestions: async () => {
        calls += 1;
        return GROUPS;
      },
    });
    controller.request("first");
    await vi.advanceTimersByTimeAsync(10);
    expect(calls).toBe(1);
    controller.request("second");
    await vi.advanceTimersByTimeAsync(10);
    expect(controller.getSnapshot().status).toBe("rate-limited");
    expect(calls).toBe(1);
    expect(controller.getSnapshot().retryAfterMs).toBeGreaterThan(0);
    controller.dispose();
  });

  it("maps a server 429 into a recoverable rate-limited state", async () => {
    vi.useFakeTimers();
    const snapshots: string[] = [];
    const controller = createSuggestionController({
      debounceMs: 10,
      fetchSuggestions: async () => {
        throw { status: 429 };
      },
      onSnapshot: (snapshot) => snapshots.push(snapshot.status),
    });
    controller.request("needle");
    await vi.advanceTimersByTimeAsync(10);
    expect(controller.getSnapshot().status).toBe("rate-limited");
    controller.dispose();
  });

  it("surfaces backend failures as a retryable error state", async () => {
    vi.useFakeTimers();
    const controller = createSuggestionController({
      debounceMs: 10,
      fetchSuggestions: async () => {
        throw new Error("backend down");
      },
    });
    controller.request("needle");
    await vi.advanceTimersByTimeAsync(10);
    expect(controller.getSnapshot().status).toBe("error");
    expect(controller.getSnapshot().errorMessage).toContain("backend down");
    controller.dispose();
  });

  it("reports ready with empty groups for empty results", async () => {
    vi.useFakeTimers();
    const controller = createSuggestionController({
      debounceMs: 10,
      fetchSuggestions: async () => ({
        products: [],
        categories: [],
        brands: [],
      }),
    });
    controller.request("zzz-no-match");
    await vi.advanceTimersByTimeAsync(10);
    expect(controller.getSnapshot().status).toBe("ready");
    controller.dispose();
  });
});
