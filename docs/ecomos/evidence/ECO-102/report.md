# ECO-102: WooCommerce Catalog, Category Mapping, Variations, Gallery & Errors Report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `cb803320f704dba1c409020c87c4808406939a3f`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `packages/engine-woocommerce/src/products.ts`, `packages/engine-woocommerce/src/mappers.ts`, `packages/engine-woocommerce/src/client.ts`, `packages/engine-woocommerce/src/__tests__/mapping.test.ts`, `docs/ecomos/evidence/ECO-102/report.md`.
- Resources: `git-index`.
- Date: 2026-10-10.

## Implementation details

1. **Explicit Errors Replacing Silent Data Swallowing (`packages/engine-woocommerce/src/products.ts`):**
   - In `fetchProducts`: Replaced `catch { return []; }` with explicit error propagation: `throw new Error(\`Failed to fetch products from WooCommerce: ...\`)`. Also throws if GraphQL response payload is empty or invalid.
   - In `fetchCategories`: Replaced `catch { return []; }` with explicit error propagation: `throw new Error(\`Failed to fetch categories from WooCommerce: ...\`)`.
   - In `fetchProductBySlug`: Validates that slug is provided, and replaced `catch { return null; }` with explicit error propagation: `throw new Error(\`Failed to fetch product '\${slug}' from WooCommerce: ...\`)`.
   - GraphQL queries expanded with pagination parameters (`$first`, `$after`), filtering (`category`, `search`, `minPrice`, `maxPrice`), and rich fields (`sku`, `galleryImages`, `productCategories`, `variations`, `attributes`, `stockStatus`, `stockQuantity`, `related`).

2. **Domain-Compliant Mappers (`packages/engine-woocommerce/src/mappers.ts`):**
   - `mapStockStatus`: Normalizes status strings (`IN_STOCK`, `INSTOCK`, `ON_BACKORDER`, `ONBACKORDER`, `OUT_OF_STOCK`) to canonical `StockStatus` union.
   - `mapInventory`: Produces complete `InventoryAvailability` contract with `quantity`, `backordersAllowed`, and boolean `isPurchasable`.
   - `mapImages`: Merges primary product image with `galleryImages`, deduping by URL and preserving accessible `altText` and `title`.
   - `mapVariations`: Maps WooCommerce product variations into `@ecom-os/engine` `Variation` objects, including `sku`, parsed integer money, attribute key-values, variation images, inventory, and stock quantity.
   - `mapCategory`: Maps raw WooCommerce categories to canonical `Category` objects, properly resolving parent database IDs and image/count metadata.
   - `buildCategoryTree`: Hierarchical category tree builder that links children categories to their parent nodes while keeping flat list lookup intact.
   - `mapProduct`: Produces fully-populated generic `Product` instances with resolved `ProductType` (`simple`, `variable`, `external`, `grouped`), `priceRange` computed for variable items, SKU, short description, category details, variations, and related products.
   - Designed to cleanly satisfy TypeScript `exactOptionalPropertyTypes: true` by conditionally setting optional properties rather than assigning `undefined`.

3. **WooCommerce Engine Client Wiring (`packages/engine-woocommerce/src/client.ts`):**
   - `listProducts`: Passes query options (`category`, `minPrice`, `maxPrice`, `search`, `limit`, `cursor`/`after`) to `fetchProducts`, and maps nodes using `mapProduct`.
   - `getProduct`: Fetches product by slug using `fetchProductBySlug`, maps the result, and returns `Product | null`.
   - `listCategories`: Fetches raw categories via `fetchCategories`, maps each to canonical `Category`, and returns the hierarchical category tree built via `buildCategoryTree`.

4. **Testing and Verification Evidence:**
   - Unit test suite `packages/engine-woocommerce/src/__tests__/mapping.test.ts` (13 tests):
     - `mapStockStatus` correctly handles IN_STOCK, ON_BACKORDER, and OUT_OF_STOCK variants.
     - `mapInventory` maps stock quantities and sets `isPurchasable` appropriately.
     - `mapImages` combines featured and gallery images with URL deduplication and alt text preservation.
     - `mapVariations` maps attributes, parsed money, SKU, inventory, and variation image.
     - `buildCategoryTree` nests child categories under their parent categories.
     - `mapProduct` sets variable type, calculates price ranges, maps category details, and handles simple products.
     - `fetchProducts`, `fetchCategories`, and `fetchProductBySlug` throw explicit descriptive errors on GraphQL or network failures instead of returning empty results.
   - Decisive checks:
     - `pnpm test packages/engine-woocommerce/src/__tests__/mapping.test.ts`: PASS (13/13 tests passing in 20ms).
     - `pnpm run verify`: PASS (17 test files, 138 unit tests, 15 agent-hub tests, import guard, ESLint, TypeScript check).
     - `pnpm run build`: PASS (CLI and Next.js storefront production build completed).

## Honest Boundaries

- `ECO-102` implements the core WooCommerce catalog query and mapping logic in `@ecom-os/engine-woocommerce`.
- Public caching and search synchronization across storefront queries are handled in subsequent Phase 1 tasks (`ECO-103`).
