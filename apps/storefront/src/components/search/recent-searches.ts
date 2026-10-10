export const RECENT_SEARCHES_STORAGE_KEY = 'ecomos_recent_searches';
export const DEFAULT_MAX_RECENT_SEARCHES = 6;
export const DEFAULT_POPULAR_SEARCHES: readonly string[] = [
  "Huile d'argan",
  "Savon noir",
  "Amlou",
  "Eau de rose",
  "Safran",
  "Poterie",
];

function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

/**
 * Retrieves recent search queries from client storage.
 * Gracefully handles SSR, missing storage, or corrupted payloads.
 */
export function getRecentSearches(max: number = DEFAULT_MAX_RECENT_SEARCHES): string[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .slice(0, max);
  } catch {
    return [];
  }
}

/**
 * Persists a search query to recent searches, deduplicating case-insensitively.
 */
export function saveRecentSearch(query: string, max: number = DEFAULT_MAX_RECENT_SEARCHES): void {
  if (!isStorageAvailable()) return;
  const trimmed = query.trim();
  if (trimmed.length < 2) return;
  try {
    const existing = getRecentSearches(max * 2);
    const filtered = existing.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, max);
    window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota or access errors
  }
}

/**
 * Removes a specific search term from recent searches.
 */
export function removeRecentSearch(query: string): void {
  if (!isStorageAvailable()) return;
  try {
    const existing = getRecentSearches();
    const updated = existing.filter((item) => item.toLowerCase() !== query.trim().toLowerCase());
    window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota or access errors
  }
}

/**
 * Clears all recent searches from client storage.
 */
export function clearRecentSearches(): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
  } catch {
    // Ignore storage quota or access errors
  }
}

/**
 * Normalizes French diacritics and special characters for search query comparisons.
 * Folds accents: e.g. "thé" -> "the", "façade" -> "facade", "médicament" -> "medicament"
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
