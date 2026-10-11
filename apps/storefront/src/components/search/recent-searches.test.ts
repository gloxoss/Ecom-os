import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearRecentSearches,
  DEFAULT_MAX_RECENT_SEARCHES,
  DEFAULT_POPULAR_SEARCHES,
  getRecentSearches,
  normalizeText,
  RECENT_SEARCHES_STORAGE_KEY,
  removeRecentSearch,
  saveRecentSearch,
} from './recent-searches';

class MockStorage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  clear() {
    this.store = {};
  }
  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

// jsdom's `window` already exists; tests swap in a stub with the storage under
// test. This alias lets us assign and delete it without an `any` cast.
type TestGlobal = { window?: { localStorage: MockStorage } };
const testGlobal = globalThis as unknown as TestGlobal;

describe('recent searches storage and text normalization', () => {
  const originalWindow = globalThis.window;
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    testGlobal.window = {
      localStorage: mockStorage,
    };
  });

  afterEach(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete testGlobal.window;
    }
  });

  it('returns an empty array when window is undefined (SSR)', () => {
    delete testGlobal.window;
    expect(getRecentSearches()).toEqual([]);
  });

  it('returns an empty array when no searches are stored', () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it('handles malformed JSON gracefully', () => {
    mockStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, 'not-json-{{{');
    expect(getRecentSearches()).toEqual([]);
  });

  it('ignores non-array stored data', () => {
    mockStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify({ item: 'test' }));
    expect(getRecentSearches()).toEqual([]);
  });

  it('filters out empty or non-string items', () => {
    mockStorage.setItem(
      RECENT_SEARCHES_STORAGE_KEY,
      JSON.stringify(['valid', '', '   ', 123, null, 'another']),
    );
    expect(getRecentSearches()).toEqual(['valid', 'another']);
  });

  it('saves new queries and trims whitespace', () => {
    saveRecentSearch('  huile d argan  ');
    expect(getRecentSearches()).toEqual(['huile d argan']);
  });

  it('ignores queries shorter than 2 characters', () => {
    saveRecentSearch('a');
    saveRecentSearch(' ');
    expect(getRecentSearches()).toEqual([]);
  });

  it('deduplicates case-insensitively and puts most recent first', () => {
    saveRecentSearch('Savon Noir');
    saveRecentSearch('Argan');
    saveRecentSearch('savon noir');
    expect(getRecentSearches()).toEqual(['savon noir', 'Argan']);
  });

  it('caps at max recent searches limit', () => {
    for (let i = 1; i <= 10; i++) {
      saveRecentSearch(`search-${i}`);
    }
    const results = getRecentSearches();
    expect(results).toHaveLength(DEFAULT_MAX_RECENT_SEARCHES);
    expect(results[0]).toBe('search-10');
  });

  it('removes a specific search case-insensitively', () => {
    saveRecentSearch('Huile');
    saveRecentSearch('Savon');
    removeRecentSearch('huile');
    expect(getRecentSearches()).toEqual(['Savon']);
  });

  it('clears all recent searches', () => {
    saveRecentSearch('Huile');
    saveRecentSearch('Savon');
    clearRecentSearches();
    expect(getRecentSearches()).toEqual([]);
  });

  it('normalizes French diacritics accurately', () => {
    expect(normalizeText('Thé vert à la menthe')).toBe('the vert a la menthe');
    expect(normalizeText('Façade Crème Sérum')).toBe('facade creme serum');
    expect(normalizeText('Épices & Noël')).toBe('epices & noel');
    expect(normalizeText('  Glaçon  ')).toBe('glacon');
  });

  it('provides default popular searches', () => {
    expect(DEFAULT_POPULAR_SEARCHES.length).toBeGreaterThan(0);
    expect(DEFAULT_POPULAR_SEARCHES).toContain("Huile d'argan");
  });
});
