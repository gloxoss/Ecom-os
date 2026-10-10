# ECO-203 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `commerce-cleanup`, commerce lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `0e9960ddf98019ec70fb9f6939c125038aa9e6b0`.
- Base: `fca6556e5bb0d8c6d9bb7907b7f91aab1719d7aa`.
- Executor evidence: `docs/ecomos/evidence/ECO-203/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-203/verification.md`).

## Verdict

PASS for customer details and address validation, destination-quoted WooCommerce Store API shipping rates, tax calculations, and rate selection at commit `0e9960ddf98019ec70fb9f6939c125038aa9e6b0`.

## Executed verification commands

1. Checkout quote and destination unit tests:
   - `pnpm test packages/engine-woocommerce/src/__tests__/checkout-quote.test.ts`
   - Exit: 0.
   - Result: 6 passed in 1 file. Verified shipping package extraction with minor-unit price and currency mapping, customer destination update through Store API `/cart/update-customer`, shipping rate selection via `/cart/select-shipping-rate`, zero-fee vs unavailable delivery differentiation, and error handling on unsupported destinations.

2. Full workspace verification:
   - `pnpm run verify`
   - Exit: 0.
   - Result: PASS. Clean import boundary guards, ESLint (0 errors across 11 packages), TypeScript typecheck across all workspace packages, 23 test files / 203 unit tests, and 16 agent-hub test suites passed.

3. Code and contract inspection:
   - Verified that `updateStoreCustomer` and `selectStoreShippingRate` query WooCommerce Store API with the shopper's `Cart-Token` and do not calculate fees or taxes client-side.
   - Verified that `apps/storefront/src/features/checkout/model/address-schema.ts` strictly validates allowed country codes (`MA`, `FR`) and country-specific postal/phone formats before backend calls.
   - Verified that `apps/storefront/src/features/checkout/server/checkout-actions.ts` methods are scoped to the httpOnly `Cart-Token` cookie.
