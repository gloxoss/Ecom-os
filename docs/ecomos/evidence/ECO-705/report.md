# ECO-705 Task Report: Private Revisioned Quote Offers

- **Task**: `ECO-705`
- **Phase**: 7 (RFQ / Quotes Addon)
- **Lane**: `commerce`
- **Executor**: `commerce-cleanup`
- **Base SHA**: `c9071ba8703f165b017d8636e322fce1152e2f8d`
- **Worktree**: `C:/dev/ecomos-eco301`
- **Branch**: `fix/eco-705-private-offers`
- **Evidence Documentation**: `docs/ecomos/evidence/ECO-705/offers.md`

---

## 1. Scope & Claimed Paths Verification

The following paths were claimed and modified strictly within the approved boundary:
- `packages/addons-rfq`: Offer calculation, revision guards, state machine, and tests
- `plugins/wp-ecomos-rfq`: Server pricing, revision repository, document generator, notification dispatcher, and PHP spec tests
- `apps/storefront/src/features/rfq`: Accessible customer offer review UI component
- `apps/storefront/src/app/api/rfq`: Offer management API route with route guarding
- `apps/storefront/e2e`: Contract tests for offer lifecycle, stale revision, and expiration
- `docs/ecomos/evidence/ECO-705`: Architectural evidence and verification report

Zero modifications were made to protected files (`plugins/wordpress-mcp`), root configuration files, or other agent claims.

---

## 2. Test Execution & Evidence

### A. TypeScript Typecheck
- **Command**: `npx tsc -p packages/addons-rfq/tsconfig.json --noEmit`
  - **Result**: `PASS` (0 errors)
- **Command**: `npx tsc -p apps/storefront/tsconfig.json --noEmit`
  - **Result**: `PASS` (0 errors)

### B. Addon RFQ Unit & Contract Tests (Vitest)
- **Command**: `npx vitest run packages/addons-rfq`
  - **Result**: `PASS` (5 test suites, 33 tests passed in 298ms)
  - `packages/addons-rfq/src/basket.test.ts` (8 tests pass)
  - `packages/addons-rfq/src/offer.test.ts` (4 tests pass)
  - `packages/addons-rfq/src/submit-schema.test.ts` (6 tests pass)
  - `packages/addons-rfq/src/policy.test.ts` (7 tests pass)
  - `packages/addons-rfq/src/state-machine.test.ts` (8 tests pass)

### C. WordPress Companion Plugin Tests (Node Test Runner)
- **Command**: `node --test plugins/wp-ecomos-rfq/tests/*.spec.mjs`
  - **Result**: `PASS` (8 tests passed in 110ms)
  - `documents.spec.mjs`: verified token access control, XSS prevention, and stock disclaimer
  - `notifications.spec.mjs`: verified event deduplication, mail sink harness, and sanitized recipients
  - `offers.spec.mjs`: verified line calculation math, expiration rejection, and stale revision guard
  - `schema.spec.mjs`: verified custom tables and durable retention
  - `repository.spec.mjs`: verified CRUD operations and revision immutability
  - `routes.spec.mjs`: verified REST endpoints and capability callbacks
  - `wp-ecomos-rfq.spec.mjs`: verified bootstrap and activation hooks
  - `BACKEND_DECISION.md`: verified completeness

### D. Storefront Contract Tests (Node Test Runner / TSX)
- **Command**: `npx tsx --test apps/storefront/e2e/quote-offer.spec.ts`
  - **Result**: `PASS` (8 tests passed in 234ms)
  - Denies `/api/rfq/offers` when quotes addon is in off-state (HTTP 404 `ADDON_DISABLED`)
  - Allows verified guest to view offer details and scrubs `accessSecretHash`
  - Rejects wrong or tampered token with HTTP 403 `FORBIDDEN`
  - Rejects acceptance of stale/superseded revision with HTTP 409 `STALE_REVISION`
  - Rejects acceptance of expired quotation offer with HTTP 410 `QUOTE_EXPIRED`
  - Successfully transitions offer to `accepted` when verified guest accepts current revision
  - Allows verified guest to decline offer and transitions state to `rejected`
  - Allows verified guest to request adjustments and transitions state to `revision_requested`

---

## 3. Invariants & Security Attestation

- **HMAC Guest Security**: Verified. Forced WordPress account creation is completely avoided; guest authorization is validated with constant-time SHA-256 HMAC comparisons.
- **Stock Integrity**: Verified. No inventory is reserved upon offer emission or acceptance; disclaimers are presented honestly in all interfaces.
- **Immutable Revisions**: Verified. Superseded offer revisions remain immutable in history and cannot be accepted.
- **Deduplicated Notifications**: Verified. Transactional emails are dispatched with unique idempotency keys, preventing duplicates across retries.
