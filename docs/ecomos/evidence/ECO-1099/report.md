# ECO-1099 evidence: exactOptionalPropertyTypes email fixes

Task: preflight fix of the 5 `exactOptionalPropertyTypes` email errors so
`engine-woocommerce` typecheck turns green for the ECO-1100 baseline.

- Base SHA: `89c4482bffb28e3ea29363578d6781d1bd2774f7` (assignment base, branch `fix/ecomos-phase-0`)
- Code commit: `ea7731d1dd667815f17fcfa6412f14e310ab0b17` on isolated branch
  `sprint-a/commerce-ECO-1101` (same tree as base plus the two files below)
- Changed files (scope-clean, exactly the assigned application paths):
  - `packages/engine-woocommerce/src/checkout-attempts.ts`
  - `packages/engine-woocommerce/src/checkout.ts`
- This report: `docs/ecomos/evidence/ECO-1099/report.md`

Out of scope and NOT in this submission: `cart.ts` multiset reconciliation
prep and `cart.test.ts` additions live only as uncommitted working-tree
changes plus a separate local branch `sprint-a/commerce-ECO-1101-prep`
(commit `5a8780d`), held for ECO-1101 after assignment.

## Fix

`exactOptionalPropertyTypes: true` (via `tsconfig.base.json`) forbids passing
`email: undefined` explicitly. All five sites now omit the optional property
when there is no contact instead of assigning `undefined`; domain semantics
unchanged (absent email stays absent, stored contact is still replayed):

- `checkout-attempts.ts` startAttempt (was line 209): `email: existing?.email`
  replaced with `...(existing?.email ? { email: existing.email } : {})`.
- `checkout-attempts.ts` confirmAttempt (was line 239): hoisted
  `const contactEmail = email ?? existing?.email` and spread conditionally;
  the inline `email ?? existing?.email` expression could not narrow to `string`.
- `checkout-attempts.ts` failAttempt (was line 262): same conditional spread.
- `checkout.ts` submitStoreCheckout (was line 65): bound
  `const contactEmail = billingEmail(input)` and spread conditionally.
- `checkout.ts` executeIdempotentCheckout replay (was line 99):
  `...(check.email ? { email: check.email } : {})`.

## Executed checks (isolated worktree, committed tree state)

- `tsc -p packages/engine-woocommerce/tsconfig.json --noEmit` -> exit 0,
  0 errors. Before: exit 2 with the 5 errors above.
- `vitest run` cart + checkout-attempts + checkout-quote suites -> 3 files,
  42 tests, all PASS.
- Storefront `tsc --noEmit --incremental false` (unchanged by this task) ->
  exit 0; the reported `InventoryAvailability.isPurchasable` regression is not
  reproduced.
- `git status` in the authoritative tree untouched; all work on the isolated
  branch. No staging mutations, no browser/php-staging use, no secrets.

## Risks and rollback

- Risk: negligible; object shapes only lose an explicitly-`undefined`
  property. Replay/owner-mismatch behavior covered by existing
  `checkout-attempts.test.ts` (all pass, including cross-owner and
  restart-durability cases).
- Rollback: revert the two-file commit on the isolated branch.
