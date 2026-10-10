# ECO-302 Completion Report: Safe Product Search Projection & Exact SKU Ranking

## Executive Summary

- **Task**: ECO-302 (Normalized product/variation search projection with exact SKU priority and technical identifier typo protection)
- **Executor**: `catalog-a-1`
- **Lane**: `catalog`
- **Tool**: `codex`
- **Base Commit**: `ea1401e37fbd3ab4ee9b2e79851b9d542762eb47`
- **Status**: Implemented, verified with unit and contract tests, ready for independent verification.

---

## Changed Files & Architecture

All changes reside strictly within claimed file paths:

1. [`packages/ecom-engine/src/search/types.ts`](../../../packages/ecom-engine/src/search/types.ts):
   - Extended `SearchDocument` with variation projection fields (`parentId`, `isVariation`, `variationCount`, `variations`, `availabilityStatus`, `isPurchasable`, `thumbnail`).
   - Introduced `SearchVariationReference` and `ProductProjectionOptions` interfaces.

2. [`packages/ecom-engine/src/search/sanitizer.ts`](../../../packages/ecom-engine/src/search/sanitizer.ts):
   - Added expanded firewall against disallowed private keys (`quote`, `quotes`, `quoteId`, `quoteSecret`, `rfq`, `rfqId`, `cost`, `margin`, `wholesaleSecret`, in addition to existing customer/session/auth tokens).
   - Preserves normalized variation metadata and thumbnail while ensuring strict fail-closed rejection.

3. [`packages/ecom-engine/src/search/projection.ts`](../../../packages/ecom-engine/src/search/projection.ts):
   - Implemented `projectProduct(product, options)`: Maps authoritative `Product` into normalized `SearchDocument`. Validates input against private data, maps authoritative Money prices (`amount_minor`, `currency`), stock availability, safe technical attributes, categories, brand, and nested variation references.
   - Implemented `projectVariation(product, variation, options)`: Maps standalone variation document with parent reference, dedicated SKU, price, and thumbnail.
   - Implemented `projectCatalog(products, options)`: Batch projection with optional standalone variation document generation.

4. [`packages/ecom-engine/src/search/ranking.ts`](../../../packages/ecom-engine/src/search/ranking.ts):
   - Implemented `computeRelevanceScore(doc, queryTerm)`: Deterministic scoring hierarchy giving exact SKU matches top priority (score 1000) and variation SKU matches score 950, resolving them above title and description matches.
   - Implemented `isTechnicalIdentifier(term)` and `allowsTypoCorrection(term)`: Detects technical reference identifiers (SKUs, part numbers, delimited codes like `VAL-102`, `REF-987`) and strictly **disables typo correction** to prevent accidental delivery of wrong mechanical/chemical catalog items.
   - Implemented `normalizeText(text)`: French diacritic folding via Unicode NFD normalization.

5. [`packages/ecom-engine/src/search/native-woo-provider.ts`](../../../packages/ecom-engine/src/search/native-woo-provider.ts):
   - Integrated `computeRelevanceScore` into relevance sorting so native search automatically sorts exact SKU matches first.
   - Added variation SKU and attribute matching to the search filter.

6. [`packages/ecom-engine/src/search/index.ts`](../../../packages/ecom-engine/src/search/index.ts):
   - Exported projection and ranking functions and types.

7. [`packages/ecom-engine/src/search/__tests__/projection.test.ts`](../../../packages/ecom-engine/src/search/__tests__/projection.test.ts):
   - 15 comprehensive unit and contract tests verifying projection, variation extraction, SKU exact match ranking, technical typo protection, French diacritic folding, and private field rejection.

---

## Verification Commands & Observed Results

1. **Projection Test Suite**:
   ```bash
   pnpm test packages/ecom-engine/src/search/__tests__/projection.test.ts
   ```
   - **Result**: `15 passed (15)` in 9ms.

2. **Search Contract & Regression Test Suites**:
   ```bash
   pnpm test packages/ecom-engine/src/search
   ```
   - **Result**: `30 passed (30)` across 2 test files (`projection.test.ts`, `search-contract.test.ts`).

3. **Overall Engine Test Suite**:
   ```bash
   pnpm test packages/ecom-engine
   ```
   - **Result**: `53 passed (53)` across 4 test files (`queries.test.ts`, `contracts.test.ts`, `search-contract.test.ts`, `projection.test.ts`).

4. **Engine TypeScript Typecheck**:
   ```bash
   pnpm -C packages/ecom-engine typecheck
   ```
   - **Result**: Clean `tsc --noEmit` with `0 errors`.

---

## Business & Security Invariants

- **Commercial Source of Truth**: WooCommerce remains the single authoritative source of truth for products, variations, inventory, and pricing. Projections are read-only search indices.
- **Privacy Firewall**: Customer records, sessions, cart tokens, quote secrets, and internal pricing/costs are explicitly blocked and cause immediate exceptions if provided.
- **Technical Reference Protection**: Exact SKU search always ranks #1, and typo rewriting is disabled for technical references to prevent wholesale misordering.
