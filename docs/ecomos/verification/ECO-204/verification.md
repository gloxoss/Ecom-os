# ECO-204 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `commerce-cleanup`, commerce lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `27a698e64693761a27f6022919eafc1b87e9d7dd`.
- Base: `0f7870e3cdd95404aa4540c84284e8f3745a7654`.
- Executor evidence: `docs/ecomos/evidence/ECO-204/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-204/verification.md`).

## Verdict

PASS for authoritative Cash on Delivery checkout, Store API order placement, duplicate-submit protection, and idempotency recovery at commit `27a698e64693761a27f6022919eafc1b87e9d7dd`.

## Executed verification commands

1. Checkout attempts and idempotency unit tests:
   - `pnpm test packages/engine-woocommerce/src/__tests__/checkout-attempts.test.ts`
   - Exit: 0.
   - Result: 11 passed in 1 file. Verified initial pending attempt creation, concurrent submission conflict rejection, idempotent replay of previously confirmed orders without re-dispatching to upstream Store API, failed attempt retry recovery, and TTL expiration sweep.

2. Full workspace verification:
   - `pnpm run verify`
   - Exit: 0.
   - Result: PASS. Clean import boundary guards, ESLint (0 errors across 11 packages), TypeScript typecheck across all workspace packages, 24 test files / 214 unit tests, and 16 agent-hub test suites passed.

3. Code and contract inspection:
   - Verified that `submitStoreCheckout` dispatches `POST /checkout` to WooCommerce Store API using the caller's session `Cart-Token`, extracting canonical `order_id`, `order_key`, and `status`.
   - Verified that guest customer ID is confirmed as 0 without customer account creation.
   - Verified that `apps/storefront/src/features/checkout/server/checkout-actions.ts` invokes `clearCartCookie()` strictly after server-confirmed order creation.
