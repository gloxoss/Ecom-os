# ECO-101: Core Generic Domain Contracts Report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `7aeba6c9cd7312d8aa0140100ee915e21ee6095c`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `packages/ecom-engine/src/types.ts`, `packages/ecom-engine/src/interface.ts`, `packages/ecom-engine/src/fake-engine.ts`, `packages/ecom-engine/src/__tests__/contracts.test.ts`, `docs/ecomos/evidence/ECO-101/report.md`.
- Resources: `git-index`.
- Date: 2026-10-10.

## Implementation details

1. **Specified 10 core domain types in `@ecom-os/engine` (`packages/ecom-engine/src/types.ts`):**
   - `Product`: generic domain entity with `id`, `slug`, `name`, `sku`, `type` (`simple | variable | external | grouped`), `description`, `shortDescription`, canonical `price` (`Money`), optional `regularPrice` / `salePrice` / `priceRange`, `taxVisibility`, `inventory`, `images` (`Media[]`), `categories` (`string[]`), `categoryDetails` (`Category[]`), `brand` (`Brand | null`), `variations` (`Variation[]`), `attributes` (`ProductAttribute[]`), `technicalAttributes` (`TechnicalAttribute[]`), `documents` (`Document[]`), `relatedProducts` (`RelatedProductReference[]`), and review/rating metrics.
   - `Variation` (with `ProductVariant` backward compatibility alias): exact variation entity with `id`, `sku`, `name`, `slug`, canonical `price` (`Money`), optional `regularPrice` / `salePrice`, `inventory` (`InventoryAvailability`), `stock_quantity`, `attributes` (`VariationAttributeValue[]`), `image` (`Media`), and `isPurchasable`.
   - `Category`: hierarchical taxonomy entity with `id`, `slug`, `name`, `description`, `parentId`, `children`, `image`, and `count`.
   - `Brand`: neutral brand entity with `id`, `slug`, `name`, `description`, `logo` (`Media`), `websiteUrl`, and optional vendor-independent `isOwned` boolean (not hardcoded to any client/vendor).
   - `InventoryAvailability`: availability contract with `status` (`IN_STOCK | OUT_OF_STOCK | ON_BACKORDER`), `quantity`, `backordersAllowed`, `lowStockThreshold`, and `isPurchasable`.
   - `Money`: canonical integer minor units and ISO currency (`amount_minor: number`, `currency: string`).
   - `Media`: accessible image/media entity with `id`, `url`, `altText`, `title`, `width`, `height`.
   - `TaxVisibility`: tax display contract with `displayMode` (`INCLUSIVE | EXCLUSIVE`), `taxable`, `taxStatus`, `ratePercent`, and `label`.
   - `TechnicalAttribute`: neutral technical specifications with `name`, `label`, `value` (`string | string[]`), and optional `group`.
   - `Document`: optional downloadable document extension with `id`, `title`, `url`, `mimeType`, `sizeBytes`, and `type` (`manual | datasheet | certificate | safety | catalog | other`).

2. **Core Neutrality Invariant:**
   - Zero ParaLoca or medical vocabulary exists in `@ecom-os/engine`.
   - All domain contracts are generic and reusable across arbitrary e-commerce domains.
   - Private label / owned brand classification is an optional flag on `Brand`, not a hardwired concept.

3. **Interface & Engine Compatibility:**
   - `EcomEngine` interface updated to re-export all 10 domain types and provide optional `listBrands` and `getBrand` queries.
   - `FakeEngine` updated to implement new optional methods with neutral stubs.
   - Backward compatibility preserved for all existing consumers (`ProductVariant` alias, `variants` alias on `Product`, `stock_quantity` on `Variation`, string array `categories`).

4. **Testing and Verification Evidence:**
   - Dedicated test suite `packages/ecom-engine/src/__tests__/contracts.test.ts` added with 13 tests covering all 10 contracts, invariants, backward compatibility, and neutrality.
   - `pnpm test packages/ecom-engine/src/__tests__/contracts.test.ts`: PASS (13/13 tests).
   - `pnpm run verify`: PASS (16 test files, 125 tests, all 15 agent-hub test suites, lint, typecheck, import guard).
   - `pnpm run build`: PASS (CLI and Next.js storefront production build).

## Honest Boundaries

- `ECO-101` establishes the typed contracts and interfaces in `@ecom-os/engine`.
- Concrete WooCommerce GraphQL/REST mapping of these rich types, category tree resolution, and SKU/variation extraction is handled in `ECO-102`.
