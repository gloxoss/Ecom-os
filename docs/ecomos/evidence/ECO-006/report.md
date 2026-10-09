# ECO-006: runtime configuration and commerce fail-closed report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `3ec04e5b1c0096737723f7969c976d8522cecf3a`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `apps/storefront/src/lib/runtime-config.ts`, `apps/storefront/src/lib/engine.ts`, `apps/storefront/src/__tests__/security/runtime-config.test.ts`, `packages/engine-woocommerce/src/orders.ts`, `docs/ecomos/evidence/ECO-006`.
- Resources: `git-index`.
- Date: 2026-10-09.

## Verified implementation

1. **Fail-closed production runtime configuration:**
   - `validateRuntimeConfig()` strictly enforces required production variables:
     - `ECOM_ENGINE=woocommerce` (throws if missing or set to `fake`/`vendure`).
     - `WC_REST_URL` and `WC_GRAPHQL_URL` must use `https:` protocol and cannot contain embedded credentials.
     - `WC_REST_KEY` and `WC_REST_SECRET` must be non-empty strings.
     - `REVALIDATE_SECRET` and `SESSION_COOKIE_SECRET` must contain at least 32 characters.
     - `ECOM_OS_ENCRYPTION_KEY` must decode to a 32-byte buffer with valid base64 encoding.

2. **No FakeEngine fallback in production:**
   - In `apps/storefront/src/lib/engine.ts`, `getEngine()` invokes `validateRuntimeConfig()`.
   - Explicitly rejects returning any `FakeEngine` instance when `NODE_ENV === 'production'`.

3. **Commerce containment in WooCommerce adapter:**
   - `packages/engine-woocommerce/src/orders.ts` rejects unauthenticated or legacy REST checkout requests and zone-0 shipping estimation.
   - Core checkout remains safely guarded until Phase 2 Store API integration.

## Executed checks

- `pnpm exec vitest run apps/storefront/src/__tests__/security/runtime-config.test.ts` -> PASS (12/12 tests).
- `pnpm --filter storefront typecheck` -> PASS (exit 0).
- `pnpm --filter @ecom-os/engine-woocommerce typecheck` -> PASS (exit 0).
- `git diff --check` -> PASS (exit 0).
