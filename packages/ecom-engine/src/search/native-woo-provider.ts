import {
  SearchProvider,
  SearchQuery,
  SearchResult,
  SearchSuggestion,
  IndexHealth,
  IndexSyncResult,
  SearchDocument,
  SearchFacetResult,
} from './types';
import { sanitizeSearchDocument } from './sanitizer';

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .trim();
}

/**
 * Repaired Native WooCommerce search provider.
 * Serves as the zero-infrastructure default provider and reliable fallback.
 * Implements diacritic normalization, exact/partial SKU matching, facet extraction,
 * and deterministic pagination.
 */
export class NativeWooSearchProvider implements SearchProvider {
  readonly name = 'native-woocommerce';
  private documents: Map<string, SearchDocument> = new Map();
  private lastSyncTime?: string;

  constructor(initialDocuments: SearchDocument[] = []) {
    for (const doc of initialDocuments) {
      const sanitized = sanitizeSearchDocument(doc as unknown as Record<string, unknown>);
      this.documents.set(sanitized.id, sanitized);
    }
    if (initialDocuments.length > 0) {
      this.lastSyncTime = new Date().toISOString();
    }
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const term = normalizeText(query.term || '');
    let matched = Array.from(this.documents.values());

    // 1. Text Search matching
    if (term) {
      matched = matched.filter((doc) => {
        const titleNorm = normalizeText(doc.title);
        const descNorm = normalizeText(doc.description);
        const skuNorm = doc.sku ? normalizeText(doc.sku) : '';
        const brandNorm = doc.brand ? normalizeText(doc.brand.name) : '';
        const categoryNorm = doc.categories.map((c) => normalizeText(c.name)).join(' ');
        const tagsNorm = doc.tags ? doc.tags.map(normalizeText).join(' ') : '';

        // Exact match boosts / partial match checks
        return (
          titleNorm.includes(term) ||
          skuNorm.includes(term) ||
          brandNorm.includes(term) ||
          categoryNorm.includes(term) ||
          tagsNorm.includes(term) ||
          descNorm.includes(term)
        );
      });
    }

    // 2. Category filter
    if (query.categorySlug) {
      const catSlug = query.categorySlug.toLowerCase();
      matched = matched.filter((doc) =>
        doc.categories.some((c) => c.slug.toLowerCase() === catSlug)
      );
    }

    // 3. Brand filter
    if (query.brandSlug) {
      const bSlug = query.brandSlug.toLowerCase();
      matched = matched.filter(
        (doc) => doc.brand && doc.brand.slug.toLowerCase() === bSlug
      );
    }

    // 4. In stock only
    if (query.inStockOnly) {
      matched = matched.filter((doc) => doc.inStock);
    }

    // 5. Price range
    if (typeof query.minPriceMinor === 'number') {
      matched = matched.filter((doc) => doc.priceMinor >= query.minPriceMinor!);
    }
    if (typeof query.maxPriceMinor === 'number') {
      matched = matched.filter((doc) => doc.priceMinor <= query.maxPriceMinor!);
    }

    // Compute facets on all matched items before pagination
    const facets = this.computeFacets(matched, query.facets);

    // 6. Sorting
    const sort = query.sort || 'relevance';
    if (sort === 'price_asc') {
      matched.sort((a, b) => a.priceMinor - b.priceMinor);
    } else if (sort === 'price_desc') {
      matched.sort((a, b) => b.priceMinor - a.priceMinor);
    } else if (sort === 'newest') {
      matched.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    } else if (sort === 'relevance' && term) {
      matched.sort((a, b) => {
        const aTitle = normalizeText(a.title);
        const bTitle = normalizeText(b.title);
        // Priority: title starts with term > title includes term > sku match
        const aScore = aTitle.startsWith(term) ? 3 : aTitle.includes(term) ? 2 : 1;
        const bScore = bTitle.startsWith(term) ? 3 : bTitle.includes(term) ? 2 : 1;
        return bScore - aScore;
      });
    }

    // 7. Pagination
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.pageSize || 20);
    const total = matched.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const start = (page - 1) * pageSize;
    const paginatedItems = matched.slice(start, start + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
      ...(facets ? { facets } : {}),
      query: query.term,
      provider: this.name,
      fallbackUsed: false,
    };
  }

  async suggest(term: string, limit: number = 5): Promise<SearchSuggestion[]> {
    const norm = normalizeText(term || '');
    if (!norm) return [];

    const suggestions: SearchSuggestion[] = [];
    const seenTexts = new Set<string>();

    for (const doc of this.documents.values()) {
      const titleNorm = normalizeText(doc.title);
      if (titleNorm.includes(norm) && !seenTexts.has(doc.title)) {
        seenTexts.add(doc.title);
        suggestions.push({
          text: doc.title,
          type: 'product',
          slug: doc.slug,
        });
      }

      if (doc.brand) {
        const brandNorm = normalizeText(doc.brand.name);
        if (brandNorm.includes(norm) && !seenTexts.has(doc.brand.name)) {
          seenTexts.add(doc.brand.name);
          suggestions.push({
            text: doc.brand.name,
            type: 'brand',
            slug: doc.brand.slug,
          });
        }
      }

      for (const cat of doc.categories) {
        const catNorm = normalizeText(cat.name);
        if (catNorm.includes(norm) && !seenTexts.has(cat.name)) {
          seenTexts.add(cat.name);
          suggestions.push({
            text: cat.name,
            type: 'category',
            slug: cat.slug,
          });
        }
      }

      if (suggestions.length >= limit) break;
    }

    return suggestions.slice(0, limit);
  }

  async health(): Promise<IndexHealth> {
    return {
      status: 'healthy',
      provider: this.name,
      documentCount: this.documents.size,
      latencyMs: 1,
      ...(this.lastSyncTime ? { lastSyncedAt: this.lastSyncTime } : {}),
      message: 'Native WooCommerce search index operational.',
    };
  }

  async sync(documents: SearchDocument[]): Promise<IndexSyncResult> {
    const start = Date.now();
    let indexed = 0;
    let updated = 0;

    for (const doc of documents) {
      const sanitized = sanitizeSearchDocument(doc as unknown as Record<string, unknown>);
      if (this.documents.has(sanitized.id)) {
        updated++;
      } else {
        indexed++;
      }
      this.documents.set(sanitized.id, sanitized);
    }

    this.lastSyncTime = new Date().toISOString();
    return {
      indexed,
      updated,
      deleted: 0,
      failed: 0,
      durationMs: Date.now() - start,
    };
  }

  async delete(documentIds: string[]): Promise<{ deleted: number }> {
    let deleted = 0;
    for (const id of documentIds) {
      if (this.documents.delete(id)) {
        deleted++;
      }
    }
    return { deleted };
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }

  private computeFacets(
    items: SearchDocument[],
    requestedFacets?: string[]
  ): Record<string, SearchFacetResult> | undefined {
    if (!requestedFacets || requestedFacets.length === 0) {
      return undefined;
    }

    const result: Record<string, SearchFacetResult> = {};

    for (const facetName of requestedFacets) {
      if (facetName === 'categories' || facetName === 'category') {
        const counts = new Map<string, { label: string; count: number }>();
        for (const item of items) {
          for (const cat of item.categories) {
            const current = counts.get(cat.slug) || { label: cat.name, count: 0 };
            current.count++;
            counts.set(cat.slug, current);
          }
        }
        result.categories = {
          field: 'categories',
          counts: Array.from(counts.entries()).map(([slug, data]) => ({
            value: slug,
            label: data.label,
            count: data.count,
          })),
        };
      } else if (facetName === 'brand' || facetName === 'brands') {
        const counts = new Map<string, { label: string; count: number }>();
        for (const item of items) {
          if (item.brand) {
            const current = counts.get(item.brand.slug) || { label: item.brand.name, count: 0 };
            current.count++;
            counts.set(item.brand.slug, current);
          }
        }
        result.brands = {
          field: 'brands',
          counts: Array.from(counts.entries()).map(([slug, data]) => ({
            value: slug,
            label: data.label,
            count: data.count,
          })),
        };
      } else if (facetName === 'inStock') {
        let inStockCount = 0;
        let outOfStockCount = 0;
        for (const item of items) {
          if (item.inStock) inStockCount++;
          else outOfStockCount++;
        }
        result.inStock = {
          field: 'inStock',
          counts: [
            { value: 'true', label: 'In Stock', count: inStockCount },
            { value: 'false', label: 'Out of Stock', count: outOfStockCount },
          ],
        };
      }
    }

    return result;
  }
}

