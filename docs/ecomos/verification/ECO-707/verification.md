# ECO-707 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `tooling-cleanup`, platform lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `7045f63683e04108d5ff8e1fb35db0f3570cbcb5`.
- Base: `6389deec4e07736bfe1998c55aa0580dcaa4f42b`.
- Executor evidence: `docs/ecomos/evidence/ECO-707/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-707/verification.md`).

## Verdict

PASS for complete RFQ disabled state isolation across routes, capabilities, notifications, order conversion, and cart independence at commit `7045f63683e04108d5ff8e1fb35db0f3570cbcb5`.

## Executed verification commands

1. RFQ plugin off-state and route test suite:
   - `node --test plugins/wp-ecomos-rfq/tests/*.spec.mjs`
   - Exit: 0.
   - Result: 11 tests passed in 115ms across 6 test files.
   - Verified:
     - `off-state.spec.mjs`: route guard returns HTTP 404 (`addon_disabled`) when inactive.
     - Email notifications suppressed when addon is disabled.
     - Order conversion blocked when addon is disabled.
     - Staff offer creation blocked when addon is disabled.

2. Storefront isolation contract test suite:
   - `npx tsx --test apps/storefront/e2e/rfq-off.spec.ts`
   - Exit: 0.
   - Result: 4 tests passed in 216ms.
   - Verified:
     - Disabled addon returns HTTP 404 (`ADDON_DISABLED`) for `/devis` and API routes.
     - Public capability projection excludes `quotes` and `quote_builder` in off-state.
     - Standard shopping cart functions identically whether RFQ is enabled or disabled.
     - Domain isolation between quote basket and normal purchase cart: adding items to quote basket does not mutate standard cart.
     - Re-enabling addon restores only authorized capabilities without platform side-effects.

3. TypeScript compilation:
   - `npx tsc -p apps/storefront/tsconfig.json --noEmit`
   - Exit: 0.
   - Result: PASS with zero errors.

4. Git scope containment:
   - Submitted commit `7045f63683e04108d5ff8e1fb35db0f3570cbcb5` alters exactly 7 files:
     - `apps/storefront/e2e/rfq-off.spec.ts`
     - `docs/ecomos/evidence/ECO-707/isolation.md`
     - `docs/ecomos/evidence/ECO-707/report.md`
     - `plugins/wp-ecomos-rfq/conversion.php`
     - `plugins/wp-ecomos-rfq/notifications.php`
     - `plugins/wp-ecomos-rfq/offers.php`
     - `plugins/wp-ecomos-rfq/tests/off-state.spec.mjs`
   - All files strictly within claimed scope. Zero modifications to protected files (`plugins/wordpress-mcp`).

## Invariant Assessment

- **Zero Privilege Leakage**: In off-state, all RFQ endpoints return HTTP 404 and neither guests nor operators can trigger quote operations.
- **Side-Effect Free**: Background jobs and email dispatchers suppress all activity when the addon is disabled.
- **Cart Untouched**: Standard purchasing cart and checkout flow operate completely independently from the quotation basket.
