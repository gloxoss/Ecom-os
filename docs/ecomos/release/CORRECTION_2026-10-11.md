# Release correction record, 2026-10-11

**Status:** active correction. Supersedes the completion and certification language in
the Phase reports, the release packet and the approval record wherever they conflict.

**Audited state:** branch `fix/ecomos-phase-0`, commit `e0fed6c3412d439e898294790754d80f7d1d3d10`.
**Source audit:** `Run audit.md` (2026-10-11, Africa/Casablanca), supplied transcript plus
three independent read-only reviews (commerce, release evidence, journal provenance).

## Why this record exists

The canonical hub journal records 60 accepted tasks and gates 0–9. Those records are
journal entries: they assert that a check passed. They are not runtime proof, and at the
audited commit several of the asserted outcomes did not hold. This record keeps the
history intact and marks what is withdrawn, rather than deleting or rewriting it.

Hub acceptance is a coordination record. It never was, and is not now, evidence that a
customer can buy, that a merchant can quote, or that a release is safe to deploy.

## What is withdrawn

| Claim | Where it was made | Status | Owner |
| --- | --- | --- | --- |
| "EcomOS is release-ready / certified ready for production release" | `PHASE_9_REPORT.md`, `release/RELEASE_PACKET.md`, `release/RELEASE_NOTES.md` | **Withdrawn.** The mounted checkout route rendered "Checkout is currently unavailable" and the cart merged items by parent product id at quantity 1. | ECO-1004 |
| "multi-tenant verified", independent second client | `release/RELEASE_PACKET.md`, `evidence/ECO-904/*` | **Withdrawn.** The reuse checks built literal objects; no second deployment, WordPress, database or secret set existed. | ECO-1009 |
| Backend compatibility matrix "certified" for PHP 8.1–8.3 / WP 6.4–6.7 / WC 8.5–9.3 | `release/BACKEND_MATRIX.md`, `evidence/ECO-902/*`, `COMPATIBILITY.md` | **Withdrawn.** The auditor returned `overallStatus: "PASS"` from an empty plugin list and never executed PHP. | ECO-1007 |
| "Rehearsed database disaster recovery", restored order integrity | `release/ROLLBACK.md`, `evidence/ECO-903/restore.md`, `operations/RESTORE.md` | **Withdrawn.** `verify-restore.ts` called a simulation against a hardcoded snapshot (table count 42, orders verified true). | ECO-1007 |
| Provisioning CLI provisions a tenant environment | `operations/PROVISION.md`, `evidence/ECO-904/provision.md` | **Withdrawn.** The command was not registered in the CLI entry point and only validated an input file. | ECO-1007 |
| Browser UAT, performance and accessibility budgets | `evidence/ECO-807/uat.md`, `scripts/measure-storefront.ts` | **Withdrawn.** The specs used `node:test` on constructed objects; the budget script supplied constants for the properties it reported. | ECO-1009 |
| Compliance dossier "signed"; medical certification statements approved | `release/APPROVAL.md`, `clients/paraloca/content-approval.md`, `evidence/ECO-806/claim-inventory.md` | **Withdrawn pending owner evidence.** No signatory, no product-specific source or model. | ECO-1010 |
| Guest-privacy of checkout idempotency replay | `packages/engine-woocommerce/src/checkout-attempts.ts` | **Defect confirmed.** Attempt replay was keyed only by `attemptKey`; a different caller reusing a key received another guest's confirmed order and order key. | ECO-1003 |
| RFQ buyer→merchant workflow continuity | `evidence/ECO-805/*`, `docs/ecomos/rfq/*` | **Withdrawn.** The quote builder linked to `/devis/review`, which did not exist; submission state was process-local. | ECO-1005 |
| RFQ→order conversion is authorized and single-shot | `plugins/wp-ecomos-rfq/*` | **Defect confirmed.** Guest-readable route permission, caller-overridable stock policy, non-atomic quote link, parent product id used instead of the requested variation. | ECO-1006 |

## What is *not* withdrawn

Stating this precisely matters as much as the list above. The audit confirmed:

- The hub journal is internally consistent: all 60 submitted task SHAs exist and are
  ancestors of the audited HEAD, and every verifier SHA field matches its submission.
- The unit suite is real and passes once workspace resolution works (480 tests, 57 files).
- The type check passes (0 errors) once workspace resolution works.
- The written launch boundary correctly requires explicit human authorization, and the
  transcript does not show that production cutover occurred.
- Substantial domain and helper implementations exist. The defects are in wiring,
  authorization and evidence honesty, not in the absence of all code.

## Corrections applied

Recorded here because they change what a reader should believe:

1. **Gate 3 provenance (finding 10).** Gate 3 recorded `0955d630`, an orphan commit that
   added only `PHASE_3_REPORT.md` and is not an ancestor of HEAD. The Phase 3 task
   commits were integrated elsewhere. Gate 3 has been re-recorded against an integrated
   commit with the Phase 3 checks executed and their exit codes captured (ECO-1002).
2. **Release regression suite result (finding 10).** The recorded command mixed two test
   runners. It fails as written (exit 1, 9 passed / 1 failed). The suite is now recorded
   as two commands, each with its own exit code (ECO-1002).
3. **Health-test runner ownership.** `apps/storefront/src/__tests__/security/health.test.ts`
   imports `vitest` and is owned by the Vitest suite; `apps/storefront/e2e/**/*.spec.ts`
   are `node:test` files. Do not combine them in one command.
4. **Workspace dependency resolution (finding 9).** Three `@ecom-os/*` symlinks in
   `apps/storefront/node_modules` pointed into the forced-removed worktree
   `C:/dev/ecomos-eco301`. Restored through the normal install process; the previously
   reported 435/7-failing unit result and 112-error type check were caused by this, not by
   the code. `pnpm-lock.yaml` was updated because `packages/addons-rfq` had dependencies
   the lockfile did not contain.
5. **Addon runtime contract (finding 9, second half).** `packages/addons-rfq/src/index.ts`
   exported neither `register` nor `disable`, so the architecture guard genuinely failed
   against the repository even though its own 13 regression tests passed. The RFQ addon
   now exports the lifecycle pair plus `isRfqActive`/`getActiveRfqPolicy`.
6. **Missing addon manifests (finding 11).** Only `plugins/dummy-addon` had a
   `manifest.json`. `packages/addons-i18n`, `addons-multi-payment` and `addons-rfq` now
   have one, so the shipped `ADDONS=i18n,multi-payment` value no longer fails the build.
7. **Addon name resolution (finding 11).** The generator resolved an addon only by
   directory suffix, so `ADDONS=quotes` — the id the RFQ route guard actually checks —
   failed to resolve while `rfq` would have loaded an addon the guard ignores. Resolution
   now also matches a package's declared `ecom-os.flag`.
8. **HPOS and version headers (finding 6, surfaced by the corrected audit).** Once the
   backend auditor stopped hardcoding a pass, it showed that none of `wp-ecomos-addons`,
   `wp-ecomos-operations` and `wp-ecomos-rfq` declared `custom_order_tables` compatibility,
   and none carried a `WC requires at least:` header. All three now declare HPOS support
   on `before_woocommerce_init` and carry `Requires at least`, `Requires PHP` and
   `WC requires at least` headers. The declaration is metadata, not an executed test.
9. **Stopped worker registrations (finding 12).** Four registrations still referenced the
   removed worktree `C:/dev/ecomos-eco301` (`tooling-cleanup`, `runtime-cleanup`,
   `cleanup-verifier`, `commerce-cleanup`); `catalog-a-1` also referenced it on a left
   record. With no outstanding claims, all five were deregistered so the board admits
   current workers. Paths claimed by those registrations are repository-relative and
   survive the deregistration.

## Build and CI honesty (surfaced during the repairs)

Neither the audit nor the earlier reports ran a production build. Doing so found
that the storefront **did not build at all**:

1. `next build` failed at module resolution: `packages/ecom-engine/src/addon-registry.ts`
   and `addons.ts` imported `./addon-manifest.js`, but the package ships TypeScript
   source (`main: src/index.ts`) under `moduleResolution: Bundler`, so the `.js`
   specifier resolved to nothing. Fixed by dropping the extension (ECO-1012).
2. With that fixed, `next build` failed again in the CSS pipeline: Turbopack's PostCSS
   transform rejects the Tailwind v4 output with `CssSyntaxError ... Missed semicolon`,
   even though the same `postcss` + `@tailwindcss/postcss` pair processes the same
   `globals.css` successfully outside Turbopack, and despite `globals.css` and the
   generated `brand.tokens.css` both being well-formed. The webpack builder compiles
   the identical input cleanly. `apps/storefront`'s `build` script therefore uses
   `next build --webpack`, with `build:turbopack` kept for when the upstream issue is
   resolved (ECO-1013).
3. `next build` then failed its generated route type check because the two RFQ route
   modules exported test-only helpers (`clearRfqStoresForTesting`,
   `setOfferQuoteForTesting`, …). A Next.js route module may only export its HTTP
   handlers. The helpers moved to `features/rfq/model/server-quote-store.ts` (ECO-1013).

**CI status is not green.** `.github/workflows/ci.yml` runs `pnpm -r lint`,
`pnpm -r typecheck`, `pnpm test:coverage`, `pnpm hub:test` and
`pnpm --filter storefront build`. The build step now picks up the working builder via
the package script. `pnpm -r lint` currently reports errors in the storefront source
(a mix of pre-existing files such as `lib/addon-route-guard.ts`,
`features/catalog/ui/product-grid-client.tsx` and `features/content/ui/page-sections.tsx`,
plus files touched by these repairs). Until lint is clean, any document claiming the CI
pipeline passes is wrong. Tracked on the hub; not a claim this record makes.

## Cleanup provenance (finding 12)

The superseded transcript ran `git checkout -- apps clients docs packages plugins scripts`,
recursive deletion of ECO-905 verification evidence, and a forced worktree removal. The
original diffs and command output were not retained, so no specific lost edit can be
reconstructed — only its operational consequence, the broken links in item 4, which is
now repaired. No further worktree will be force-removed without archiving owned diffs
first; the hub protocol already requires that, and this record exists so the next cleanup
has a written prior.

## Evidence that is now considered insufficient

These documents remain on disk as history but must not be cited as proof of their claims
until replaced:

- `evidence/ECO-807/uat.md` — claimed browser UAT from `node:test` assertions.
- `evidence/ECO-904/provision.md` — claimed independent provisioning.
- `evidence/ECO-904/reuse.md` — claimed a second client with its own engine.
- `evidence/ECO-903/restore.md` — claimed a rehearsed restore.
- `evidence/ECO-806/claim-inventory.md` — approved medical certification statements.
- `release/APPROVAL.md` — asserted a signed compliance dossier.
- `clients/paraloca/content-approval.md` — states entity, address, phone, warranty and tax
  facts with no owner sign-off attached.
- `docs/ecomos/verification/ECO-905/verification.md` — declarative verifier report without
  visible separate execution of the checked command.

## Required proof before any release claim is restored

The audit's exit criteria, unchanged:

1. A real browser on a local WooCommerce instance chooses an exact variation and
   quantity, receives Woo-authoritative totals, submits COD, and privately reads the
   resulting order. Out-of-stock, retry, shipping and tax cases included.
2. Durable checkout attempts keyed and authorized by owner plus operation; cross-owner
   reuse fails closed; retries across restarts cannot duplicate an order or expose
   another guest's secret.
3. Mounted RFQ quote routes with real WordPress persistence, staff access, guest offer
   access, restart survival, addon-off isolation, and single-shot conversion of one quote
   into one linked order under concurrency.
4. Executed PHP/HPOS/Store API tests against declared versions; real backup import and an
   observed rollback rehearsal; a clean-checkout install following only `INSTALL.md`.
5. A second client with its own deployment, WordPress, database and secrets.
6. Attributable owner approval for merchant facts and product claims.

Until those exist, the honest status is: **guest purchase, RFQ workflow and release
readiness are unproven.** Production cutover still requires the explicit human
authorization already written into `release/APPROVAL.md`; this correction removes no
authorization gate.

## Task map

| Task | Scope |
| --- | --- |
| `ECO-1001` | This correction record; withdrawn claims; invalidated evidence. |
| `ECO-1002` | Reproducibility, guard, gate runner and final-commit provenance. |
| `ECO-1003` | Owner-scoped durable checkout/RFQ idempotency. |
| `ECO-1004` | Real guest catalog→cart→COD→order journey. |
| `ECO-1005` | RFQ persistence and review/offer routes. |
| `ECO-1006` | RFQ conversion authorization, atomicity, variation mapping. |
| `ECO-1007` | Honest backend, PHP, restore and provisioning checks. |
| `ECO-1008` | Install and extension docs executable as written. |
| `ECO-1009` | Real browser UAT, budgets and second isolated client. |
| `ECO-1010` | Attributable owner evidence for merchant facts and claims. |
