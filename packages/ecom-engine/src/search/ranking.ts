import { SearchDocument } from './types';

export type RelevanceMatchType =
  | 'exact_sku'
  | 'variation_sku'
  | 'sku_prefix'
  | 'exact_title'
  | 'title_prefix'
  | 'title_contains'
  | 'brand_match'
  | 'category_match'
  | 'attribute_match'
  | 'description_contains'
  | 'none';

export interface RelevanceScoreResult {
  score: number;
  matchType: RelevanceMatchType;
}

/**
 * Normalizes text by removing French diacritics and converting to lowercase.
 * Example: "Crème Hydratante" -> "creme hydratante"
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Normalizes SKU for strict technical matching.
 * Preserves alphanumeric characters and standard delimiters (-._/), normalizes to uppercase.
 */
export function normalizeSku(sku?: string | null): string {
  if (!sku) return '';
  return sku.trim().toUpperCase();
}

/**
 * Determines whether a search term represents a technical reference / SKU identifier.
 * Technical references have alphanumeric mix or delimiters (-._/), where typo tolerance
 * must be strictly disabled to prevent delivering the wrong mechanical/chemical item.
 */
export function isTechnicalIdentifier(term: string): boolean {
  const cleaned = term.trim();
  if (cleaned.length < 2) return false;

  // Patterns with delimiters: e.g. "VAL-102", "ARGAN-50ML", "REF.900", "PART_123"
  if (/^[A-Za-z0-9]+[-._/][A-Za-z0-9\-._/]+$/.test(cleaned)) {
    return true;
  }

  // Mixed letters and numbers: e.g. "SKU1234", "M12", "P204", "100ML"
  if (/[A-Za-z]/.test(cleaned) && /[0-9]/.test(cleaned)) {
    return true;
  }

  // All uppercase short code (3-6 chars) that isn't a natural word: e.g. "ISO", "DIN", "NPT"
  if (/^[A-Z0-9]{3,8}$/.test(cleaned) && !/^(LE|LA|LES|DES|DU|BIO|PUR|EAU|BOX)$/i.test(cleaned)) {
    return true;
  }

  return false;
}

/**
 * Determines whether typo correction / fuzzy search is permitted for the query.
 * Invariant: Typo correction is disabled for technical reference identifiers.
 */
export function allowsTypoCorrection(term: string): boolean {
  return !isTechnicalIdentifier(term);
}

/**
 * Computes deterministic relevance score for a document against a search term.
 * Invariant: SKU exact match receives highest priority (Score 1000 / 950),
 * resolving before title or description partial matches.
 */
export function computeRelevanceScore(doc: SearchDocument, queryTerm: string): RelevanceScoreResult {
  const rawTerm = queryTerm.trim();
  if (!rawTerm) {
    return { score: 0, matchType: 'none' };
  }

  const skuQuery = normalizeSku(rawTerm);
  const textQuery = normalizeText(rawTerm);

  // 1. Exact SKU match on parent document
  if (doc.sku && normalizeSku(doc.sku) === skuQuery) {
    return { score: 1000, matchType: 'exact_sku' };
  }

  // 2. Exact SKU match on any variation
  if (doc.variations && doc.variations.length > 0) {
    const hasExactVariationSku = doc.variations.some(
      (v) => v.sku && normalizeSku(v.sku) === skuQuery
    );
    if (hasExactVariationSku) {
      return { score: 950, matchType: 'variation_sku' };
    }
  }

  // 3. Technical SKU prefix match
  if (doc.sku && normalizeSku(doc.sku).startsWith(skuQuery)) {
    return { score: 750, matchType: 'sku_prefix' };
  }
  if (doc.variations && doc.variations.length > 0) {
    const hasVariationSkuPrefix = doc.variations.some(
      (v) => v.sku && normalizeSku(v.sku).startsWith(skuQuery)
    );
    if (hasVariationSkuPrefix) {
      return { score: 700, matchType: 'sku_prefix' };
    }
  }

  // If the query was purely a technical identifier and failed SKU checks,
  // do not let fuzzy name matching hijack the search if it's an exact technical search.
  const titleNorm = normalizeText(doc.title);

  // 4. Exact Title Match (after French diacritic folding)
  if (titleNorm === textQuery) {
    return { score: 500, matchType: 'exact_title' };
  }

  // 5. Title starts with search term
  if (titleNorm.startsWith(textQuery)) {
    return { score: 400, matchType: 'title_prefix' };
  }

  // 6. Title contains search term
  if (titleNorm.includes(textQuery)) {
    return { score: 300, matchType: 'title_contains' };
  }

  // 7. Brand match
  if (doc.brand && normalizeText(doc.brand.name).includes(textQuery)) {
    return { score: 250, matchType: 'brand_match' };
  }

  // 8. Category match
  if (doc.categories.some((c) => normalizeText(c.name).includes(textQuery))) {
    return { score: 200, matchType: 'category_match' };
  }

  // 9. Safe Attribute match
  if (doc.attributes) {
    const matchesAttr = Object.values(doc.attributes).some((val) => {
      if (typeof val === 'string') {
        return normalizeText(val).includes(textQuery);
      }
      if (Array.isArray(val)) {
        return val.some((v) => normalizeText(String(v)).includes(textQuery));
      }
      return false;
    });
    if (matchesAttr) {
      return { score: 150, matchType: 'attribute_match' };
    }
  }

  // 10. Description contains search term
  const descNorm = normalizeText(doc.description);
  if (descNorm.includes(textQuery)) {
    return { score: 50, matchType: 'description_contains' };
  }

  return { score: 0, matchType: 'none' };
}
