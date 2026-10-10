# ECO-602: Secure Server-Side Feature Registry and Typed Capability Projection

## Summary
Implemented the authoritative server-side feature registry (`AddonRegistry`) in `@ecom-os/engine`, shared capability projections, and storefront route guards (`guardAddonRoute`, `withAddonGuard`) in `apps/storefront`. Verified that disabled services return HTTP 404/403 and strictly execute zero side effects.

## Scope & Claimed Paths
- `packages/ecom-engine/src/` (including `addon-registry.ts`, `index.ts`, `__tests__/addon-registry.test.ts`)
- `apps/storefront/src/` (including `lib/addon-capabilities.ts`, `lib/addon-route-guard.ts`, `__tests__/security/addon-off.test.ts`)
- `plugins/wp-ecomos-operations/capabilities.php`
- `docs/ecomos/evidence/ECO-602/` (including `off-state-matrix.md`, `report.md`)

## Key Implementations & Invariants
1. **Authoritative Feature Registry (`packages/ecom-engine/src/addon-registry.ts`)**:
   - Manages registered addon manifests and their verified enabled/disabled state.
   - Enforces fail-closed defaults: all registered addons start disabled until explicitly configured and compatibility-checked.
   - Provides `guardService(serviceId, requiredCapability)` which evaluates backend authorization and returns 404 (for unknown/disabled services) or 403 (for missing capabilities).
   - Generates client-safe capability projections (`projectCapabilities`) that exclude internal server credentials.
2. **Storefront Route Guard & Side-Effect Barrier (`apps/storefront/src/lib/addon-route-guard.ts`)**:
   - Intercepts requests to addon routes and API endpoints.
   - Wraps route handlers with `withAddonGuard()`. When an addon is disabled, halts request execution with HTTP 404 without invoking database transactions or email dispatchers.
3. **Forged Request Rejection**:
   - Ignores client request headers or URL query parameter overrides attempting to spoof addon activation. Server consults only the authoritative registry.
4. **WordPress Backend Sync (`plugins/wp-ecomos-operations/capabilities.php`)**:
   - Extended `ecomos_is_addon_enabled()` to inspect the authoritative feature registry option `ecomos_active_addons`.

## Executed Verification Commands
1. **Engine Feature Registry Vitest Suite**:
   ```bash
   node ./node_modules/vitest/vitest.mjs run packages/ecom-engine/src/__tests__/addon-registry.test.ts
   ```
   Output: `8 passed (8), 100% PASS`
2. **Storefront Security & Off-State Vitest Suite**:
   ```bash
   node ./node_modules/vitest/vitest.mjs run apps/storefront/src/__tests__/security/addon-off.test.ts
   ```
   Output: `5 passed (5), 100% PASS`
3. **TypeScript Typecheck**:
   ```bash
   node ./node_modules/typescript/bin/tsc -p packages/ecom-engine/tsconfig.json --noEmit
   node ./node_modules/typescript/bin/tsc -p apps/storefront/tsconfig.json --noEmit
   ```
   Output: `0 errors across packages`
