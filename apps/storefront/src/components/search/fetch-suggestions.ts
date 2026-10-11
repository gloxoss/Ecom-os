import type { SuggestionGroups } from './types';

/**
 * Default suggestion fetcher calling the storefront API endpoint.
 * Gracefully degrades to empty suggestions on network or parsing failure.
 */
export async function defaultFetchSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<SuggestionGroups> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { products: [], categories: [], brands: [] };
  }

  try {
    const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return { products: [], categories: [], brands: [] };
    }

    const data = (await res.json()) as Partial<SuggestionGroups>;
    return {
      products: Array.isArray(data.products) ? data.products : [],
      categories: Array.isArray(data.categories) ? data.categories : [],
      brands: Array.isArray(data.brands) ? data.brands : [],
    };
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    return { products: [], categories: [], brands: [] };
  }
}
