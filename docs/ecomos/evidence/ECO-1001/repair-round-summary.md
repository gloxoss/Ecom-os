# Audit repair round — finding-by-finding record, 2026-10-11

**Task:** `ECO-1001` (the audit's scoped correction task) · **Source:** `Run audit.md`, 2026-10-11
**Audited commit:** `e0fed6c3412d439e898294790754d80f7d1d3d10`

This is the map from each audit finding to what was done, the commit that carries it,
the evidence, and — stated plainly — what is still missing. The withdrawal record for
the original claims is `docs/ecomos/release/CORRECTION_2026-10-11.md`.

## Commits in this round

| Commit | Subject |
| --- | --- |
| `b8f87cc` | Restore workspace resolution, addon contracts and the storefront build |
| `654a661` | Stop certifying a backend and a restore that were never checked |
| `e2c3858` | Bind idempotent attempts to their owner and make them durable |
| `2bfd21e` | Require merchant authority and make quote conversion single-shot |
| `cda9acc` | Make the guest purchase and quote journeys real |
| `cd7ab4b` | Withdraw unsupported completion, certification and merchant claims |
| `d908333` | Record the audit repair submissions |
| `c983a08` | Import the RFQ test helpers from the store, not the route |
| `a83ec9f` | Record the build repairs |
| `34e0d0e` | Extend the task map and record the outstanding release blockers |
| `baee1f7` | Add served-page evidence for the checkout and RFQ routes |

## Findings

| # | Finding | Status | Where |
| --- | --- | --- | --- |
| 1 | Storefront cannot complete the claimed guest purchase | **Wiring repaired and the route now serves real markup.** No real purchase executed. | `cda9acc`, `baee1f7`, evidence `ECO-1004` |
| 2 | Idempotency replay not bound to the guest who owns it | **Repaired for checkout (engine + storefront) and for RFQ.** Cross-owner reuse fails closed. | `e2c3858`, `cda9acc`, evidence `ECO-1003`, `ECO-1005` |
| 3 | RFQ buyer/merchant workflow disconnected and nondurable | **Routes mounted, one shared store, durable local persistence, owner-bound replay.** WordPress persistence not executed. | `cda9acc`, evidence `ECO-1005` |
| 4 | RFQ-to-order conversion lacks authorization and atomicity | **Repaired in source; verified with a PHP harness.** No live database. | `2bfd21e`, evidence `ECO-1006` |
| 5 | "Browser UAT", performance, accessibility and second-client proof are simulations | **The simulated PASS is replaced by real Chromium measurement, which now FAILS the touch-target budget.** Second client still absent. | `c1ec3bf`, evidence `ECO-807/browser-measurement.md` |
| 6 | Backend certification can pass with no backend; PHP bootstrap does not parse | **Auditor fails closed; bootstrap parses; declarations added.** PHP suite still not executed against WordPress. | `654a661`, `b8f87cc`, evidence `ECO-1007`, `ECO-1011` |
| 7 | Disaster recovery and provisioning claims exceed the implementation | **Simulation removed; scripts report NOT RUN instead of success.** Provisioning remains unimplemented and says so. | `654a661`, evidence `ECO-1007` |
| 8 | Client facts and signed compliance approval lack owner evidence | **Claims withdrawn to PENDING OWNER EVIDENCE; a pending-approval register replaces the dossier.** Owner input still absent. | `cd7ab4b`, evidence `ECO-1010` |
| 9 | Removed worktree breaks current verification | **Repaired.** Links restored through the normal install; the guard's real failure fixed. | `b8f87cc`, evidence `ECO-1002` |
| 10 | Recorded gates do not cover final HEAD; independent execution insufficiently evidenced | **Gate 3 re-recorded at an integrated commit with executed checks; the gate runner mismatch corrected.** Independent verification of the round is recorded under `docs/ecomos/verification/`. | `b8f87cc`, evidence `ECO-1002` |
| 11 | Installation and extension instructions not executable as written | **Docs aligned to source, including the manifest contract and the real CI job.** No clean-checkout run yet. | `cd7ab4b`, evidence `ECO-1008` |
| 12 | Cleanup did not establish ownership before discarding files | **Links rebuilt; five stopped worker registrations deregistered; the prior recorded.** The original lost diffs are unrecoverable. | `b8f87cc`, `docs/ecomos/release/CORRECTION_2026-10-11.md` |

## Additional defects found while repairing

These were not in the audit. Each was found because repairing an earlier failure
exposed it, and each is recorded rather than quietly fixed.

1. **The storefront did not build at all** — an unresolvable `./addon-manifest.js`
   import in `ecom-engine`, then a Turbopack CSS failure, then a Next route type check
   rejecting test-only exports from route modules. Now exits 0. `ECO-1012`, `ECO-1013`.
2. **`pnpm -r lint` fails**, so the documented CI pipeline was never green. `ECO-1014`.
3. **None of the three shipped plugins declared HPOS compatibility** — surfaced only
   after the auditor stopped hardcoding a pass. `ECO-1011`.
4. **A real, reproduced accessibility failure.** The browser run measured the smallest
   touch target at **16.5px** on `/` (13 of 30 interactive elements under 44px) and
   **20px** on `/catalog` (16 of 27) — failing both the 44px and the 24px WCAG
   thresholds. The named offenders are `a "Pâtisseries" .hero-category-link` at
   190 × 16.5px (`text-[10px]`, no vertical padding) and `a "Shop Pâtisseries"` at
   141.56 × 20px. Inline-in-sentence links, which WCAG exempts, are excluded. The
   fabricated PASS had reported `touchTargetMinPx: 44 PASS` as a constant.
   Worst measured contrast was 16.28:1 against a 4.5 minimum; 223 elements were
   excluded as image-backed rather than guessed at. `ECO-1009`.
5. **Four Playwright specs fail, two of them genuinely.** Two are the real touch-target
   verdicts above. Two are environmental and pre-existing: the checkout happy path
   needs WooCommerce, and `smoke.pw.spec.ts` expects an `h1` the current theme renders
   as a `button role="tab"`. One spec is skipped as NOT MEASURED because the fake engine
   returns zero products, so no product link exists to drive add-to-bag. `ECO-1009`.
6. **`/revise` and `/reject` have no state guard**, so a guest holding a quote token can
   flip an `accepted` quote. Left untouched as its own finding. `ECO-1006` evidence.

## Verified state of this commit

Independently executed at `de1c80239eaf68bf300df3eadb4708b10e354fcf` in a separate
worktree with its own installed dependencies
(`C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/.audit-verify`). The full record,
including the fail-closed controls and what was *not* established, is
`docs/ecomos/verification/ECO-1001/verification.md`.

| Check | Result |
| --- | --- |
| `tsx scripts/check-engine-imports.ts` | exit 0 |
| `tsc -p apps/storefront/tsconfig.json --noEmit --incremental false` | exit 0 — 0 errors |
| `vitest run` | exit 0 — 521 passed, 62 files |
| `node --test .agent-hub/test/*.test.mjs` | exit 0 — 16 passed |
| `php -l` on every plugin PHP file (PHP 8.2.29) | exit 0 |
| `tsx scripts/verify-backend-compatibility.ts` | exit 0 — PASS with real declarations |
| `tsx scripts/verify-restore.ts` (no artifact) | exit 2 — NOT RUN, not a pass |
| `next build --webpack` | exit 0; `/checkout`, `/devis/review`, `/devis/offer`, `/api/rfq` compiled in |

## Hub board state, stated honestly

The hub's submission model assumes one commit per task. This round was performed in a
single shared working tree and committed in groups that span several tasks, so most
repair tasks cannot be submitted as individually-verified single commits without
rewriting history. Rather than manufacture separate commits to satisfy the mechanism,
the board records the correction task's submission and leaves the others with their
commits and evidence named. Phase 9's gate is therefore **not** re-recorded: several of
these tasks are explicitly unproven, and a gate is not a place to hide that.

## Still blocking any release claim

1. A real browser purchase against live WooCommerce, with out-of-stock, retry, shipping
   and tax cases.
2. Live WordPress RFQ persistence, staff access and concurrent conversion.
3. Executed PHP/HPOS/Store API tests, and a real backup import with an observed rollback.
4. A second isolated client with its own deployment, database and secrets.
5. Owner-supplied merchant facts and product-claim sources.
6. A clean `pnpm -r lint` run.

None of these can be produced without infrastructure or owner input that this
environment does not have. They are the honest remainder of the audit.
