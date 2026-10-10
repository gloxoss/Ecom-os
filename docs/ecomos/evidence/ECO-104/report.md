# ECO-104: Reusable Data-Driven Catalog Shopping Components Report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `de226d80db70c1ca39ffb0a4407d0a1c99d816f1`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `apps/storefront/src/features/product/model/purchase-intent.ts`, `apps/storefront/src/features/product/model/purchase-intent.test.ts`, `apps/storefront/src/features/product/ui/variation-selector.tsx`, `apps/storefront/src/features/product/ui/add-to-cart-button.tsx`, `apps/storefront/src/features/product/ui/product-hero.tsx`, `apps/storefront/src/features/catalog/ui/product-card.tsx`, `docs/ecomos/evidence/ECO-104/report.md`.
- Resources: `git-index`.
- Date: 2026-10-10.

## Implementation details

1. **Exact Purchase Intent Domain Model (`apps/storefront/src/features/product/model/purchase-intent.ts`):**
   - Implemented `resolvePurchaseIntent(product, selectedAttributes, quantity)`: validates selection completeness, quantity constraints, variation existence, inventory stock status, and purchasability.
   - Distinct failure states: `INCOMPLETE_SELECTION`, `OUT_OF_STOCK`, `NOT_PURCHASABLE`, `INVALID_VARIATION`, `INVALID_QUANTITY`, `PRODUCT_UNAVAILABLE`.
   - Generates exact `PurchaseIntent` containing `productId`, `variationId`, matched `sku`, `quantity`, unit `Money`, and chosen attributes.
   - Provides `findMatchingVariation()` and `getRequiredAttributeNames()` helper utilities.

2. **Accessible Variation Selector (`apps/storefront/src/features/product/ui/variation-selector.tsx`):**
   - Implemented `VariationSelector` component adhering to WAI-ARIA standards (`role="radiogroup"`, `role="radio"`, `aria-checked`, `aria-labelledby`).
   - Dynamically extracts option groups from both product attributes and variations (`extractAttributeGroups`).
   - Implemented combination availability checking (`isCombinationAvailable`) to disable out-of-stock or invalid attribute permutations with strikethrough styling and `disabled` attributes.

3. **Accurate Stock-Aware Add to Cart Button (`apps/storefront/src/features/product/ui/add-to-cart-button.tsx`):**
   - Computes purchase intent state synchronously; updates button label to "Select options", "Out of stock", "Unavailable", or "Add to bag".
   - Accessible feedback on incomplete selections and error messages via `role="alert"`.
   - Prevents invalid or out-of-stock items from dispatching cart additions.

4. **PDP Hero Integration (`apps/storefront/src/features/product/ui/product-hero.tsx`):**
   - Integrates variation selection state, updating active image, SKU, price display, and stock badges dynamically.
   - For variable products without selection, displays full price range (`$min – $max`) using `product.priceRange`.
   - Highlights brand metadata cleanly when present.

5. **Data-Driven Catalog Product Card (`apps/storefront/src/features/catalog/ui/product-card.tsx`):**
   - Accurately renders price ranges for variable products (`min – max`).
   - Displays clear "Out of stock" overlay badge when inventory status is `OUT_OF_STOCK`.
   - Renders optional brand label above product title without tight coupling.

6. **Testing and Verification Evidence:**
   - Dedicated unit test suite `apps/storefront/src/features/product/model/purchase-intent.test.ts` (11 tests):
     - Resolving simple products in stock.
     - Rejecting out of stock simple products and insufficient quantities.
     - Detecting incomplete variable selections.
     - Matching exact variations with SKU and price overrides.
     - Rejecting invalid attribute combinations and unpurchasable variations.
     - Enforcing minimum positive integer quantities.
   - Full workspace verification: `pnpm run verify`: PASS (21 test files, 177 unit tests, 15 agent-hub tests, import guard, ESLint, TypeScript check).
   - Full workspace build: `pnpm run build`: PASS (CLI and Next.js 16.3.8 production build completed).

## Honest Boundaries

- `ECO-104` provides client shopping components with exact variation resolution, stock awareness, and accessibility.
- Cart and checkout session synchronization with WooCommerce Store API endpoints is handled in Phase 2 (`ECO-201`, `ECO-202`).
