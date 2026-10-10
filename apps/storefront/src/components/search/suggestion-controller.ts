import {
  EMPTY_GROUPS,
  type SuggestionFetcher,
  type SuggestionGroups,
  type SuggestionSnapshot,
} from "./types";
import { createRateLimiter, isRateLimitError, type RateLimiter } from "./rate-limit";

export interface SuggestionControllerOptions {
  fetchSuggestions: SuggestionFetcher;
  debounceMs?: number;
  minQueryLength?: number;
  rateLimiter?: RateLimiter;
  onSnapshot?: (snapshot: SuggestionSnapshot) => void;
}

export const DEFAULT_DEBOUNCE_MS = 180;
export const DEFAULT_MIN_QUERY_LENGTH = 2;

export function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function emptySnapshot(query: string): SuggestionSnapshot {
  return { status: "idle", query, groups: EMPTY_GROUPS };
}

export function createSuggestionController(
  options: SuggestionControllerOptions,
) {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const minQueryLength = options.minQueryLength ?? DEFAULT_MIN_QUERY_LENGTH;
  const rateLimiter = options.rateLimiter ?? createRateLimiter();

  let snapshot: SuggestionSnapshot = emptySnapshot("");
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight: AbortController | null = null;
  let disposed = false;
  let sequence = 0;

  function emit(next: SuggestionSnapshot): void {
    snapshot = next;
    options.onSnapshot?.(next);
  }

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function abortInFlight(): void {
    if (inFlight !== null) {
      inFlight.abort();
      inFlight = null;
    }
  }

  function request(query: string): void {
    if (disposed) return;
    const trimmed = query.trim();

    if (trimmed.length < minQueryLength) {
      clearTimer();
      abortInFlight();
      emit(emptySnapshot(query));
      return;
    }

    clearTimer();
    timer = setTimeout(() => {
      void run(trimmed, query);
    }, debounceMs);
  }

  async function run(normalizedQuery: string, rawQuery: string): Promise<void> {
    if (disposed) return;
    if (!rateLimiter.tryAcquire(Date.now())) {
      abortInFlight();
      emit({
        status: "rate-limited",
        query: rawQuery,
        groups: EMPTY_GROUPS,
        retryAfterMs: rateLimiter.retryAfterMs(Date.now()),
      });
      return;
    }
    abortInFlight();
    const controller = new AbortController();
    inFlight = controller;
    const runId = ++sequence;

    const loading: SuggestionSnapshot = {
      status: "loading",
      query: rawQuery,
      groups: EMPTY_GROUPS,
    };
    emit(loading);

    try {
      const groups: SuggestionGroups = await options.fetchSuggestions(
        normalizedQuery,
        controller.signal,
      );
      if (disposed || runId !== sequence) return;
      if (controller.signal.aborted) return;
      inFlight = null;
      const next: SuggestionSnapshot = {
        status: "ready",
        query: rawQuery,
        groups,
      };
      emit(next);
    } catch (error) {
      if (disposed || runId !== sequence) return;
      if (isAbortError(error) || controller.signal.aborted) return;
      inFlight = null;
      if (isRateLimitError(error)) {
        rateLimiter.recordRejection(Date.now());
        const limited: SuggestionSnapshot = {
          status: "rate-limited",
          query: rawQuery,
          groups: EMPTY_GROUPS,
          retryAfterMs: rateLimiter.retryAfterMs(Date.now()),
        };
        emit(limited);
        return;
      }
      const failed: SuggestionSnapshot = {
        status: "error",
        query: rawQuery,
        groups: EMPTY_GROUPS,
        errorMessage:
          error instanceof Error ? error.message : "Search is unavailable.",
      };
      emit(failed);
    }
  }

  function cancel(): void {
    clearTimer();
    abortInFlight();
    emit(emptySnapshot(snapshot.query));
  }

  function retry(): void {
    request(snapshot.query);
  }

  function getSnapshot(): SuggestionSnapshot {
    return snapshot;
  }

  function dispose(): void {
    disposed = true;
    clearTimer();
    abortInFlight();
  }

  return { request, cancel, retry, getSnapshot, dispose };
}

export type SuggestionController = ReturnType<
  typeof createSuggestionController
>;
