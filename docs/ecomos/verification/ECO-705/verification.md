# ECO-705 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `commerce-cleanup`, commerce lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `07e7dfdcbfd00ed92a9d131522448076f52191fd`.
- Base: `c9071ba8703f165b017d8636e322fce1152e2f8d`.
- Executor evidence: `docs/ecomos/evidence/ECO-705/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-705/verification.md`).

## Verdict

PASS for private revisioned quote offers, server line pricing, safe HTML/PDF quotation documents, transactional notifications, and guest response endpoints at commit `07e7dfdcbfd00ed92a9d131522448076f52191fd`.

## Executed verification commands

1. RFQ add-on unit tests and state machine verification:
   - `npx vitest run packages/addons-rfq`
   - Exit: 0.
   - Result: 5 test suites passed, 33 tests passed in 298ms.
   - Verified:
     - Exact line calculation and tax rate rounding.
     - Multi-line offer aggregation.
     - Past expiration rejection.
     - Revision current status and expiration checker.
     - State machine transition to `accepted`, `rejected`, and `revision_requested`.

2. WordPress RFQ companion plugin tests:
   - `node --test plugins/wp-ecomos-rfq/tests/*.spec.mjs`
   - Exit: 0.
   - Result: 8 tests passed in 110ms across 4 test files.
   - Verified:
     - Document access requires guest HMAC secret or staff capability.
     - Anti-injection HTML escaping (`htmlspecialchars`, `ENT_QUOTES`).
     - Honest stock reservation disclaimer.
     - Deduplicated transactional notification dispatcher with test mail sink.
     - Server pricing calculation and terminal quote state guards.

3. Storefront contract tests:
   - `npx tsx --test apps/storefront/e2e/quote-offer.spec.ts`
   - Exit: 0.
   - Result: 8 tests passed in 234ms.
   - Verified:
     - Addon off-state returns HTTP 404 (`ADDON_DISABLED`).
     - Verified guest views offer without exposing `accessSecretHash`.
     - Tampered token receives HTTP 403 `FORBIDDEN`.
     - Stale / superseded revision acceptance blocked with HTTP 409 `STALE_REVISION`.
     - Expired offer acceptance blocked with HTTP 410 `QUOTE_EXPIRED`.
     - Verified guest transitions offer to `accepted`.
     - Verified guest transitions offer to `rejected`.
     - Verified guest requests revision with notes.

4. TypeScript compilation:
   - `npx tsc -p packages/addons-rfq/tsconfig.json --noEmit` -> PASS (0 errors)
   - `npx tsc -p apps/storefront/tsconfig.json --noEmit` -> PASS (0 errors)

5. Git scope containment:
   - Submitted commit `07e7dfdcbfd00ed92a9d131522448076f52191fd` alters exactly 18 files, all strictly within the claimed scope:
     - `apps/storefront/e2e/quote-offer.spec.ts`
     - `apps/storefront/src/app/api/rfq/offers/route.ts`
     - `apps/storefront/src/features/rfq/ui/offer-review.tsx`
     - `docs/ecomos/evidence/ECO-705/offers.md`
     - `docs/ecomos/evidence/ECO-705/report.md`
     - `packages/addons-rfq/src/index.ts`
     - `packages/addons-rfq/src/offer.test.ts`
     - `packages/addons-rfq/src/offer.ts`
     - `packages/addons-rfq/src/state-machine.ts`
     - `packages/addons-rfq/src/types.ts`
     - `plugins/wp-ecomos-rfq/documents.php`
     - `plugins/wp-ecomos-rfq/notifications.php`
     - `plugins/wp-ecomos-rfq/offers.php`
     - `plugins/wp-ecomos-rfq/routes.php`
     - `plugins/wp-ecomos-rfq/tests/documents.spec.mjs`
     - `plugins/wp-ecomos-rfq/tests/notifications.spec.mjs`
     - `plugins/wp-ecomos-rfq/tests/offers.spec.mjs`
     - `plugins/wp-ecomos-rfq/wp-ecomos-rfq.php`
   - Zero modifications to protected files (`plugins/wordpress-mcp`).

## Invariant Assessment

- **HMAC Guest Security**: Verified. Guest authorization is enforced via constant-time SHA-256 HMAC comparisons without forced user account creation.
- **Stock Integrity**: Verified. Offer emission and acceptance do not reserve physical inventory.
- **Immutable Revisions**: Verified. Superseded offer revisions remain immutable in history and cannot be accepted.
- **Deduplicated Notifications**: Verified. Transactional emails are dispatched with unique idempotency keys, preventing duplicate sends across retries.
