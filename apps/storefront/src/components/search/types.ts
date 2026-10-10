export type SuggestionKind = "product" | "category" | "brand";

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  label: string;
  href: string;
  hint?: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
}

export interface SuggestionGroups {
  products: Suggestion[];
  categories: Suggestion[];
  brands: Suggestion[];
}

export const EMPTY_GROUPS: SuggestionGroups = {
  products: [],
  categories: [],
  brands: [],
};

export type SuggestionStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "rate-limited";

export interface SuggestionSnapshot {
  status: SuggestionStatus;
  query: string;
  groups: SuggestionGroups;
  errorMessage?: string;
  retryAfterMs?: number;
}

export type SuggestionFetcher = (
  query: string,
  signal: AbortSignal,
) => Promise<SuggestionGroups>;

export function flattenSuggestions(groups: SuggestionGroups): Suggestion[] {
  return [...groups.products, ...groups.categories, ...groups.brands];
}

export function countSuggestions(groups: SuggestionGroups): number {
  return (
    groups.products.length +
    groups.categories.length +
    groups.brands.length
  );
}

export function isEmptyGroups(groups: SuggestionGroups): boolean {
  return countSuggestions(groups) === 0;
}

export function suggestionOptionId(
  listId: string,
  index: number,
): string {
  return `${listId}-option-${index}`;
}
