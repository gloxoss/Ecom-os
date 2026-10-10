# ECO-105: Native WooCommerce Brand Capability & Projection Report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `10db9f35e6cb31ed7fc04c389e5f8315199caec0`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `packages/engine-woocommerce/src/brands.ts`, `packages/engine-woocommerce/src/mappers.ts`, `packages/engine-woocommerce/src/client.ts`, `packages/engine-woocommerce/src/products.ts`, `packages/engine-woocommerce/src/__tests__/brands.test.ts`, `docs/ecomos/evidence/ECO-105/report.md`.
- Resources: `git-index`.
- Date: 2026-10-10.

## Implementation details

1. **Native Brand Capability Detection (`packages/engine-woocommerce/src/brands.ts`):**
   - Implemented `checkBrandsCapability()`: detects whether the WooCommerce installation supports native `product_brand` taxonomy via WPGraphQL (`productBrands`) with fallback to REST API (`/wp-json/wc/v3/products/brands`).
   - Differentiates unsupported capability (`supported: false`, with explicit descriptive reason) from an empty brand catalog (`supported: true, items: []`).
   - Avoids false caching on transient network failures. Provides `resetBrandsCapabilityCache()` for testing lifecycle.
   - Implemented `fetchBrands(options)` and `fetchBrandBySlug(slug)`: returns mapped `WCBrand[]` or `WCBrand | null`, safely handling GraphQL/REST routing and throwing explicit errors on unexpected failure.

2. **Provider-Neutral Brand Mapping (`packages/engine-woocommerce/src/mappers.ts`):**
   - Implemented `mapBrand(raw: WCBrand): Brand` to produce `@ecom-os/engine` `Brand` instances.
   - Preserves `id`, `slug`, `name`, optional `description`, optional `websiteUrl`, and `logo` (`Media`).
   - Supports optional `isOwned?: boolean` without hardcoding any platform or client name (e.g. ParaLoca).
   - In `mapProduct`: maps primary brand term from `productBrands` or `brands` onto `product.brand`. Leaves unbranded products with `brand: undefined`.

3. **Engine Integration (`packages/engine-woocommerce/src/client.ts`):**
   - Implemented `listBrands(locale?: Locale): Promise<Brand[]>`: queries raw brands via `fetchBrands()` and maps to domain `Brand[]`.
   - Implemented `getBrand(slug: string, locale?: Locale): Promise<Brand | null>`: queries raw brand via `fetchBrandBySlug(slug)` and maps to domain `Brand | null`.

4. **Testing and Verification Evidence:**
   - Dedicated unit test suite `packages/engine-woocommerce/src/__tests__/brands.test.ts` (11 tests):
     - GraphQL capability detection probe.
     - REST capability detection probe fallback.
     - Unsupported backend error handling with descriptive reason.
     - Distinction between unsupported capability and empty catalog.
     - Neutral `Brand` contract mapping (slug, name, logo, description, websiteUrl, isOwned).
     - Product mapping with primary brand projection.
     - Engine client `listBrands` and `getBrand` resolution and null handling.
   - Full workspace verification: `pnpm run verify`: PASS (20 test files, 166 unit tests, 15 agent-hub tests, import guard, ESLint, TypeScript check).
   - Full workspace build: `pnpm run build`: PASS (CLI and Next.js 16.3.8 production build completed).

## Honest Boundaries

- `ECO-105` implements capability detection, fetching, and neutral domain mapping for WooCommerce brands.
- UI components consuming brand data (such as brand landing panels or PDP brand stories) are integrated in `ECO-104` and Phase 4/Phase 8 client profiles.
