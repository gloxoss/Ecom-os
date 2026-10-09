# ECO-008: WooCommerce staging operations and backend smoke proof report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `21d844a31b034338e335cfe55b4afb936b20b989`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `scripts/probe-woocommerce.ts`, `scripts/smoke-local-woocommerce.ts`, `scripts/verify-local-order.php`, `docs/ecomos/STAGING_SETUP.md`, `docs/ecomos/staging-preflight.json`, `docs/ecomos/store-api-smoke.json`, `docs/ecomos/evidence/ECO-008`.
- Resources: `git-index`.
- Date: 2026-10-09.

## Verified backend commerce integration

1. **Staging capability and version verification:**
   - Isolated staging environment verified at `https://paraloca.local`.
   - WordPress 7.1.3, PHP 8.2.29, WooCommerce 11.2.1, WPGraphQL 2.23.1, WPGraphQL WooCommerce 1.0.3 (`staging-preflight.json`).
   - Store API products, cart endpoints, and GraphQL respond with HTTP 200.
   - Read-only connector security verified: customer order reads return 403, settings write operations return 401/403.

2. **Store API cart and guest COD smoke:**
   - `scripts/smoke-local-woocommerce.ts` executed against staging:
     - Verified independent guest carts with token isolation.
     - Verified rejection of invalid cart tokens and quantities exceeding stock.
     - Verified client-supplied price manipulation (`price: '0.01'`) is ignored; backend price remains authoritative.
     - Verified exact variation handling (`ECOMOS-TEST-VARIATION-STANDARD`, #14) alongside simple product (#12).
     - Verified Morocco shipping zone calculation (25.00 MAD) and synthetic tax.
     - Verified guest order creation (#15, status `processing`, total `202.84 MAD`).
     - Verified sequential retry idempotency: retry returns 409 conflict, independent CRUD confirms customer ID 0 and exactly 1 order created.

3. **Honest boundaries:**
   - Proves backend Store API integration feasibility and commerce authority.
   - Frontend storefront checkout UI remains disabled and unverified (`frontendCheckoutVerified: false`); full headless browser checkout belongs to Phase 2 (`ECO-201`–`ECO-206`).
