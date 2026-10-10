"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createSuggestionController,
  DEFAULT_DEBOUNCE_MS,
  DEFAULT_MIN_QUERY_LENGTH,
} from "./suggestion-controller";
import { createRateLimiter } from "./rate-limit";
import type { SuggestionFetcher, SuggestionSnapshot } from "./types";
import { EMPTY_GROUPS } from "./types";

export interface UseDebouncedSuggestionsOptions {
  fetchSuggestions: SuggestionFetcher;
  debounceMs?: number;
  minQueryLength?: number;
}

const IDLE_SNAPSHOT: SuggestionSnapshot = {
  status: "idle",
  query: "",
  groups: EMPTY_GROUPS,
};

export function useDebouncedSuggestions(
  options: UseDebouncedSuggestionsOptions,
) {
  const [query, setQuery] = useState("");
  const [snapshot, setSnapshot] =
    useState<SuggestionSnapshot>(IDLE_SNAPSHOT);

  const controller = useMemo(
    () =>
      createSuggestionController({
        fetchSuggestions: options.fetchSuggestions,
        debounceMs: options.debounceMs ?? DEFAULT_DEBOUNCE_MS,
        minQueryLength: options.minQueryLength ?? DEFAULT_MIN_QUERY_LENGTH,
        rateLimiter: createRateLimiter(),
        onSnapshot: setSnapshot,
      }),
    // The fetcher identity defines the data source; debounce bounds are fixed
    // per mount so keystroke timing stays predictable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.fetchSuggestions],
  );

  useEffect(() => () => controller.dispose(), [controller]);

  useEffect(() => {
    controller.request(query);
  }, [controller, query]);

  const retry = useMemo(() => () => controller.retry(), [controller]);
  const clear = useMemo(
    () => () => {
      setQuery("");
      controller.cancel();
    },
    [controller],
  );

  return { query, setQuery, snapshot, retry, clear };
}
