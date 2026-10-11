# ECO-1101 evidence: authoritative WooCommerce cart multiset reconciliation

- Assignment base: `5a8780d96ed7ccc7bb6417e7db06c44cc609af33` (isolated branch
  `sprint-a/commerce-ECO-1101-prep`, same tree as `89c4482` plus the implementation below)
- Submission tip: this report's commit on the same branch (code changes already
  present at base from owner-directed prep; verified green here before reporting)
- Changed files in submission slice:
  - `packages/engine-woocommerce/src/cart.ts` (reconcile implementation, present at base)
  - `packages/engine-woocommerce/src/__tests__/cart.test.ts` (8 TDD tests, present at base)
  - `docs/ecomos/evidence/ECO-1101/report.md` (this file)
- Claimed but intentionally unchanged: `checkout.ts` (email type fix already
  accepted under ECO-1099, content identical), `cart-store.ts` (local optimistic
  lines stay as-is; authority lives server-side in the engine).

## Requirement-to-check mapping

- Add/update/remove reaches Woo: `reconcileStoreCart` drives exactly the Store
  API mutations needed — `POST /cart/add-item`, `POST /cart/update-item`,
  `POST /cart/remove-item` — proven by tests asserting request bodies.
- Complete normalized multiset vs intended product/variation/quantity:
  canonical `cartLineKey` (`v:<variationId>` for variations, `p:<productId>`
  for simples); final cart re-read and compared exactly, missing / surplus /
  quantity drift all throw instead of claiming success.
- Variation identities preserved: variation lines match by variation ID (the
  Store API reports a variation line under its variation ID, so a parent-only
  key could never match); same-product simple-to-variation swap is detected as
  `variationMismatches` and executed as atomic remove-old plus add-new.
- Nonce and Cart-Token correctness: every cart wrapper now accepts and returns
  the rotated `Nonce`; reconcile threads the latest nonce and token through
  strictly sequential mutations. Tests assert each POST carries the nonce
  issued by the immediately preceding response plus the stable Cart-Token.
- Stock/total error states: Store API 400s propagate verbatim and abort the
  sequence (no further mutations); invalid intended quantities rejected before
  any network call.

## Executed checks

- `vitest run packages/engine-woocommerce/src/__tests__/cart.test.ts` ->
  exit 0, 1 file, 28/28 PASS (20 pre-existing + 8 new: add-missing,
  remove-surplus, quantity-drift, variation-swap, nonce/token threading,
  no-op, stock-abort, invalid-quantity).
- `tsc -p packages/engine-woocommerce/tsconfig.json --noEmit` -> exit 0,
  0 errors.
- Sibling suites `checkout-attempts` + `checkout-quote` -> 22/22 PASS
  (unchanged behavior; nonce params are optional, `StoreCartResult.nonce`
  additive).

## Limits (stated, not hidden)

- No live WooCommerce calls: `php-staging` is not in this assignment and no
  staging credentials were available, so proof is at the mocked-Store-API
  level with an exact final-multiset verification step. Real-browser
  cart/refresh/navigation proof belongs to ECO-1201 against shared staging.
- `storefront-dev`/`browser` resources held but unused for the same reason;
  no services started, no shared state mutated.
- Migration/rollback: none. Changes are additive (new exports, optional
  params); existing callers behave exactly as before. Rollback is revert.

## git-index note

The assignment names `git-index` but it is held by ECO-1100 recovery rework;
the hub correctly refused it on claim (exit 3 conflict). Commits here are
worktree-local on the isolated branch (own index, no shared-tree staging),
disclosed to the coordinator; `git-index` will be added to the claim on
release if still needed.
