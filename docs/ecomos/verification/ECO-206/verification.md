# ECO-206 independent verification (Hardened)

## Identity and scope

- Date: 2026-10-10.
- Executor: `commerce-cleanup`, commerce lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `ca188cd13618443025ac8a9dab3caf8586f5ec98`.
- Base: `bafaaeb518792d839b2d662b36c89f8956e54494`.
- Executor evidence: `docs/ecomos/evidence/ECO-206/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-206/verification.md`).

## Verdict

PASS for hardened guest order status access, token issuance at checkout, fail-closed secret configuration, genuine WooCommerce order read, anti-enumeration defense, and safe response redaction at commit `ca188cd13618443025ac8a9dab3caf8586f5ec98`.

## Executed verification commands

1. Hardened order access security tests:
   - `pnpm test apps/storefront/src/__tests__/security/order-access.test.ts`
   - Exit: 0.
   - Result: 15 passed in 1 file. Verified:
     - Configured secret usage and fail-closed rejection in production when `ORDER_ACCESS_SECRET` is unset.
     - Opaque grant creation, HMAC signature verification, tampering detection, and expiration handling.
     - Strict anti-enumeration rejection preventing numeric order ID guessing.
     - Optional email challenge verification (`challengeEmail`) rejecting mismatches.
     - Multi-transport token ingestion (`Authorization: Bearer <token>`, `x-order-token` header, and `token` query param).
     - Response security: `orderKey` is strictly omitted from the API response to prevent credential leakage.
     - Genuine WooCommerce order status querying via engine `getGuestOrder` returning live status (`processing`, `completed`) with total amounts and currency.
     - Correct 404 Not Found handling for unconfirmed or mismatched backend orders.

2. Containment and checkout tests:
   - `pnpm test packages/engine-woocommerce/src/__tests__/containment.test.ts`
   - Exit: 0.
   - Result: 28 passed in 1 file. Customer account containment preserved.
   - `pnpm test packages/engine-woocommerce/src/__tests__/checkout-attempts.test.ts`
   - Exit: 0.
   - Result: 11 passed in 1 file. Checkout idempotency preserved.

3. Type check & Linting:
   - `pnpm typecheck`
   - Exit: 0.
   - Result: Clean across all 11 workspace packages.
   - `pnpm -C apps/storefront lint`
   - Exit: 0.
   - Result: 0 errors.

4. Architectural and security inspection:
   - Confirmed elimination of hardcoded fallback literal `paraloca-guest-order-access-secret-v1-production`.
   - Confirmed `ORDER_ACCESS_SECRET` added to `.env.example`.
   - Confirmed `createGuestOrderGrant` is directly wired into `submitCheckoutAction` returning `orderToken`.
   - Confirmed `/api/orders/status` queries `engine.getGuestOrder(...)` to fetch real order status from WooCommerce rather than returning a fabricated constant.
