# ECO-204: End-to-End COD Checkout, Order Creation & Duplicate-Submit Protection Report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `0f7870e3cdd95404aa4540c84284e8f3745a7654`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `packages/engine-woocommerce/src/checkout.ts`, `packages/engine-woocommerce/src/checkout-attempts.ts`, `packages/engine-woocommerce/src/client.ts`, `packages/engine-woocommerce/src/__tests__/checkout-attempts.test.ts`, `apps/storefront/src/features/checkout/server/checkout-actions.ts`, `docs/ecomos/evidence/ECO-204/report.md`.
- Resources: `git-index`.
- Date: 2026-10-10.

## Workflow and source of truth

1. **Idempotency & Attempt Tracking:**
   - Shopper submits the checkout order form with Cash on Delivery selected.
   - An idempotency `attemptKey` is generated from the session `Cart-Token`, customer email, and address.
   - `CheckoutAttemptManager` registers the attempt:
     - New submission: marked as `PENDING`.
     - Concurrent request while in-flight: rejected with conflict error, preventing race-condition double orders.
     - Replay of previously `CONFIRMED` attempt: returns the confirmed order details without contacting upstream Store API.
     - Recoverable failure: a previously `FAILED` attempt resets to `PENDING` to permit retry.

2. **Authoritative WooCommerce Store API Order Placement:**
   - `submitStoreCheckout` sends `POST /checkout` to WooCommerce Store API (`/wp-json/wc/store/v1/checkout`) with the shopper's `Cart-Token`, billing/shipping addresses, and `payment_method: 'cod'`.
   - WooCommerce validates inventory, recalculates taxes and totals authoritatively, and creates the order in the database.
   - Order response contains the canonical `order_id`, `order_key`, `status: 'processing'` (or 'pending'/'on-hold'), and `customer_id: 0` (guest).
   - No WordPress/WooCommerce customer account is registered; guest independence is maintained.

3. **Session Lifecycle & Post-Checkout Cleanup:**
   - Only upon confirmed backend order creation does `submitCheckoutAction` clear the `ecom_cart_token` session cookie via `clearCartCookie()`.
   - The returned receipt information includes authoritative order number, key, and status for confirmation rendering.

## Changed behavior and files

- `packages/engine-woocommerce/src/checkout-attempts.ts`:
  - Created `CheckoutAttemptManager` implementing in-memory durable attempt tracking (`PENDING`, `CONFIRMED`, `FAILED`) with TTL expiration sweep.
  - Exported singleton `globalAttemptManager`.
- `packages/engine-woocommerce/src/checkout.ts`:
  - Implemented `submitStoreCheckout` dispatching Store API `/checkout` with typed parameters.
  - Implemented `executeIdempotentCheckout` coordinating attempt tracking with Store API dispatch.
- `packages/engine-woocommerce/src/client.ts`:
  - Implemented `WooCommerceEngine.submitCheckout(cartId, input, attemptKey)`.
- `apps/storefront/src/features/checkout/server/checkout-actions.ts`:
  - Implemented `submitCheckoutAction` with address validation, attempt key scoping, and post-order cookie clearance.
- `packages/engine-woocommerce/src/__tests__/checkout-attempts.test.ts`:
  - Created test suite (11 tests) verifying attempt state machine, duplicate submission idempotency, concurrent request rejection, failure recovery, and engine client integration.

## Verification and test results

- **Checkout Attempts & COD Tests:**
  - `pnpm test packages/engine-woocommerce/src/__tests__/checkout-attempts.test.ts`: PASS (11 tests).
- **Workspace Unit Tests:**
  - `pnpm test`: PASS (24 test files, 214 unit tests).
- **TypeScript Check:**
  - `pnpm typecheck`: PASS (11 workspace packages clean).
- **Storefront Lint:**
  - `pnpm -C apps/storefront lint`: PASS (0 errors).

## Honest Boundaries

- `ECO-204` establishes authoritative COD checkout, duplicate submit prevention, and server-confirmed order creation.
- Payment gateway adapter contracts and webhook handling are implemented in `ECO-205`.
- Guest order status lookup and token ownership verification are implemented in `ECO-206`.

