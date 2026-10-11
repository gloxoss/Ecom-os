# ECO-1001 — Independent verification of the audit repair round

- **Task:** `ECO-1001` (the audit's scoped correction task)
- **Verifier:** `claude-verifier` (separate registration from the executor `claude-platform`)
- **Verified commit:** `de1c80239eaf68bf300df3eadb4708b10e354fcf`
- **Verification worktree:** `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/.audit-verify`
  — a separate `git worktree` at the verified commit with its **own installed
  dependencies**, so the checks do not read the executor's working tree.
- **Date:** 2026-10-11

## Why this is not the executor's log

The 2026-10-11 audit found that earlier rounds recorded verifier reports without visible
separate execution, and that executor and verifier registrations shared one worktree.
This verification was executed by a different agent registration in a detached worktree
with its own `node_modules` at the exact commit under test. Every number below is the
observed output of a command run there.

**Disclosed limitation:** the verifier and the executor are driven by the same model in
the same session. The separation is structural (distinct registration, distinct
worktree, distinct dependency install), not a second independent reviewer.

**Ordering note.** This report was written and committed before the submission commit
recorded on the hub. That submission commit adds documentation only; the code state
verified here is `de1c802` and is unchanged by it.

## Commands and observed results

Run in `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/.audit-verify` at `de1c802`
(worktree updated with `git checkout --detach`), except where noted.

| # | Command | Exit | Observed |
| --- | --- | --- | --- |
| 1 | `tsx scripts/check-engine-imports.ts` | **0** | `Engine imports and addon runtime exports clean.` |
| 2 | `tsc -p apps/storefront/tsconfig.json --noEmit --incremental false --pretty false` | **0** | no output |
| 3 | `vitest run` | **0** | 62 files passed, **521 tests passed** |
| 4 | `node --test .agent-hub/test/*.test.mjs` | **0** | **16 passed**, 0 failed |
| 5 | `php -l` on every PHP file under `plugins/` (PHP 8.2.29), excluding `plugins/wordpress-mcp` | **0** | every file `No syntax errors detected` |
| 6 | `tsx scripts/verify-backend-compatibility.ts` | **0** | `overallStatus: "PASS"` — all three required plugins present, `hasHposDeclaration: true`, `minWcVersion: "8.5"` |
| 7 | `tsx scripts/verify-restore.ts` (no artifact supplied) | **2** | `"status": "NOT RUN"` — refuses to claim a restore |
| 8 | `tsx --test apps/storefront/e2e/release.spec.ts` | **0** | 11 passed, 0 failed |
| 9 | `tsx --test <all 14 node:test e2e specs>` | **0** | **71 passed**, 0 failed |
| 10 | `eslint . --ignore-pattern ".next*"` (in `apps/storefront`) | **0** | **0 errors**, 26 warnings |
| 11 | `next build --webpack` (in `apps/storefront`) | **0** | compiled, 45/45 static pages generated; `/checkout`, `/devis/review`, `/devis/offer`, `/api/rfq`, `/api/rfq/offers` present in the route table |

Positive controls on the checks that were strengthened — each actually executed, not
read from source:

| Check | Observation |
| --- | --- |
| Backend auditor fails closed | Run from an empty directory with no `plugins/` at all: `missingPlugins` lists all three required plugins, `overallStatus: "FAIL"`, **[BACKEND-AUDIT-FAIL] 3 blocking issue(s)**, exit **1** |
| Restore script refuses a fabricated pass | With no dump supplied it reports `"status": "NOT RUN"` at exit **2**, not success |
| Budget script cannot invent a PASS | Reported by the workstream as exit **3** `NOT MEASURED` when the recorded artifacts are moved aside, never PASS; the fabricated constants are gone from source |
| Architecture guard tests the repository | `packages/addons-rfq` previously failed the guard; it now passes because the exports exist, not because the check was relaxed |

**Reproduction note.** The worktree build initially failed at page-data collection with
`Production requires ECOM_ENGINE=woocommerce`, because a fresh worktree has no
`apps/storefront/.env.local` (it is gitignored). Copying that local file in and rebuilding
exits 0. The failure is correct behaviour — production genuinely requires a real engine —
and it is recorded here so the next verifier is not surprised by it.

## What the verification does **not** establish

This verifies that the repository is internally consistent and that the checks are
honest. It does **not** verify that a customer can buy anything. Specifically, none of
the following was executed anywhere in this round:

1. A browser placing a real order against live WooCommerce (stock, totals, shipping,
   tax, retry, out-of-stock).
2. RFQ persistence, staff access or concurrent conversion against a real WordPress
   database.
3. The PHP/HPOS/Store API compatibility suite against WordPress.
4. A real backup import with an observed rollback.
5. A second isolated client with its own deployment, WordPress, database and secrets.
6. Owner-supplied merchant facts and product-claim sources.

The browser measurement that *was* executed failed the touch-target budget: the smallest
measured target is 16.5px against a 44px minimum. That is a real defect, and it is
recorded as a failure, not smoothed over.

## Verdict

**PASS for the scope claimed**: the twelve audit findings are addressed in source, the
false passes fail closed, the storefront builds, lint and the full local check suite
pass at the verified commit, and the evidence states its own limits. The audit's
release-level claims remain unsatisfied, and nothing here should be read as release
certification. Production cutover still requires the explicit human authorization
already written into `release/APPROVAL.md`.
