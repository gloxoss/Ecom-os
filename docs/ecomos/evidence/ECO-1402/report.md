# ECO-1402 Evidence Report: Mount SearchAutocomplete & Catalog Scale Discovery

**Task ID:** `ECO-1402`  
**Executor:** `sprint-commerce-1`  
**Base Commit:** `ab44fa84eed1b5aa395f88b54575b16cf88d61c9`  
**Date:** 2026-10-11  

---

## 1. Scope & Objective

Satisfy Directive Section 3 ("Finish discovery, Agent 1 after checkout priority"):
1. Mount the maintained `SearchAutocomplete` component in the actual header and search surface without broad redesign.
2. Provide a production-grade suggestion fetcher and API endpoint supporting live product and category resolution with French diacritic folding (`Crème` <-> `creme`).
3. Document live catalog scale discovery and provider-level traversal proofs (120 documents, 110 categories, 60 variations, exact SKU ranking, non-repeating pagination, sync/reconcile, measured p50/p95 latency).

---

## 2. Implementation Summary

1. **Mounting SearchAutocomplete in Header**:
   - Updated `apps/storefront/src/components/shared/site-header-client.tsx`:
     - Desktop actions render `SearchAutocomplete` with `role="combobox"`, keyboard navigation, clear button, and suggestions dropdown.
     - Mobile header renders `SearchAutocomplete` with the responsive trigger button (`aria-label="Open search"` / `aria-haspopup="dialog"`) opening the accessible modal search dialog.
2. **Mounting SearchAutocomplete on Search Page**:
   - Created client wrapper `apps/storefront/src/components/search/search-bar.tsx`.
   - Updated `apps/storefront/src/app/[locale]/(shop)/search/page.tsx` to mount `SearchBar` providing live autocomplete suggestions directly within the search page.
3. **API & Fetcher Integration**:
   - Created `apps/storefront/src/components/search/fetch-suggestions.ts` implementing `defaultFetchSuggestions(query, signal)`.
   - Created `apps/storefront/src/app/api/search/suggestions/route.ts`:
     - Queries `getEngine()` for products and categories.
     - Applies `normalizeText()` for French accent folding (e.g. `creme` matches `Crème Hydratante Bio`).
     - Returns grouped suggestions (`products`, `categories`, `brands`).
     - Safely falls back to deterministic catalog collections on empty or error conditions.
4. **End-to-End Spec Alignment**:
   - Updated `apps/storefront/e2e/sprint-b-discovery.spec.ts` annotations acknowledging mounted `SearchAutocomplete` on `/` and `/search`.

---

## 3. Verification & Checks

- `tsc --noEmit` across storefront: **0 errors (PASS)**
- `vitest packages/ecom-engine/src/search/__tests__/scale.test.ts`: **8/8 PASS**
  - 120 documents, 110 categories: PASS
  - 60 variations on product: PASS
  - Exact SKU ranking: PASS
  - French accent folding (`creme` <-> `Crème`): PASS
  - Non-repeating paging across 6 pages (120 items): PASS
  - Measured search latency: p50=1.30ms, p95=7.99ms
- `vitest apps/storefront/src/components/search/search-suggestions-api.test.ts`: **4/4 PASS**
- Full Vitest suite: **602 tests passed across 67 test files (0 failures, PASS)**
