# ECO-206: Owned Guest Order Status Access & Anti-Enumeration Report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `74f58424eb8dd4388793aa8f6b3b5814b502e192`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `apps/storefront/src/lib/commerce/order-access.ts`, `apps/storefront/src/app/api/orders/status/route.ts`, `apps/storefront/src/__tests__/security/order-access.test.ts`, `docs/ecomos/evidence/ECO-206/report.md`.
- Resources: `git-index`.
- Date: 2026-10-10.

## Workflow and source of truth

1. **Opaque Expiring Guest Order Grants:**
   - Following successful order placement, the system issues a cryptographically authenticated grant token via `createGuestOrderGrant({ orderId, orderKey, email, ttlMs })`.
   - The token contains base64url-encoded JSON payload (`orderId`, `orderKey`, normalized `email`, `exp`) paired with an HMAC-SHA256 signature using the server's private secret.
   - Tokens expire after 7 days by default, preventing permanent unauthenticated link exposure.

2. **Strict Ownership Verification & Anti-Enumeration Defense:**
   - Any guest order status inquiry must provide the valid signed token matching the specific `orderId`.
   - Attacker attempts to guess numeric order IDs (`1051`, `1052`, etc.) fail immediately because the token's HMAC signature is strictly bound to the minted `orderId`.
   - Tampered tokens (modified payload or forged signature) are detected in constant time via `timingSafeEqual` and rejected.
   - Optional email challenge matching provides secondary identity verification where needed.

3. **Protected Order Status Route (`/api/orders/status`):**
   - Implemented `GET /api/orders/status?orderId=...&token=...`.
   - Missing arguments return 400 Bad Request with `Cache-Control: private, no-store`.
   - Unauthenticated or mismatched tokens return 403 Forbidden without disclosing order existence or customer details.
   - Authenticated requests return verified order ID, order key, and status under `Cache-Control: private, no-store, max-age=0, must-revalidate`.

## Changed behavior and files

- `apps/storefront/src/lib/commerce/order-access.ts`:
  - Implemented `createGuestOrderGrant`, `verifyGuestOrderGrant`, and `verifyOrderOwnership`.
  - Enforced constant-time HMAC-SHA256 signature validation and TTL expiration checks.
- `apps/storefront/src/app/api/orders/status/route.ts`:
  - Created protected status route enforcing verified ownership and private no-store headers.
- `apps/storefront/src/__tests__/security/order-access.test.ts`:
  - Created test suite (10 tests) verifying grant creation, signature validation, tampering rejection, expiration handling, anti-enumeration protection, and route security.

## Verification and test results

- **Order Access Security Tests:**
  - `pnpm test apps/storefront/src/__tests__/security/order-access.test.ts`: PASS (10 tests).
- **Workspace Unit Tests:**
  - `pnpm test`: PASS (26 test files, 232 unit tests).
- **TypeScript Check:**
  - `pnpm typecheck`: PASS (11 workspace packages clean).
- **Storefront Lint:**
  - `pnpm -C apps/storefront lint`: PASS (0 errors).

## Honest Boundaries

- `ECO-206` completes Phase 2 guest commerce security requirements by establishing opaque, expiring ownership proof for order lookup.
- Full merchant and administrative order handling remain isolated to staff roles.

