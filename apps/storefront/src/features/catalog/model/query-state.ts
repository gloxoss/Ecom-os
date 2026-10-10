export type ProductSort =
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'title_asc'
  | 'title_desc';

export const VALID_SORT_VALUES: readonly ProductSort[] = [
  'price_asc',
  'price_desc',
  'newest',
  'title_asc',
  'title_desc',
];

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 24;

export interface CatalogFacetState {
  categories: string[];
  brands: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  attributes: Record<string, string[]>;
  sort?: ProductSort;
  search?: string;
  page: number;
  limit: number;
}

export type RawQueryParams =
  | URLSearchParams
  | string
  | Record<string, string | string[] | undefined | null>;

function parseListParam(raw: string | string[] | undefined | null): string[] {
  if (!raw) return [];
  const items = Array.isArray(raw) ? raw : raw.split(',');
  return [
    ...new Set(
      items
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && !/[<>"'`;]/.test(item)),
    ),
  ].sort();
}

function parseNumberParam(raw: string | string[] | undefined | null): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return undefined;
  const num = Number(str.trim());
  if (Number.isNaN(num) || num < 0 || !Number.isFinite(num)) return undefined;
  return Math.round(num * 100) / 100;
}

function parseBooleanParam(raw: string | string[] | undefined | null): boolean | undefined {
  if (raw === undefined || raw === null) return undefined;
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return undefined;
  const lower = str.trim().toLowerCase();
  if (lower === 'true' || lower === '1') return true;
  if (lower === 'false' || lower === '0') return false;
  return undefined;
}

function parseSortParam(raw: string | string[] | undefined | null): ProductSort | undefined {
  if (!raw) return undefined;
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return undefined;
  const trimmed = str.trim().toLowerCase() as ProductSort;
  return VALID_SORT_VALUES.includes(trimmed) ? trimmed : undefined;
}

/**
 * Parses raw search params or URL query string into a validated, sanitized CatalogFacetState.
 */
export function parseCatalogQuery(input: RawQueryParams): CatalogFacetState {
  const params: Record<string, string | string[]> = {};

  if (typeof input === 'string') {
    const search = input.startsWith('?') ? input.slice(1) : input;
    const urlParams = new URLSearchParams(search);
    for (const [key, value] of urlParams.entries()) {
      if (params[key]) {
        params[key] = Array.isArray(params[key])
          ? [...(params[key] as string[]), value]
          : [params[key] as string, value];
      } else {
        params[key] = value;
      }
    }
  } else if (input instanceof URLSearchParams) {
    for (const [key, value] of input.entries()) {
      if (params[key]) {
        params[key] = Array.isArray(params[key])
          ? [...(params[key] as string[]), value]
          : [params[key] as string, value];
      } else {
        params[key] = value;
      }
    }
  } else if (input && typeof input === 'object') {
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && value !== null) {
        params[key] = value;
      }
    }
  }

  // Categories: support 'category' or 'categories'
  const rawCategories = params.categories ?? params.category;
  const categories = parseListParam(rawCategories);

  // Brands: support 'brand' or 'brands'
  const rawBrands = params.brands ?? params.brand;
  const brands = parseListParam(rawBrands);

  // Prices: support min/minPrice, max/maxPrice
  const rawMin = params.minPrice ?? params.min;
  const minPrice = parseNumberParam(rawMin);

  const rawMax = params.maxPrice ?? params.max;
  const maxPrice = parseNumberParam(rawMax);

  // Stock
  const rawStock = params.inStockOnly ?? params.inStock;
  const inStockOnly = parseBooleanParam(rawStock);

  // Sort
  const sort = parseSortParam(params.sort);

  // Search: support 'q' or 'search'
  const rawSearch = params.q ?? params.search;
  let search: string | undefined = undefined;
  if (rawSearch) {
    const str = Array.isArray(rawSearch) ? rawSearch[0] : rawSearch;
    const sanitized = str.replace(/<[^>]*>/g, '').replace(/[<>"'`;]/g, '').trim();
    if (sanitized.length > 0) {
      search = sanitized;
    }
  }

  // Page
  const rawPage = params.page;
  const parsedPage = parseNumberParam(rawPage);
  const page = parsedPage !== undefined && parsedPage >= 1 ? Math.floor(parsedPage) : DEFAULT_PAGE;

  // Limit
  const rawLimit = params.limit;
  const parsedLimit = parseNumberParam(rawLimit);
  const limit =
    parsedLimit !== undefined && parsedLimit >= 1 && parsedLimit <= 100
      ? Math.floor(parsedLimit)
      : DEFAULT_PAGE_LIMIT;

  // Attributes: attr_<key> or attr[key]
  const attributes: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith('attr_')) {
      const attrName = key.slice(5).toLowerCase();
      const parsedValues = parseListParam(value);
      if (parsedValues.length > 0) {
        attributes[attrName] = parsedValues;
      }
    } else if (key.startsWith('attr[') && key.endsWith(']')) {
      const attrName = key.slice(5, -1).toLowerCase();
      const parsedValues = parseListParam(value);
      if (parsedValues.length > 0) {
        attributes[attrName] = parsedValues;
      }
    }
  }

  // Validate price range sanity (min <= max)
  let validMin = minPrice;
  let validMax = maxPrice;
  if (validMin !== undefined && validMax !== undefined && validMin > validMax) {
    // Swap if inverted
    const temp = validMin;
    validMin = validMax;
    validMax = temp;
  }

  return {
    categories,
    brands,
    minPrice: validMin,
    maxPrice: validMax,
    inStockOnly: inStockOnly ? true : undefined,
    attributes,
    sort,
    search,
    page,
    limit,
  };
}

/**
 * Serializes CatalogFacetState into deterministic URLSearchParams.
 * Omits defaults and empty fields to produce clean, canonical URLs.
 */
export function serializeCatalogQuery(state: Partial<CatalogFacetState>): URLSearchParams {
  const searchParams = new URLSearchParams();

  // Categories
  if (state.categories && state.categories.length > 0) {
    const sorted = [...state.categories].sort();
    searchParams.set('categories', sorted.join(','));
  }

  // Brands
  if (state.brands && state.brands.length > 0) {
    const sorted = [...state.brands].sort();
    searchParams.set('brands', sorted.join(','));
  }

  // Prices
  if (state.minPrice !== undefined && state.minPrice >= 0) {
    searchParams.set('minPrice', String(state.minPrice));
  }
  if (state.maxPrice !== undefined && state.maxPrice >= 0) {
    searchParams.set('maxPrice', String(state.maxPrice));
  }

  // In stock
  if (state.inStockOnly) {
    searchParams.set('inStock', 'true');
  }

  // Attributes sorted alphabetically
  if (state.attributes) {
    const sortedAttrKeys = Object.keys(state.attributes).sort();
    for (const attrKey of sortedAttrKeys) {
      const values = state.attributes[attrKey];
      if (values && values.length > 0) {
        const sortedValues = [...values].sort();
        searchParams.set(`attr_${attrKey.toLowerCase()}`, sortedValues.join(','));
      }
    }
  }

  // Sort
  if (state.sort && VALID_SORT_VALUES.includes(state.sort)) {
    searchParams.set('sort', state.sort);
  }

  // Search
  if (state.search && state.search.trim().length > 0) {
    searchParams.set('q', state.search.trim());
  }

  // Page (omit if 1)
  if (state.page !== undefined && state.page > 1) {
    searchParams.set('page', String(state.page));
  }

  // Limit (omit if default 24)
  if (state.limit !== undefined && state.limit !== DEFAULT_PAGE_LIMIT && state.limit > 0) {
    searchParams.set('limit', String(state.limit));
  }

  return searchParams;
}

/**
 * Builds a full canonical URL pathname + query string for catalog or RFQ (/devis).
 */
export function buildCatalogUrl(
  basePath: string = '/catalog',
  state: Partial<CatalogFacetState>,
): string {
  const params = serializeCatalogQuery(state);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Toggles a category filter on or off, resetting page to 1.
 */
export function toggleCategory(
  state: CatalogFacetState,
  categorySlug: string,
): CatalogFacetState {
  const slug = categorySlug.trim().toLowerCase();
  const exists = state.categories.includes(slug);
  const categories = exists
    ? state.categories.filter((c) => c !== slug)
    : [...state.categories, slug].sort();

  return {
    ...state,
    categories,
    page: DEFAULT_PAGE,
  };
}

/**
 * Toggles a brand filter on or off, resetting page to 1.
 */
export function toggleBrand(
  state: CatalogFacetState,
  brandSlug: string,
): CatalogFacetState {
  const slug = brandSlug.trim().toLowerCase();
  const exists = state.brands.includes(slug);
  const brands = exists
    ? state.brands.filter((b) => b !== slug)
    : [...state.brands, slug].sort();

  return {
    ...state,
    brands,
    page: DEFAULT_PAGE,
  };
}

/**
 * Toggles an attribute facet value on or off, resetting page to 1.
 */
export function toggleAttribute(
  state: CatalogFacetState,
  attributeName: string,
  value: string,
): CatalogFacetState {
  const name = attributeName.trim().toLowerCase();
  const val = value.trim().toLowerCase();
  const current = state.attributes[name] ?? [];
  const exists = current.includes(val);

  const updatedValues = exists
    ? current.filter((v) => v !== val)
    : [...current, val].sort();

  const attributes = { ...state.attributes };
  if (updatedValues.length > 0) {
    attributes[name] = updatedValues;
  } else {
    delete attributes[name];
  }

  return {
    ...state,
    attributes,
    page: DEFAULT_PAGE,
  };
}

/**
 * Updates price range, resetting page to 1.
 */
export function setPriceRange(
  state: CatalogFacetState,
  minPrice?: number,
  maxPrice?: number,
): CatalogFacetState {
  return {
    ...state,
    minPrice,
    maxPrice,
    page: DEFAULT_PAGE,
  };
}

/**
 * Toggles in-stock only filter, resetting page to 1.
 */
export function setInStockOnly(
  state: CatalogFacetState,
  inStockOnly: boolean,
): CatalogFacetState {
  return {
    ...state,
    inStockOnly: inStockOnly ? true : undefined,
    page: DEFAULT_PAGE,
  };
}

/**
 * Sets sort ordering, resetting page to 1.
 */
export function setSort(
  state: CatalogFacetState,
  sort?: ProductSort,
): CatalogFacetState {
  return {
    ...state,
    sort: sort && VALID_SORT_VALUES.includes(sort) ? sort : undefined,
    page: DEFAULT_PAGE,
  };
}

/**
 * Sets page number.
 */
export function setPage(state: CatalogFacetState, page: number): CatalogFacetState {
  const safePage = Math.max(1, Math.floor(page));
  return {
    ...state,
    page: safePage,
  };
}

/**
 * Clears all active facet filters (categories, brands, prices, attributes, stock),
 * resets page to 1, and optionally preserves or removes the search term.
 */
export function clearAllFilters(
  state: CatalogFacetState,
  preserveSearch = true,
): CatalogFacetState {
  return {
    categories: [],
    brands: [],
    minPrice: undefined,
    maxPrice: undefined,
    inStockOnly: undefined,
    attributes: {},
    sort: state.sort,
    search: preserveSearch ? state.search : undefined,
    page: DEFAULT_PAGE,
    limit: state.limit,
  };
}

/**
 * Checks whether any non-default filters (categories, brands, prices, stock, attributes) are active.
 */
export function hasActiveFilters(state: CatalogFacetState): boolean {
  return (
    state.categories.length > 0 ||
    state.brands.length > 0 ||
    state.minPrice !== undefined ||
    state.maxPrice !== undefined ||
    Boolean(state.inStockOnly) ||
    Object.keys(state.attributes).length > 0
  );
}

/**
 * Counts total number of active filter selections.
 */
export function countActiveFilters(state: CatalogFacetState): number {
  let count = 0;
  count += state.categories.length;
  count += state.brands.length;
  if (state.minPrice !== undefined || state.maxPrice !== undefined) count += 1;
  if (state.inStockOnly) count += 1;
  for (const values of Object.values(state.attributes)) {
    count += values.length;
  }
  return count;
}
