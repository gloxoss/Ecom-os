# ECO-302 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `catalog-a-1`, catalog lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `1d2e9152a99e71aa255149eadd21f993c25e5b76`.
- Base: `ea1401e37fbd3ab4ee9b2e79851b9d542762eb47`.
- Executor evidence: `docs/ecomos/evidence/ECO-302/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-302/verification.md`).

## Verdict

PASS for normalized product/variation search projection, exact SKU priority ranking (score 1000/950), technical reference typo protection, French diacritic folding, and strict private data containment at commit `1d2e9152a99e71aa255149eadd21f993c25e5b76`.

## Executed verification commands

1. Projection and SKU ranking test suite:
   - `pnpm test packages/ecom-engine/src/search/__tests__/projection.test.ts`
   - Exit: 0.
   - Result: 15 passed in 1 file. Verified:
     - Authoritative Product mapping to normalized `SearchDocument` with public attributes.
     - Nested variations projection preserving SKU, price minor, and inventory.
     - Standalone variation document projection (`projectVariation`) and catalog batching (`projectCatalog`).
     - Exact SKU match top priority ranking (Score 1000) over partial title and description matches.
     - Variation SKU match ranking (Score 950).
     - Integration into `NativeWooSearchProvider` sorting exact SKU match to index position 0.
     - Technical reference classification (`isTechnicalIdentifier`) and strict typo correction disabling (`allowsTypoCorrection: false`).
     - French diacritic folding (`Crème` matches `creme`, `Éclat` matches `eclat`).
     - Security containment: fail-closed rejection of `customerEmail`, `quoteSecret`, `rfqId`, and session tokens.

2. Search package regression suite:
   - `pnpm test packages/ecom-engine/src/search`
   - Exit: 0.
   - Result: 30 passed across 2 test files (`projection.test.ts`, `search-contract.test.ts`).

3. Engine TypeScript typecheck:
   - `pnpm -C packages/ecom-engine typecheck`
   - Exit: 0.
   - Result: 0 errors under strict `tsc --noEmit`.

4. Git scope containment:
   - `git diff --stat ea1401e37fbd3ab4ee9b2e79851b9d542762eb47..1d2e9152a99e71aa255149eadd21f993c25e5b76`
   - Result: Exactly 8 files modified/added, completely within claimed boundaries:
     - `packages/ecom-engine/src/search/` (7 files)
     - `docs/ecomos/evidence/ECO-302/report.md` (1 file)
   - Zero scope escape.

5. Architectural and Invariant Inspection:
   - **Commercial Source of Truth**: WooCommerce remains authoritative owner of products, variations, prices, and stock.
   - **Privacy Firewall**: Disallowed private keys (`customer`, `email`, `quote`, `rfq`, `token`, `cost`, `margin`) are enforced on both raw input and sanitized document output.
   - **Technical Identifier Protection**: SKUs and part codes are strictly exempt from fuzzy/typo mutation, ensuring buyers never receive erroneous mechanical/chemical items due to approximate matching.
