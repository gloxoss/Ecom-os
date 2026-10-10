# ECO-206: Owned Guest Order Status Access & Anti-Enumeration Report (Hardened)

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `bafaaeb518792d839b2d662b36c89f8956e54494`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope:
  - `packages/ecom-engine/src/interface.ts`
  - `packages/ecom-engine/src/fake-engine.ts`
  - `packages/engine-woocommerce/src/orders.ts`
  - `packages/engine-woocommerce/src/client.ts`
  - `apps/storefront/src/lib/commerce/order-access.ts`
  - `apps/storefront/src/app/api/orders/status/route.ts`
  - `apps/storefront/src/features/checkout/server/checkout-actions.ts`
  - `.env.example`
  - `apps/storefront/src/__tests__/security/order-access.test.ts`
  - `docs/ecomos/evidence/ECO-206/report.md`
- Resources: `git-index`.
- Date: 2026-10-10.

## Workflow and source of truth

1. **Elimination of Hardcoded Secrets & Fail-Closed Enforcement:**
   - Removed the insecure fallback secret literal (`paraloca-guest-order-access-secret-v1-production`) in `apps/storefront/src/lib/commerce/order-access.ts`.
   - Added `ORDER_ACCESS_SECRET` to `.env.example` under the security section.
   - Enforced `getOrderAccessSecret()`: if neither `ORDER_ACCESS_SECRET` nor `ECOM_OS_ENCRYPTION_KEY` is configured in production, token generation throws immediately and token verification fails closed.

2. **Grant Issuance at Checkout:**
   - Wired `createGuestOrderGrant({ orderId, orderKey, email })` into `submitCheckoutAction` in `apps/storefront/src/features/checkout/server/checkout-actions.ts`.
   - On successful order submission, the server mints an opaque HMAC-SHA256 grant token and returns `orderToken` to the guest buyer, providing genuine authorization to track the resulting order.

3. **Authoritative WooCommerce Order Status (No Fabricated Constants):**
   - Added `getGuestOrder(orderId, orderKey)` to `EcomEngine` interface, `FakeEngine`, and `WooCommerceEngine` (`getGuestOrderRest` in `packages/engine-woocommerce/src/orders.ts`).
   - The status endpoint (`/api/orders/status`) queries the backend engine for genuine order details matching `orderId` and `orderKey`.
   - Orders not found in WooCommerce return 404 Not Found.
   - For verified orders, the endpoint returns the real WooCommerce status (e.g. `processing`, `completed`) along with total and currency.
   - Crucially, the internal `orderKey` is never echoed back in the response body.

4. **Multi-Transport Token Ingestion & Email Challenge:**
   - `/api/orders/status` accepts the grant token from `Authorization: Bearer <token>`, `x-order-token` header, or URL parameter `token`.
   - Supports optional secondary verification via `challengeEmail` / `email` query param or `x-challenge-email` header.
   - Returns 403 Forbidden without disclosing order existence whenever tokens or emails do not match.
   - Sets strict `Cache-Control: private, no-store, max-age=0, must-revalidate` and `Pragma: no-cache` headers.

## Changed behavior and files

- `.env.example`:
  - Added `ORDER_ACCESS_SECRET` documentation and configuration.
- `packages/ecom-engine/src/interface.ts`:
  - Added optional `getGuestOrder?(orderId: string, orderKey: string): Promise<Order | null>` to `EcomEngine`.
- `packages/ecom-engine/src/fake-engine.ts`:
  - Implemented `getGuestOrder` returning simulated guest order status.
- `packages/engine-woocommerce/src/orders.ts` & `client.ts`:
  - Implemented `getGuestOrderRest` and `WooCommerceEngine.getGuestOrder` fetching authoritative order status via REST API while validating `order_key`.
- `apps/storefront/src/lib/commerce/order-access.ts`:
  - Removed fallback literal. Implemented fail-closed `getOrderAccessSecret()`.
- `apps/storefront/src/features/checkout/server/checkout-actions.ts`:
  - Integrated `createGuestOrderGrant` into `submitCheckoutAction` returning `orderToken`.
- `apps/storefront/src/app/api/orders/status/route.ts`:
  - Rewrote route to ingest tokens from headers or query, verify ownership with optional challenge email, read genuine engine status via `getGuestOrder`, and prevent echoing `orderKey`.
- `apps/storefront/src/__tests__/security/order-access.test.ts`:
  - Expanded test suite (15 tests) testing fail-closed secret requirements, grant issuance, signature verification, anti-enumeration defenses, header token ingestion, email challenges, and genuine engine status lookups with 404 handling.

## Verification and test results

- **Order Access Security Tests:**
  - `pnpm test apps/storefront/src/__tests__/security/order-access.test.ts`: PASS (15 tests).
- **Containment & Checkout Attempts Tests:**
  - `pnpm test packages/engine-woocommerce/src/__tests__/containment.test.ts`: PASS (28 tests).
  - `pnpm test packages/engine-woocommerce/src/__tests__/checkout-attempts.test.ts`: PASS (11 tests).
- **Workspace Verification & Type Check:**
  - `pnpm typecheck`: PASS (11 workspace packages clean).
  - `pnpm -C apps/storefront lint`: PASS (0 errors, 18 existing warnings).
  - `node --import tsx scripts/check-engine-imports.ts`: PASS (clean boundaries).

## Honest Boundaries

- `ECO-206` completes guest order status security by removing all hardcoded secret fallbacks, enforcing fail-closed token validation, issuing authentic grant tokens at checkout, and deriving status directly from WooCommerce order state.
- Unauthenticated guest access without matching HMAC signature returns 403 Forbidden without disclosing order existence.
