# ECO-103: Truthful Product-Query Contract, Pagination & Sorting Report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `d8055559ef0f5056cd2c6734566ab22a9969f25e`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `packages/ecom-engine/src/types.ts`, `packages/ecom-engine/src/interface.ts`, `packages/ecom-engine/src/__tests__/queries.test.ts`, `packages/engine-woocommerce/src/products.ts`, `packages/engine-woocommerce/src/client.ts`, `packages/engine-woocommerce/src/__tests__/queries.test.ts`, `docs/ecomos/evidence/ECO-103/report.md`.
- Resources: `git-index`.
- Date: 2026-10-10.

## Implementation details

1. **Product Query Contract & Truthful Validation (`packages/ecom-engine/src/types.ts` & `interface.ts`):**
   - Specified `PageInfo` contract: `{ hasNextPage: boolean; hasPreviousPage: boolean; startCursor?: string | null; endCursor?: string | null; }`.
   - Specified `ProductSort` union: `'price_asc' | 'price_desc' | 'newest' | 'title_asc' | 'title_desc'`.
   - Expanded `ProductListQuery`: includes `category`, `brand`, `search`, `limit`, `offset`, `cursor`, `minPrice`, `maxPrice`, `sort`, `featured`, `onSale`, `locale`, and `inStockOnly`.
   - Updated `ProductListResult`: includes `items: Product[]`, `total: number`, and optional `pageInfo?: PageInfo`.
   - Implemented `validateProductQuery(query)`:
     - Disallows conflicting pagination strategies (cursor + offset ambiguity).
     - Rejects negative limit, non-integer limit, and limits exceeding maximum bounds (100 items per page).
     - Rejects negative offset, negative minPrice, negative maxPrice.
     - Rejects minPrice exceeding maxPrice.
     - Rejects empty whitespace cursor strings.
   - Preserves exact optional property conventions (`exactOptionalPropertyTypes: true`).

2. **WooCommerce Query Forwarding & Sorting (`packages/engine-woocommerce/src/products.ts` & `client.ts`):**
   - Implemented `mapSortToOrderby(sort?: ProductSort)` to map high-level sort options to WPGraphQL `ProductsOrderbyInput` arrays (`PRICE` ASC/DESC, `DATE` DESC, `NAME` ASC/DESC).
   - Expanded `fetchProducts` GraphQL query to accept `$orderby`, `$stockStatus`, and `$offset` alongside `$first`, `$after`, `$minPrice`, `$maxPrice`, `$category`, and `$search`.
   - Returns both `nodes` and GraphQL `pageInfo` (`hasNextPage`, `hasPreviousPage`, `startCursor`, `endCursor`).
   - In `WooCommerceEngine.listProducts`:
     - Executes `validateProductQuery` and throws descriptive errors on invalid inputs.
     - Maps GraphQL `pageInfo` into the domain `PageInfo` contract.
     - Avoids N+1 calls: retrieves products with variations, category details, and gallery images in a single comprehensive GraphQL query.
     - Preserves cache isolation: GraphQL catalog queries use public Next.js caching (`revalidate: 60`, `tags: ['wc-products']`) and do not attach customer bearer tokens or cart credentials.

3. **Testing and Verification Evidence:**
   - Contract validation unit tests (`packages/ecom-engine/src/__tests__/queries.test.ts`): 10 passed tests verifying valid query acceptance, cursor/offset conflict rejection, limit and price bound checks, and type shape conformance.
   - WooCommerce query tests (`packages/engine-woocommerce/src/__tests__/queries.test.ts`): 7 passed tests verifying WPGraphQL orderby mapping, GraphQL client variable binding, stock status filter, invalid query rejection, and N+1 query avoidance (single request for catalog items).
   - Workspace verification (`pnpm run verify`): PASS (19 test files, 155 unit tests, 15 agent-hub tests, import guard, ESLint, TypeScript check).
   - Workspace production build (`pnpm run build`): PASS (CLI package build and Next.js 16.3.8 production build completed).

## Honest Boundaries

- `ECO-103` implements and verifies the product query contract, validation rules, WPGraphQL sorting, pagination cursors, and cache partitioning.
- Reusable UI catalog components (PLP, PDP, category views) consuming this query contract are implemented in `ECO-104`.
- Native brand taxonomy integration is handled in `ECO-105`.
