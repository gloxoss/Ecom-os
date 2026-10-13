---
name: ecomos-upstream-first
description: Enforce that any bug, build failure, test failure or missing capability found while working in a client instance (paraloca-store or any client clone) is fixed in the EcomOS starter first, recorded in the fix ledger, then pulled back into instances. Use whenever a problem appears in an instance, before editing core files there, when asked to fix something in an instance, or when asked whether a fix belongs in the instance or the starter.
---

# EcomOS upstream-first rule

A fix made only inside one instance is lost to every other instance and returns as a merge conflict. So: **core problems are fixed in the starter, then pulled into instances.**

## Decide where a change belongs

Instance (this clone only):
- `clients/<id>/`, `packages/themes/src/clients/<id>/`, `apps/storefront/.env.local`, content, copy, product data, merchant facts, the instance's WordPress settings.

Starter (everything else), including:
- `packages/`, `plugins/`, `scripts/`, `apps/storefront/src/`, shared docs, tests, dependencies, lockfile, CI, hub tooling.

If unsure, treat it as starter work. A new client-specific capability that others could reuse should be built as an addon in the starter, switched on per client.

## Workflow when a problem appears in an instance

1. **Reproduce** it and write down the exact error, command and commit.
2. **Switch to the starter repo** (`../Ecom-os`). Fix it there with a test that fails first. Keep the commit small and conventional.
3. **Run the starter gate:** guard, lint, typecheck, unit tests (and build or live specs when the change touches them).
4. **Record it** in `docs/ecomos/FIX_LEDGER.md` (problem, where found, root cause, commit, status). Add a note to `docs/ecomos/MIGRATIONS.md` if instances must act.
5. **Pull it into the instance:** `node scripts/ecomos-upgrade.mjs` (preview), then `--apply`. Re-run the instance check that exposed the problem and confirm it now passes.
6. **Close the ledger row** as FIXED, or mark DOCUMENTED when the answer is a rule or workaround.

## Urgent hotfix on an instance

Allowed only when the instance is blocked. Make the smallest change on the instance, add a ledger row marked `OPEN` immediately, and backport the same change to the starter the same day (cherry-pick, then re-run the gate). Never leave an instance-only core edit unrecorded.

## Detect drift

From the instance: `git fetch starter && git diff --stat starter/sprint-integrated-authoritative -- packages plugins scripts apps/storefront/src`. The output should only show starter changes the instance has not pulled yet, never the instance's own edits. `node scripts/ecomos-upgrade.mjs` lists "files changed on BOTH sides" for the same reason.

## Always capture these as ledger rows

Clean-install failures, version drift (`latest` dependency pins), environment gotchas that cost time, tests that break when data grows, reports that disagreed with reality, and anything an agent had to work around. Honest wording matters: say PASS, FAIL, BLOCKED or NOT RUN, with the command and evidence.
