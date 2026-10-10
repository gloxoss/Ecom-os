# ECO-202: Authoritative Cart Line Mutations and Store API Coupon Revalidation Report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `e59338a1c33d8a520c876639414e39128f80f41b`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `packages/engine-woocommerce/src/cart.ts`, `packages/engine-woocommerce/src/client.ts`, `packages/engine-woocommerce/src/__tests__/cart.test.ts`, `apps/storefront/src/features/cart/server/cart-actions.ts`, `apps/storefront/src/features/cart/server/coupon-actions.ts`, `docs/ecomos/evidence/ECO-202/report.md`.
- Resources: `git-index`.
- Date: 2026-10-10.

## Workflow and source of truth

1. **Cart Line Mutations & Removals:**
   - Shopper adjusts item quantity or deletes a line in the storefront cart UI.
   - The UI invokes server action `updateCartItemAction(itemKey, quantity)` or `removeCartItemAction(itemKey)`.
   - The server action reads the secure `ecom_cart_token` cookie and delegates to `WooCommerceEngine.updateCartItem(cartId, key, quantity)` or `WooCommerceEngine.removeCartItem(cartId, key)`.
   - The engine sends a `POST` request to WooCommerce Store API:
     - `/cart/update-item` with payload `{ key, quantity }`.
     - `/cart/remove-item` with payload `{ key }` (or when quantity <= 0).
   - If stock limit is exceeded, WooCommerce returns 400 with `woocommerce_rest_cart_item_stock_limit`, which the engine translates to a descriptive failure without corrupting local state.
   - The authoritative returned cart with updated lines and totals is returned and rendered.

2. **Authoritative Coupon Application & Revalidation:**
   - Shopper submits coupon code in the cart summary.
   - Server action `applyCouponAction(code, cartTotal)` or `removeCouponAction(code)` is invoked.
   - The engine sends `POST /cart/apply-coupon` or `POST /cart/remove-coupon` to WooCommerce Store API using the guest's `Cart-Token`.
   - WooCommerce validates coupon restrictions server-side (expiration, minimum spend, single-use, duplicate application, product/category rules).
   - The resulting discount is mapped directly to integer minor units without floating-point math.
   - If rejected by Store API, errors are mapped to domain categories: `expired`, `already_applied`, `min_order`, `invalid`.

3. **Session & Security Boundaries:**
   - All mutations remain scoped to the caller's opaque `Cart-Token`.
   - Zero client-calculated totals or discounts are trusted; Store API remains the sole authority for amounts, discounts, and inventory limits.

## Changed behavior and files

- `packages/engine-woocommerce/src/cart.ts`:
  - Implemented `applyCouponToStoreCart(cartToken, code)` and `removeCouponFromStoreCart(cartToken, code)`.
  - Re-used and verified `updateStoreCartItem(cartToken, key, quantity)` and `removeStoreCartItem(cartToken, key)`.
- `packages/engine-woocommerce/src/client.ts`:
  - Implemented `WooCommerceEngine.updateCartItem(cartId, key, quantity)`: redirects to removal when quantity <= 0; calls `updateStoreCartItem`.
  - Implemented `WooCommerceEngine.removeCartItem(cartId, key)`: calls `removeStoreCartItem`.
  - Implemented `WooCommerceEngine.applyCoupon(cartId, code, cartTotal)`: utilizes Store API `/cart/apply-coupon` with typed error categorization.
  - Implemented `WooCommerceEngine.removeCoupon(cartId, code)`: utilizes Store API `/cart/remove-coupon`.
- `apps/storefront/src/features/cart/server/cart-actions.ts`:
  - Implemented `updateCartItemAction(itemKey, quantity)` and `removeCartItemAction(itemKey)`.
- `apps/storefront/src/features/cart/server/coupon-actions.ts`:
  - Implemented `removeCouponAction(code)`.
- `packages/engine-woocommerce/src/__tests__/cart.test.ts`:
  - Added test suite for line item updates, removals, and stock-limit rejections.
  - Added test suite for authoritative coupon application, error mapping, and removals (20 total tests).

## Verification and test results

- **Cart Unit Tests:**
  - `pnpm test packages/engine-woocommerce/src/__tests__/cart.test.ts`: PASS (20 tests passed).
- **Workspace Verification:**
  - `pnpm run verify`: PASS (clean import guard, eslint across 11 packages, tsc typecheck across all workspace packages, unit tests, and hub tests).
- **Workspace Build:**
  - `pnpm run build`: PASS (CLI and Next.js 16.3.8 production compilation, 28 pages).

## Honest Boundaries

- `ECO-202` establishes authoritative line mutations and coupon handling on the active server-side cart.
- Checkout address capture, shipping rates selection, and tax updates are implemented in `ECO-203`.
- Order placement and Cash on Delivery duplicate submission prevention are handled in `ECO-204`.

