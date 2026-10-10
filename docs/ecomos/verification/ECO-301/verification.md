# ECO-301 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `catalog-a-1`, catalog lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `5a80d9eb9bc0e5ffb29e9f4765ccdfea99755ba9`.
- Base: `8ab5c823ddb5d28a9dbb1f067090044e546ad831`.
- Executor evidence: `docs/ecomos/evidence/ECO-301/report.md`.
- Decision documentation: `docs/ecomos/evidence/ECO-301/provider-decision.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-301/verification.md`).

## Verdict

PASS for `SearchProvider` contract abstraction, explicit fail-closed fallback resilience, privacy-preserving document sanitization, diacritic-normalized native WooCommerce search, provider adapters (Meilisearch and Typesense), and real sample catalog provider evaluation at commit `5a80d9eb9bc0e5ffb29e9f4765ccdfea99755ba9`.

## Executed verification commands

1. Search provider contract tests:
   - `pnpm test packages/ecom-engine/src/search/__tests__/search-contract.test.ts`
   - Exit: 0.
   - Result: 15 passed in 1 file. Verified:
     - Full lifecycle indexing (`indexSync`), querying (`search`), and suggestions (`suggest`).
     - Diacritic-folding relevance: query `creme` matches `Crème Hydratante Bio`.
     - Exact and partial SKU matching (`ARGAN-PURE-50ML`).
     - Category, brand, and stock status filtering.
     - Faceted count aggregation across categories and brands.
     - Deterministic pagination (`limit`, `offset`, `total`).
     - Privacy containment: sanitization throws immediate error upon encountering private attributes (`customer`, `cartToken`, `orderKey`, `quoteSecret`, `email`).
     - Fallback resilience: seamless failover to secondary provider when primary fails, setting `fallbackUsed: true`.
     - No silent empty results: explicit error bubbling when both primary and fallback engines fail.
     - Provider health reporting (`healthy`, `degraded`, `unhealthy`).

2. Engine package test suite:
   - `pnpm test packages/ecom-engine`
   - Exit: 0.
   - Result: 38 passed across 3 test files (queries, contracts, search-contract). No engine regressions.

3. Engine TypeScript typecheck:
   - `pnpm -C packages/ecom-engine typecheck`
   - Exit: 0.
   - Result: 0 errors under strict `tsc --noEmit`.

4. Git scope containment:
   - `git diff --stat 8ab5c823ddb5d28a9dbb1f067090044e546ad831..5a80d9eb9bc0e5ffb29e9f4765ccdfea99755ba9`
   - Result: Exactly 10 files modified/added, completely within claimed boundaries:
     - `packages/ecom-engine/src/search/` (8 files)
     - `docs/ecomos/evidence/ECO-301/` (2 files)
   - Zero scope escape.

5. Architectural and Invariant Inspection:
   - **Commerce Invariant**: WooCommerce retains authoritative ownership of product definitions, variation IDs, pricing, and live inventory. Search engines are read-only discovery projections.
   - **Privacy Invariant**: `sanitizeSearchDocument` acts as a fail-closed firewall rejecting customer tokens, order keys, quotes, and addresses.
   - **Resilience Invariant**: `FallbackSearchProvider` wraps primary and fallback implementations. It marks fallback usage explicitly (`fallbackUsed: true`) and re-throws when all backends fail rather than emitting silent empty arrays.
   - **Decision Documentation**: `provider-decision.md` systematically compares Meilisearch (MIT), Typesense (GPL-3.0), and Repaired Native Woo search, establishing Native as zero-dependency baseline and Meilisearch as recommended scaling engine.
