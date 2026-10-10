# ECO-701: RFQ State Machine and Permission Model Report

## Summary
Defined and implemented the comprehensive Request for Quote (RFQ / Devis) state machine, actor permission model, immutable offer revision lifecycle, policy engine, and privacy/retention contract in `@ecom-os/addons-rfq`.

## Scope & Claimed Paths
- `packages/addons-rfq/` (`package.json`, `tsconfig.json`, `src/types.ts`, `src/state-machine.ts`, `src/policy.ts`, `src/index.ts`, `src/state-machine.test.ts`, `src/policy.test.ts`)
- `docs/ecomos/rfq/` (`POLICY.md`)
- `docs/ecomos/evidence/ECO-701/` (`rfq-state.md`, `report.md`)

## Key Implementations & Invariants
1. **Deterministic RFQ State Transitions (`packages/addons-rfq/src/state-machine.ts`)**:
   - Implemented states: `draft`, `submitted`, `verified`, `offer_created`, `revised`, `accepted`, `rejected`, `expired`, `converted`.
   - Prohibited invalid jumps with `IllegalTransitionError`.
2. **Actor Permission Enforcement**:
   - Enforced role permissions across `guest`, `operator`, `administrator`, and `system`.
   - Prohibited guest offer creation and operator acceptance on behalf of clients with `UnauthorizedActorError`.
3. **Guest Ownership Without B2C Accounts**:
   - Cryptographic secret hash validation (`accessSecretHash`) binds requests to guest submitters without creating or requiring WordPress customer user accounts.
4. **Immutable Revision History & Stale Rejection**:
   - Every staff offer creates an immutable revision record with priced lines, tax calculations, and expiration date.
   - Acceptance targeting outdated revisions triggers `StaleRevisionError`.
5. **Architectural Invariant: Zero Automatic Stock Reservation**:
   - By default (`stockReservation = 'none'`), neither RFQ submission nor customer acceptance deducts or holds stock. Stock is committed only upon conversion to a confirmed WooCommerce order.
6. **Data Retention & Privacy Compliance**:
   - Formalized mandatory consent recording (`terms_and_conditions`, `privacy_consent`) and terminal quote retention lifecycle with purge eligibility evaluation.

## Executed Verification Commands
```bash
node ./node_modules/vitest/vitest.mjs run packages/addons-rfq/src/state-machine.test.ts packages/addons-rfq/src/policy.test.ts
node ./node_modules/typescript/bin/tsc -p packages/addons-rfq/tsconfig.json --noEmit
```
Output:
```text
✓ packages/addons-rfq/src/state-machine.test.ts (8 tests) 5ms
✓ packages/addons-rfq/src/policy.test.ts (7 tests) 5ms
Test Files: 2 passed (2)
Tests: 15 passed (15)
tsc packages/addons-rfq: 0 errors
```
