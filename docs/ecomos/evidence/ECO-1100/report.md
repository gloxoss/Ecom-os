# ECO-1100 — A0 pinned baseline

- **Agent:** `sprint-recovery-1` (executor, platform) · **Coordinator:** `sprint-lead-1`
- **Assignment base:** `89c4482bffb28e3ea29363578d6781d1bd2774f7` on `fix/ecomos-phase-0`
- **Worktree:** `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/ecomos-recovery-ECO-1100` (fresh, detached at the base; `.audit-verify` not reused, per the assignment)
- **Verdict: RED.** One package typecheck fails. **A0 is BLOCKED** until it is green.

## 1. Inventory at the pinned base

```
SHA    89c4482bffb28e3ea29363578d6781d1bd2774f7
branch fix/ecomos-phase-0     worktree HEAD matches the assignment base
```

Python 3 is **not** installed on this machine (`python3`/`python` both absent; the Windows
Store alias intercepts it) — recorded because any later task assuming a Python helper script
would fail here. Node 24.21.0, PHP 8.2.29 (Local), MySQL 8.4.0, pnpm 11.7.0 via `npx -y`.

Preserved, untouched, in the authoritative tree: modified `plugins/wordpress-mcp`; untracked
`.agent-hub/plans/`, `docs/ecomos/evidence/PLAN-002/`,
`plugins/wp-ecomos-rfq/tests/state-machine.harness.php`.

## 2. Full baseline, every command executed in the isolated worktree

Dependencies installed there first: `npx -y pnpm@11.7.0 install --no-frozen-lockfile --offline`
→ exit 0, 19.1s. `apps/storefront/.env.local` copied from the authoritative tree (build input,
never printed).

| # | Check | Command | Exit | Result |
| --- | --- | --- | --- | --- |
| 1 | Engine import guard | `tsx scripts/check-engine-imports.ts` | **0** | clean |
| 2 | Storefront typecheck | `tsc -p apps/storefront/tsconfig.json --noEmit --incremental false` | **0** | no output |
| 3 | Package typechecks (7) | `tsc -p packages/<pkg>/tsconfig.json --noEmit …` | **2 for one** | `engine-woocommerce` **FAILS**; other six exit 0 |
| 4 | Lint | `eslint . --ignore-pattern ".next*"` (storefront) | **0** | 0 errors, 28 warnings |
| 5 | Unit tests | `vitest run` | **0** | **521 passed, 62 files** |
| 6 | Hub tests | `node --test .agent-hub/test/*.test.mjs` | **0** | 16 passed, 0 failed |
| 7 | Production build | `next build --webpack` (apps/storefront) | **0** | `Compiled successfully`, 45 static pages |
| 8 | PHP lint | `php -l` on every plugin PHP file (PHP 8.2.29) | **0** | all clean |
| 9 | Backend compatibility auditor | `tsx scripts/verify-backend-compatibility.ts` | **0** | `overallStatus: "PASS"` |
| 10 | Restore script, no artifact | `tsx scripts/verify-restore.ts` | **2** | `status: "NOT RUN"` — refuses, as designed |

Checks 1–6 ran at `89c4482` in the worktree; 7–10 likewise. No check was skipped and none was
disabled.

## 3. The failure — exact, bounded, one cause

```
packages/engine-woocommerce/src/checkout-attempts.ts(204,31): error TS2379
packages/engine-woocommerce/src/checkout-attempts.ts(232,11): error TS2375
packages/engine-woocommerce/src/checkout-attempts.ts(256,11): error TS2375
packages/engine-woocommerce/src/checkout.ts(58,3):             error TS2375
packages/engine-woocommerce/src/checkout.ts(92,5):             error TS2375
```

Five errors, one cause. `tsconfig.base.json` sets `exactOptionalPropertyTypes: true`, so an
optional property `email?: string` cannot be assigned `string | undefined`:

```
Types of property 'email' are incompatible.
  Type 'string | undefined' is not assignable to type 'string'.
```

The sites are `email: existing?.email` in `checkout-attempts.ts` (three places) and
`email: billingEmail(input)` / `email: check.email` in `checkout.ts` (two). Each can be
`undefined`. The fix is the same shape at all five: spread the property only when defined,
e.g. `...(existing?.email ? { email: existing.email } : {})`.

**Why it matters beyond the package.** `pnpm -r typecheck` includes per-package typechecks
and is part of CI, so the pipeline is red while this stands. The storefront typecheck passes
because it does not surface the package's own tsconfig strictness — which is exactly why A0
must run every package, not only the app.

**Provenance, honestly.** Both files were changed by the predecessor `claude-platform`
session (`e2c3858`-era owner-bound attempt work), not by me. `backend-par-1` has separately
flagged unsubmitted `claude-platform` commits `5ed681c`/`3f5fb3a` inside its `ECO-1007` slice
(base `fa2e0ba`) — the same legacy-provenance issue, which needs recording and coordinating
rather than asserting as independent work.

## 4. A measurement error of mine, corrected

An intermediate pass in this session reported all seven package typechecks as exit 0 in the
worktree. **That reading was wrong and is withdrawn.** The loop printed
`"$(basename $p)=$?"`, and the command substitution inside the echo ran first, resetting `$?`
to basename's own 0. Re-run with the exit code captured immediately, `engine-woocommerce`
exits 2 with the same five errors — identical to the authoritative tree, and matching the
`--showConfig` comparison (same effective options, same 24 files, same source, same
TypeScript build hash `967000e3…` in both trees).

The scare in the other direction is worth recording too: an early check suggested the
failure might be a stale-dependency artifact of the authoritative tree. It is not. The
failure is real at the pinned commit and reproduces in a clean install.

## 5. Requested action — blocking A0

A bounded preflight repair in the **commerce** lane (PLAN.md assigns Agent 1 cart
synchronisation, checkout correctness and attempt durability; `packages/engine-woocommerce`
is that lane). I have not touched it.

- **Files:** `packages/engine-woocommerce/src/checkout-attempts.ts`,
  `packages/engine-woocommerce/src/checkout.ts`
- **Scope:** the five optional-`email` assignments only — no behaviour change, no check
  disabled, no config relaxation
- **Acceptance:** `tsc -p packages/engine-woocommerce/tsconfig.json --noEmit --incremental false`
  exits 0, `vitest run` still 521 passing, and the engine import guard still exits 0
- **Then:** A0 can be re-measured green and ECO-1105/ECO-1106 activated

## 6. BLOCKED / NOT RUN

- **BLOCKED:** A0 green baseline — one package typecheck red (above).
- **BLOCKED:** `ECO-1105`, `ECO-1106` — not assigned, and A0 must be green first.
- **NOT RUN:** storefront browser budget, real-browser checks, and the PHP test suite — these
  belong to later assigned tasks; the browser budget also needs a served storefront and the
  `browser` resource, neither held here.
- **NOT RUN:** restore/recovery execution — that is `ECO-1105` and it needs its own isolated
  service, which this task deliberately did not create.

---

# Addendum — A0 re-measured GREEN after the ECO-1099 preflight fix

## What changed

The coordinator assigned the bounded preflight repair as **`ECO-1099`** to
`sprint-commerce-1`, against exactly the two files this report named. It landed as:

```
5a8780d  fix(engine): exactOptionalPropertyTypes email compatibility and cart multiset sync
         packages/engine-woocommerce/src/checkout-attempts.ts   |   7 +-
         packages/engine-woocommerce/src/checkout.ts            |   5 +-
         packages/engine-woocommerce/src/cart.ts                | 189 +++++++-
         packages/engine-woocommerce/src/__tests__/cart.test.ts | 223 +++++++++
```

The five `exactOptionalPropertyTypes` errors are gone.

## How this was measured, and what I did not do

The fix's files were checked into this worktree's **working tree** only
(`git checkout 5a8780d -- packages/engine-woocommerce/src`) so the checks could run against
the fixed source. They were then restored to this worktree's HEAD
(`git checkout HEAD -- packages/engine-woocommerce/src`). **Nothing of the fix's author's work
is committed, staged or claimed here** — `5a8780d` remains theirs, on their branch, untouched.
The measurement is of their commit; the ownership is theirs.

Confirmed both directions: at the pinned base `89c4482` the engine typecheck still reports
**5 errors**, and with `5a8780d` applied it reports **0**.

## A0 re-measured with the fix — all green

| # | Check | Command | Exit | Result |
| --- | --- | --- | --- | --- |
| 1 | Engine import guard | `tsx scripts/check-engine-imports.ts` | **0** | clean |
| 2 | Storefront typecheck | `tsc -p apps/storefront/tsconfig.json --noEmit --incremental false` | **0** | no output |
| 3 | Package typechecks (7) | `tsc -p packages/<pkg>/tsconfig.json --noEmit` | **0 all** | `engine-woocommerce` now passes |
| 4 | Lint | `eslint . --ignore-pattern ".next*"` | **0** | 0 errors |
| 5 | Unit tests | `vitest run` | **0** | **529 passed** (up from 521; the fix adds 8) |
| 6 | Hub tests | `node --test .agent-hub/test/*.test.mjs` | **0** | 16 passed |
| 7 | Production build | `next build --webpack` | **0** | `Compiled successfully` |
| 8 | Backend compatibility auditor | `tsx scripts/verify-backend-compatibility.ts` | **0** | PASS (measured earlier; no PHP changed) |
| 9 | PHP lint | `php -l` every plugin file | **0** | clean (measured earlier; no PHP changed) |
| 10 | Restore script, no artifact | `tsx scripts/verify-restore.ts` | **2** | `NOT RUN` — refuses, as designed |

**A0 is GREEN at `5a8780d`** on the evidence of the commands above. It is the coordinator's
call to integrate that commit and re-pin the base; this task does not do it.

## One observation for the coordinator, not a defect claim

`5a8780d` is larger than the bounded repair requested: alongside the five type-error fixes it
adds 189 lines to `cart.ts` and 223 lines of tests, i.e. cart multiset synchronisation, which
is `ECO-1101`'s subject. That may be deliberate bundling of a prerequisite, and it is the
author's scope decision — but it means the preflight fix carries behaviour change beyond
`exactOptionalPropertyTypes` compatibility, and the independent verifier should know that the
type-error fix and a cart-behaviour change arrive in the same SHA rather than treating
"baseline turns green" as proof the latter is correct.

## Status

`ECO-1100` is re-submitted at a new SHA for a fresh review, since the plan requires a new
SHA and a new review after a fix. `ECO-1105` and `ECO-1106` remain OPEN and unassigned and
are not started.
