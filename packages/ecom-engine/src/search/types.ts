/**
 * Public search document representing an indexed product.
 * Invariant: Index public fields only. Never index customer data, quotes, tokens, or private metadata.
 */
export interface SearchDocument {
  id: string;
  slug: string;
  title: string;
  description: string;
  sku?: string | undefined;
  priceMinor: number;
  currency: string;
  brand?: {
    id: string;
    name: string;
    slug: string;
  } | undefined;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  inStock: boolean;
  attributes?: Record<string, string | string[]> | undefined;
  tags?: string[] | undefined;
  image?: {
    url: string;
    alt?: string | undefined;
  } | undefined;
  createdAt?: string | undefined;
}

export type SearchSort = 'relevance' | 'price_asc' | 'price_desc' | 'newest';

export interface SearchQuery {
  term: string;
  categorySlug?: string | undefined;
  brandSlug?: string | undefined;
  minPriceMinor?: number | undefined;
  maxPriceMinor?: number | undefined;
  inStockOnly?: boolean | undefined;
  attributes?: Record<string, string | string[]> | undefined;
  sort?: SearchSort | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  facets?: string[] | undefined;
  locale?: string | undefined;
}

export interface SearchFacetValue {
  value: string;
  label?: string | undefined;
  count: number;
}

export interface SearchFacetResult {
  field: string;
  counts: SearchFacetValue[];
}

export interface SearchResult<T = SearchDocument> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets?: Record<string, SearchFacetResult> | undefined;
  query: string;
  provider: string;
  fallbackUsed?: boolean | undefined;
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand' | 'query';
  slug?: string | undefined;
  itemCount?: number | undefined;
}

export type IndexHealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface IndexHealth {
  status: IndexHealthStatus;
  provider: string;
  documentCount: number;
  latencyMs?: number | undefined;
  lastSyncedAt?: string | undefined;
  message?: string | undefined;
}

export interface IndexSyncResult {
  indexed: number;
  updated: number;
  deleted: number;
  failed: number;
  durationMs: number;
  errors?: Array<{ id: string; error: string }> | undefined;
}

/**
 * Universal SearchProvider abstraction.
 * All public search implementations (Meilisearch, Typesense, native Woo fallback)
 * conform to this contract.
 */
export interface SearchProvider {
  readonly name: string;
  search(query: SearchQuery): Promise<SearchResult>;
  suggest(term: string, limit?: number): Promise<SearchSuggestion[]>;
  health(): Promise<IndexHealth>;
  sync(documents: SearchDocument[]): Promise<IndexSyncResult>;
  delete(documentIds: string[]): Promise<{ deleted: number }>;
  clear(): Promise<void>;
}

