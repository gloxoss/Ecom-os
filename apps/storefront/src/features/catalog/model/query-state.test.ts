import { describe, expect, it } from 'vitest';
import {
  buildCatalogUrl,
  clearAllFilters,
  countActiveFilters,
  hasActiveFilters,
  parseCatalogQuery,
  serializeCatalogQuery,
  setInStockOnly,
  setPage,
  setPriceRange,
  setSort,
  toggleAttribute,
  toggleBrand,
  toggleCategory,
} from './query-state';

describe('ECO-305: Catalog and RFQ URL query state', () => {
  it('parses empty query string to clean default state', () => {
    const state = parseCatalogQuery('');
    expect(state).toEqual({
      categories: [],
      brands: [],
      minPrice: undefined,
      maxPrice: undefined,
      inStockOnly: undefined,
      attributes: {},
      sort: undefined,
      search: undefined,
      page: 1,
      limit: 24,
    });
    expect(hasActiveFilters(state)).toBe(false);
    expect(countActiveFilters(state)).toBe(0);
  });

  it('parses and round-trips mixed facet filters accurately', () => {
    const qs =
      'categories=huiles,savons&brands=argano&minPrice=50&maxPrice=250&inStock=true&attr_origin=maroc&sort=price_asc&q=bio&page=2';
    const parsed = parseCatalogQuery(qs);

    expect(parsed.categories).toEqual(['huiles', 'savons']);
    expect(parsed.brands).toEqual(['argano']);
    expect(parsed.minPrice).toBe(50);
    expect(parsed.maxPrice).toBe(250);
    expect(parsed.inStockOnly).toBe(true);
    expect(parsed.attributes).toEqual({ origin: ['maroc'] });
    expect(parsed.sort).toBe('price_asc');
    expect(parsed.search).toBe('bio');
    expect(parsed.page).toBe(2);
    expect(hasActiveFilters(parsed)).toBe(true);
    expect(countActiveFilters(parsed)).toBe(6);

    const serialized = serializeCatalogQuery(parsed).toString();
    expect(serialized).toContain('categories=huiles%2Csavons');
    expect(serialized).toContain('brands=argano');
    expect(serialized).toContain('minPrice=50');
    expect(serialized).toContain('maxPrice=250');
    expect(serialized).toContain('inStock=true');
    expect(serialized).toContain('attr_origin=maroc');
    expect(serialized).toContain('sort=price_asc');
    expect(serialized).toContain('q=bio');
    expect(serialized).toContain('page=2');
  });

  it('rejects unknown or invalid sort values without errors', () => {
    const parsed = parseCatalogQuery('sort=unknown_sort_order');
    expect(parsed.sort).toBeUndefined();
  });

  it('swaps inverted price ranges (min > max)', () => {
    const parsed = parseCatalogQuery('minPrice=300&maxPrice=100');
    expect(parsed.minPrice).toBe(100);
    expect(parsed.maxPrice).toBe(300);
  });

  it('sanitizes malformed numbers, negative prices, and bad page numbers', () => {
    const parsed = parseCatalogQuery('minPrice=-50&page=-3&limit=abc');
    expect(parsed.minPrice).toBeUndefined();
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(24);
  });

  it('strips HTML/script tags from queries and facet values', () => {
    const parsed = parseCatalogQuery('q=<script>alert(1)</script>&categories=<img src=x onerror=1>,soins');
    expect(parsed.search).toBe('alert(1)');
    expect(parsed.categories).toEqual(['soins']);
  });

  it('resets page to 1 when any filter is toggled or changed', () => {
    let state = parseCatalogQuery('categories=huiles&page=4');
    expect(state.page).toBe(4);

    state = toggleCategory(state, 'savons');
    expect(state.page).toBe(1);
    expect(state.categories).toEqual(['huiles', 'savons']);

    state = setPage(state, 3);
    expect(state.page).toBe(3);

    state = toggleBrand(state, 'terroir');
    expect(state.page).toBe(1);
    expect(state.brands).toEqual(['terroir']);

    state = setPage(state, 5);
    state = toggleAttribute(state, 'origin', 'maroc');
    expect(state.page).toBe(1);
    expect(state.attributes.origin).toEqual(['maroc']);

    state = setPage(state, 2);
    state = setPriceRange(state, 20, 100);
    expect(state.page).toBe(1);

    state = setPage(state, 2);
    state = setInStockOnly(state, true);
    expect(state.page).toBe(1);

    state = setPage(state, 2);
    state = setSort(state, 'newest');
    expect(state.page).toBe(1);
  });

  it('toggles existing facet values off when called again', () => {
    let state = parseCatalogQuery('');
    state = toggleCategory(state, 'huiles');
    expect(state.categories).toEqual(['huiles']);

    state = toggleCategory(state, 'huiles');
    expect(state.categories).toEqual([]);
  });

  it('clears all filters and resets page, while preserving search by default', () => {
    const active = parseCatalogQuery(
      'categories=huiles&brands=argano&minPrice=10&maxPrice=100&inStock=true&q=argan&page=3',
    );
    const cleared = clearAllFilters(active, true);
    expect(cleared.categories).toEqual([]);
    expect(cleared.brands).toEqual([]);
    expect(cleared.minPrice).toBeUndefined();
    expect(cleared.maxPrice).toBeUndefined();
    expect(cleared.inStockOnly).toBeUndefined();
    expect(cleared.page).toBe(1);
    expect(cleared.search).toBe('argan');
  });

  it('clears search when preserveSearch is false', () => {
    const active = parseCatalogQuery('categories=huiles&q=argan');
    const cleared = clearAllFilters(active, false);
    expect(cleared.search).toBeUndefined();
  });

  it('generates consistent URLs for /catalog and /devis', () => {
    const state = parseCatalogQuery('categories=huiles&sort=newest');
    const catalogUrl = buildCatalogUrl('/catalog', state);
    const devisUrl = buildCatalogUrl('/devis', state);

    expect(catalogUrl).toBe('/catalog?categories=huiles&sort=newest');
    expect(devisUrl).toBe('/devis?categories=huiles&sort=newest');
  });

  it('omits default page=1 from the generated URL', () => {
    const state = parseCatalogQuery('page=1&categories=soins');
    const url = buildCatalogUrl('/catalog', state);
    expect(url).toBe('/catalog?categories=soins');
    expect(url).not.toContain('page=');
  });
});
