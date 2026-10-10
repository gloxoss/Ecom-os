# ECO-604 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `tooling-cleanup`, platform lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `7a0fcc7f5324b0445d212ef8c0f51c568029af11`.
- Base: `d697b587a8fef591d575fae829377aa9d1469e71`.
- Executor evidence: `docs/ecomos/evidence/ECO-604/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-604/verification.md`).

## Verdict

PASS for exemplar simple addon, disabled and enabled state contracts, route and slot gating, failure isolation, and semver compatibility checking at commit `7a0fcc7f5324b0445d212ef8c0f51c568029af11`.

## Executed verification commands

1. Addon integration and failure isolation suite:
   - `node ./node_modules/vitest/vitest.mjs run packages/ecom-engine/src/__tests__/addon-integration.test.ts`
   - Exit: 0.
   - Result: 3 passed in 4ms.
   - Verified:
     - On/off registration lifecycle toggles cleanly.
     - Unhandled exceptions during addon initialization are safely isolated without disrupting `engine.getCart` or `engine.listProducts`.
     - Incompatible API ranges throw controlled compatibility errors and leave the registry stable.

2. Storefront addon contract suite:
   - `node --import tsx --test apps/storefront/e2e/addon-contract.spec.ts`
   - Exit: 0.
   - Result: 2 passed in 17ms.
   - Verified:
     - Disabled state returns HTTP 404 (`ADDON_DISABLED`) from route guards, excludes capabilities from public projections, and suppresses UI slots.
     - Enabled state permits clean execution returning HTTP 200, exposes capabilities in public projections, and runs endpoint logic.

3. Static addon manifest generator gate:
   - `node --import tsx --test scripts/generate-addons.test.mjs`
   - Exit: 0.
   - Result: 5 passed in 116ms.

4. TypeScript compilation verification:
   - `node ./node_modules/typescript/bin/tsc -p packages/ecom-engine/tsconfig.json --noEmit` -> Exit: 0.
   - `node ./node_modules/typescript/bin/tsc -p apps/storefront/tsconfig.json --noEmit` -> Exit: 0.
   - `node ./node_modules/typescript/bin/tsc -p packages/themes/tsconfig.json --noEmit` -> Exit: 0.

5. Git scope containment:
   - Submitted commit `7a0fcc7f5324b0445d212ef8c0f51c568029af11` alters exactly 7 files:
     - `apps/storefront/e2e/addon-contract.spec.ts`
     - `docs/ecomos/evidence/ECO-604/contract.md`
     - `docs/ecomos/evidence/ECO-604/report.md`
     - `packages/ecom-engine/src/__tests__/addon-integration.test.ts`
     - `plugins/dummy-addon/index.ts`
     - `plugins/dummy-addon/manifest.ts`
     - `plugins/dummy-addon/package.json`
   - All files remain within the authorized scope claim. Zero files modified in protected paths.

## Invariant Assessment
- **WooCommerce Authority**: The exemplar addon does not intercept or mutate WooCommerce order totals, prices, or checkout processing.
- **Fail-Safe Isolation**: Faulty addon execution cannot crash host processes or prevent customers from placing core orders.
- **Off-State Invariant**: When disabled, all routes return 404 with zero background side-effects.
