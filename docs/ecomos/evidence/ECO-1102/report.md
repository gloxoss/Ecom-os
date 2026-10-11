# ECO-1102 evidence: durable atomic checkout attempts with response-loss recovery

- Assignment base: `daa48117e1ec811995adbac9f5b8e3ccd89e608c` (ECO-1101 tip)
- Branch: `sprint-a/commerce-ECO-1102` (isolated worktree, main tree untouched)
- Changed files in submission slice:
  - `packages/engine-woocommerce/src/checkout-attempts.ts` (atomic claims, payload binding, safe sweep, durable default store)
  - `packages/engine-woocommerce/src/checkout.ts` (correlation marker, recovery flow, REST order lookup)
  - `packages/engine-woocommerce/src/__tests__/checkout-attempts.test.ts` (18 new tests, 1 rewritten sweep test)
  - `docs/ecomos/evidence/ECO-1102/report.md` (this file)
- Claimed but intentionally unchanged: `apps/storefront/src/features/checkout`
  (no server-action change needed; payload hash is computed inside
  `executeIdempotentCheckout`, and engine `submitCheckout` wiring that would
  pass a live lookup stays a follow-up requiring `client.ts` scope).

## Requirement-to-check mapping

- Exactly one Woo order per attempt across OS processes, retries, restarts:
  `FileClaimAttemptStore` keeps one file per attempt state and claims with
  atomic exclusive hard-link creation, so exactly one process wins. Proven by
  a 64-way parallel claim test (exactly 1 winner) and a real two-OS-process
  race test (outcomes exactly `claimed` + `exists`).
- Atomic ownership: owner is checked on claim, confirm, fail, revive and
  retry; a different owner gets `OWNER_MISMATCH` with no data leak (existing
  tests, all still passing).
- Response-loss after Woo creates the order: `submitStoreCheckout` embeds
  `[ecomos-attempt:<key>]` in the customer note when keyed;
  `executeIdempotentCheckout` accepts a `lookupOrder` hook. On a stuck
  `PENDING` it reconciles first: order found -> confirm and return it with
  zero new submissions; none found -> mark failed and submit exactly once;
  lookup failure -> honest unknown error, no success displayed, no retry.
  `findOrderByAttemptCorrelation` implements the Woo REST side (marker plus
  optional email match, skips keyless rows).
- Corrupt/unavailable storage: unreadable records throw
  `CorruptAttemptStoreError` and are never deleted or reset (tested: file
  survives, repeat attempts keep failing closed); blocked directories reject
  on every instance with no in-memory fallback authorizing anything.
- Fresh legitimate repeat purchases: new attempt keys with identical details
  claim and confirm independently (tested: orders 101 and 102 coexist).
- Changed payload under one attempt refused: `attemptPayloadHash` (stable
  stringify plus FNV-1a over owner, addresses, method) is stored at claim and
  verified on every re-entry; mismatches return `PAYLOAD_MISMATCH` without
  touching the record (tested for pending and confirmed states).
- Unknown outcomes recoverable: PENDING is never swept, CONFIRMED persists 7
  days for replay, FAILED becomes retryable; sweep only removes FAILED past
  TTL and CONFIRMED past the long window. The old sweep-everything TTL test
  was rewritten to this policy (the old behavior is exactly the duplicate
  defect: sweeping CONFIRMED lets a retry mint a second order).
- Totals/currency/shipping/tax matching stays with Woo as authority
  (ECO-1101 reconcile plus submit-time Store API errors); the attempt layer
  binds the payload it is given and never invents amounts.

## Executed checks

- `tsc -p packages/engine-woocommerce/tsconfig.json --noEmit` -> exit 0, 0 errors.
- `tsc --noEmit --incremental false -p apps/storefront/tsconfig.json` -> exit 0, 0 errors.
- `vitest run packages/engine-woocommerce` -> 9 files, 153/153 PASS, including:
  18 new ECO-1102 tests (parallel claims, two-OS-process race, restart
  replay, corrupt fail-closed, blocked storage, payload hash stability,
  payload refusal pending/confirmed, repeat purchase, timeout retry,
  loss recovery with zero POSTs plus restart replay, lookup-miss single
  submit, lookup-failure honesty, marker embed/omit, REST correlation
  match/skip/miss, store default policy) and the rewritten sweep-policy tests.
- `storageKey` separator byte-verified identical to the pre-change source
  (single `u0000` escape), so existing persisted keys keep working.
- Backwards compatibility: `executeIdempotentCheckout` without options and
  `submitStoreCheckout` without a key behave exactly as before (all 16 prior
  attempt/quote tests pass unmodified except the superseded sweep test);
  `InMemoryAttemptStore`/`JsonFileAttemptStore` keep their interfaces, the
  latter documented single-process dev-only.

## Limits (stated, not hidden)

- No live WooCommerce calls: `php-staging` was not assigned and no staging
  credentials exist, so recovery is proven with injected lookups and mocked
  Store/REST APIs. Live multi-worker proof belongs to ECO-1201.
- `storefront-dev`/`browser` held but unused (no services started); no shared
  state mutated; no real orders, customers, or notifications touched.
- Multi-host deployments still need a shared claim store; the file store
  covers single-host multi-process plus restarts. Test runners stay hermetic
  (`InMemory` under `NODE_ENV=test`/`VITEST*`); production defaults to
  `.ecomos/attempts` unless `ECOM_ATTEMPT_STORE_PATH` overrides (a `.json`
  value keeps the legacy single-file store).
- Migration/rollback: new files additive under the store dir; no schema to
  migrate. Rollback is revert. Legacy `JsonFileAttemptStore` files are untouched.

## git-index note

The assignment names no `git-index`, and it remains held by recovery tasks;
both commits here are worktree-local on the isolated branch (own index, no
shared-tree staging), disclosed to the coordinator as with ECO-1099/ECO-1101.
