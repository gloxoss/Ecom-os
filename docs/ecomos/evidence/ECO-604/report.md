# ECO-604: Exemplar Simple Addon and Failure Isolation Proof

## Summary
Created the exemplar simple addon (`plugins/dummy-addon`), integration test suite (`packages/ecom-engine/src/__tests__/addon-integration.test.ts`), and storefront contract suite (`apps/storefront/e2e/addon-contract.spec.ts`). Proven complete on/off state enforcement, route guarding, public capability projection gating, version mismatch rejection, and runtime failure isolation ensuring core WooCommerce commerce remains uncorrupted.

## Scope & Claimed Paths
- `plugins/dummy-addon/` (`manifest.ts`, `index.ts`, `package.json`)
- `packages/ecom-engine/src/__tests__/addon-integration.test.ts`
- `apps/storefront/e2e/addon-contract.spec.ts`
- `docs/ecomos/evidence/ECO-604/` (`contract.md`, `report.md`)

## Key Implementations & Invariants
1. **Manifest-Driven Exemplar (`plugins/dummy-addon`)**:
   - Implements typed `AddonManifest` with capability `dummy_banner`, config schema, public route `/api/dummy-ping`, UI header banner slot, and admin overview slot.
   - Lifecycle handlers `register()` and `disable()` operate idempotently with zero cart/order mutation authority.
2. **On/Off Contract & Route Gating (`apps/storefront/e2e/addon-contract.spec.ts`)**:
   - Disabled state: route guard blocks requests returning HTTP 404 (`ADDON_DISABLED`), capability projection omits `dummy_banner`, and feature toggle is `false`.
   - Enabled state: route guard permits execution returning HTTP 200, capability projection includes `dummy_banner`, and handler executes safely.
3. **Failure Isolation Invariant (`packages/ecom-engine/src/__tests__/addon-integration.test.ts`)**:
   - Simulated fatal exception during addon startup is caught and contained.
   - Core engine cart queries (`engine.getCart`) and catalog listings (`engine.listProducts`) remain 100% operational.
4. **API Version Compatibility Barrier**:
   - Out-of-range addon semver specifications (`^2.0.0` vs host `1.0.0`) are actively caught and rejected upon enablement attempt.

## Executed Verification Commands
```bash
node ./node_modules/vitest/vitest.mjs run packages/ecom-engine/src/__tests__/addon-integration.test.ts
node --import tsx --test apps/storefront/e2e/addon-contract.spec.ts
node --import tsx --test scripts/generate-addons.test.mjs
node ./node_modules/typescript/bin/tsc -p packages/ecom-engine/tsconfig.json --noEmit
node ./node_modules/typescript/bin/tsc -p apps/storefront/tsconfig.json --noEmit
```
Output:
```text
✓ packages/ecom-engine/src/__tests__/addon-integration.test.ts (3 tests) 4ms
▶ Storefront Addon Contract & Slot Gating
  ✔ guarantees disabled exemplar addon slots and routes are absent (15.5ms)
  ✔ enables exemplar addon slots and routes cleanly when activated (0.97ms)
✔ Storefront Addon Contract & Slot Gating (17.5ms)
✔ validateAllAddons successfully validates exemplar dummy-addon (0.9ms)
...
tsc packages/ecom-engine: 0 errors
tsc apps/storefront: 0 errors
```
