# ECO-301: SearchProvider Abstraction & Evaluation Report

## Identity and scope

- Task: `ECO-301`
- Title: Create `SearchProvider` abstraction with search, suggestions, filters/facets, index health, sync, and fallback. Compare Meilisearch vs Typesense vs repaired native Woo search on real sample catalog. Log maintenance, pricing, and license decisions.
- Executor: `catalog-a-1`, catalog lane, tool `codex`.
- Worktree: `C:/dev/ecomos-eco301`, branch `fix/eco-301-search-provider`.
- Base commit: `8ab5c823ddb5d28a9dbb1f067090044e546ad831`.
- Claimed paths: `packages/ecom-engine/src/search`, `docs/ecomos/evidence/ECO-301`.
- Resources: `git-index`, `workspace-build`.
- Date: 2026-10-10.

## Workflow and source of truth

1. **SearchProvider Contract Definition:**
   - Established typed [`SearchProvider`](file:///C:/dev/ecomos-eco301/packages/ecom-engine/src/search/types.ts) abstraction in `@ecom-os/engine` with methods:
     - `search(query: SearchQuery): Promise<SearchResult>`
     - `suggest(term: string, limit?: number): Promise<SearchSuggestion[]>`
     - `health(): Promise<IndexHealth>`
     - `sync(documents: SearchDocument[]): Promise<IndexSyncResult>`
     - `delete(documentIds: string[]): Promise<{ deleted: number }>`
     - `clear(): Promise<void>`

2. **Public-Only Field Sanitization (Data Boundary Guard):**
   - Implemented [`sanitizeSearchDocument`](file:///C:/dev/ecomos-eco301/packages/ecom-engine/src/search/sanitizer.ts).
   - Enforced strict fail-closed boundary: documents containing customer identifiers, emails, cart tokens, session tokens, order keys, or quotes are rejected with an explicit security error.
   - Only public catalog fields (`id`, `slug`, `title`, `description`, `sku`, `priceMinor`, `currency`, `brand`, `categories`, `inStock`, `attributes`, `tags`, `image`, `createdAt`) are indexed.

3. **Repaired Native WooCommerce Search Provider:**
   - Built [`NativeWooSearchProvider`](file:///C:/dev/ecomos-eco301/packages/ecom-engine/src/search/native-woo-provider.ts) providing:
     - Full-text search across titles, descriptions, SKUs, and brands.
     - French diacritic folding (NFD unicode normalization) allowing unaccented queries (`creme`) to match accented products (`Crème Hydratante`).
     - Multi-faceted filtering (categories, brands, in-stock status, price range).
     - Facet aggregation returning accurate counts.
     - Typeahead suggestions for query strings.
     - Zero-dependency runtime execution directly within the engine.

4. **Resilient Fallback Coordination:**
   - Built [`FallbackSearchProvider`](file:///C:/dev/ecomos-eco301/packages/ecom-engine/src/search/fallback.ts).
   - If the primary provider (e.g. Meilisearch or Typesense) fails or times out, queries automatically route to the fallback provider and mark `fallbackUsed: true`.
   - Never swallows dual failures: if both primary and fallback fail, a descriptive exception is thrown rather than returning silent empty results.
   - Index health reflects cluster status, reporting `degraded` when running on fallback.

5. **Provider Evaluation & Decision:**
   - Benchmarked and documented detailed comparison of Meilisearch vs Typesense vs Repaired Native Woo search in [`provider-decision.md`](file:///C:/dev/ecomos-eco301/docs/ecomos/evidence/ECO-301/provider-decision.md).
   - Decision: Default to Repaired Native Woo search for zero-ops deployments, and recommend Meilisearch (MIT License) as the primary search engine for high-traffic multi-tenant environments.

## Changed behavior and files

- `packages/ecom-engine/src/search/types.ts`:
  - Core interfaces: `SearchDocument`, `SearchQuery`, `SearchResult`, `SearchSuggestion`, `IndexHealth`, `IndexSyncResult`, and `SearchProvider`.
- `packages/ecom-engine/src/search/sanitizer.ts`:
  - Security validator preventing private data leakage into search indices.
- `packages/ecom-engine/src/search/fallback.ts`:
  - `FallbackSearchProvider` implementation with logging, health aggregation, and explicit failure semantics.
- `packages/ecom-engine/src/search/native-woo-provider.ts`:
  - Repaired native search provider with French accent normalization, facets, suggestions, and filtering.
- `packages/ecom-engine/src/search/meilisearch-provider.ts`:
  - Typed Meilisearch provider conforming to `SearchProvider`.
- `packages/ecom-engine/src/search/typesense-provider.ts`:
  - Typed Typesense provider conforming to `SearchProvider`.
- `packages/ecom-engine/src/search/index.ts`:
  - Re-exports all search module components.
- `packages/ecom-engine/src/search/__tests__/search-contract.test.ts`:
  - Comprehensive contract test suite (15 tests) covering sanitization, native search, French diacritics, facets, suggestions, fallback routing, and health checks.
- `docs/ecomos/evidence/ECO-301/provider-decision.md`:
  - Technical comparison matrix, latency profiles, maintenance analysis, and licensing decision.
- `docs/ecomos/evidence/ECO-301/report.md`:
  - This evidence report.

## Verification and test results

- **Contract & Unit Tests:**
  - `pnpm test packages/ecom-engine/src/search/__tests__/search-contract.test.ts`: **PASS** (15 tests passed in 11ms).
  - `pnpm test packages/ecom-engine`: **PASS** (3 test files, 38 unit tests passed).
- **TypeScript Typecheck:**
  - `pnpm -C packages/ecom-engine typecheck`: **PASS** (`tsc --noEmit` clean with `exactOptionalPropertyTypes: true`).

## Business integrity & Honest boundaries

- **Commercial Authority**: WooCommerce remains the absolute source of truth for products, variation identity, prices, and stock. Search indices are read-only projections.
- **Privacy Guarantee**: Search indices never contain customer identities, emails, passwords, cart tokens, session keys, order keys, or private quote documents.
- **Explicit Fallback**: When external search fails, fallbacks are explicitly logged and marked. If all backends fail, an error is thrown to alert operations.
