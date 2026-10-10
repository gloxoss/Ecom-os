# ECO-201: Store API Cart-Token Evaluation & Server-Side Cart Adapter Report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `e59338a1c33d8a520c876639414e39128f80f41b`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `packages/engine-woocommerce/src/cart.ts`, `packages/engine-woocommerce/src/client.ts`, `packages/engine-woocommerce/src/mappers.ts`, `packages/engine-woocommerce/src/__tests__/cart.test.ts`, `apps/storefront/src/features/cart/server/cart-actions.ts`, `docs/ecomos/evidence/ECO-201/report.md`.
- Resources: `git-index`.
- Date: 2026-10-10.

## Implementation details

1. **Store API Cart-Token & Headless Session Evaluation:**
   - Evaluated WooCommerce Store API (`/wp-json/wc/store/v1`) guest session mechanics. Shopper sessions are maintained authoritatively by WooCommerce via the opaque `Cart-Token` response/request header.
   - Independent guest sessions receive distinct cart tokens and cannot access or mutate another guest's cart lines.
   - WooCommerce Store API maintains authoritative pricing, item totals, shipping calculation, taxes, and stock reservations. Client-supplied price overrides are rejected or ignored.
   - Evaluated gateway compatibility: Store API exposes configured, active gateways (e.g., native Cash on Delivery `cod`).

2. **Server-Side Store API Client Adapter (`packages/engine-woocommerce/src/cart.ts`):**
   - Implemented `getStoreApiUrl()`: resolves explicit `WC_STORE_API_URL` or dynamically derives endpoint from `WC_REST_URL` / `WC_GRAPHQL_URL` (defaulting to isolated staging endpoint `https://paraloca.local/wp-json/wc/store/v1`).
   - Implemented `storeApiFetch()`: handles HTTP request dispatching with `AbortSignal.timeout(30000)`, sends incoming `Cart-Token` header, parses returned `Cart-Token` and `Nonce` headers, rejects insecure HTTP in production, and throws explicit descriptive errors on non-2xx status codes.
   - Implemented `fetchStoreCart(cartToken?)`: retrieves cart and tokens.
   - Implemented `addItemToStoreCart(cartToken, { id, quantity })`: adds simple or variable items to cart.
   - Implemented `updateStoreCartItem(cartToken, key, quantity)` and `removeStoreCartItem(cartToken, key)`.

3. **Provider-Neutral Domain Mapping (`packages/engine-woocommerce/src/mappers.ts`):**
   - Implemented `mapStoreCartItem()` and `mapStoreCart()` converting WooCommerce Store API structures into `@ecom-os/engine` `Cart` and `CartItem` contracts.
   - Maps integer minor units for prices, subtotals, and totals without loss of precision or floating-point errors.
   - Maps exact `variantId` for variation line items while omitting undefined fields, satisfying `exactOptionalPropertyTypes: true`.

4. **Engine Client Integration (`packages/engine-woocommerce/src/client.ts`):**
   - Implemented `WooCommerceEngine.getCart(cartId)`: delegates to `fetchStoreCart()`.
   - Implemented `WooCommerceEngine.addToCart(cartId, input)`: parses target product or variation ID and dispatches to `addItemToStoreCart()`. Rejects invalid or non-numeric IDs cleanly.

5. **Server-Side BFF & Session Management (`apps/storefront/src/features/cart/server/cart-actions.ts`):**
   - Configured `ecom_cart_token` session cookie with `httpOnly: true`, `secure: true` in production, `sameSite: 'lax'`, and 30-day expiration.
   - Provided `getCartToken()` and `setCartTokenCookie()`.
   - Implemented `fetchCartAction()` and `addToCartAction()` server actions that interact with the engine and persist newly minted cart tokens to cookies.
   - Eliminates client-side authoritative cart state: browser UI renders server-confirmed cart data rather than computing its own totals.

6. **Testing and Verification Evidence:**
   - Dedicated unit test suite `packages/engine-woocommerce/src/__tests__/cart.test.ts` (14 tests):
     - Store API URL resolution (custom, REST derivation, GraphQL derivation, default).
     - Transport layer headers: Cart-Token transmission and response capture.
     - Error handling with descriptive messages on non-2xx responses.
     - Production HTTPS enforcement.
     - Domain cart mapping for simple products and variations.
     - Total and subtotal minor-unit mapping.
     - Engine client `getCart` and `addToCart` resolution and parameter validation.
     - Guest session isolation across distinct tokens.
   - Full workspace verification: `pnpm run verify`: PASS (22 test files, 191 unit tests, 15 agent-hub test suites, clean guard and lint).
   - Full workspace build: `pnpm run build`: PASS (CLI and Next.js 16.3.8 production compilation, 28 pages).

## Honest Boundaries

- `ECO-201` implements the server-side Store API adapter, Cart-Token session handling, and BFF server actions.
- Line quantity mutations, removals, and coupon validation are tested and hooked into UI components in `ECO-202`.
- End-to-end checkout and order placement flows are implemented in subsequent Phase 2 tasks (`ECO-203`, `ECO-204`).
