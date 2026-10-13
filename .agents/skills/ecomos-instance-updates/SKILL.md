---
name: ecomos-instance-updates
description: Update a client instance from the EcomOS starter, cut starter releases, and write migration notes. Use when asked to update or upgrade an instance, pull starter changes or enhancements, see what is new, merge a new EcomOS version into ParaLoca or another client, tag or release EcomOS, or write migration or changelog notes. Not for creating a new instance (use ecomos-instance-creation).
---

# EcomOS instance updates and releases

Updates flow one way: **starter to instance**, by git merge from the `starter` remote. Instances never push core changes back; they request them upstream (`ecomos-upstream-first`).

## Update an instance

Run from the instance root, tracked files clean:

1. **Preview (changes nothing):** `node scripts/ecomos-upgrade.mjs`. It fetches tags, shows incoming commits, counts core/plugin/dependency changes, prints new migration notes, lists files changed on both sides and runs a trial merge. Default target is the newest `vX.Y.Z` tag, else the starter branch tip.
2. **Read the migration notes** (`docs/ecomos/MIGRATIONS.md`) and the changelog. If WordPress plugins changed, back up the instance database first.
3. **Apply on a new branch:** `node scripts/ecomos-upgrade.mjs --apply --verify` (set `ECOM_PNPM` if `pnpm` needs a wrapper). It merges to `upgrade/<target>-<date>`, aborts cleanly on conflict, and leaves your branch untouched.
4. **Run the full gate** on that branch: guard, lint, typecheck, unit tests, build, then the live specs on the instance's staging site. `--verify` only runs the guard and unit tests; it says so.
5. **Merge to the instance branch** only after staging passes. Production only with explicit owner authorization, with a backup and a rollback plan.

If the preview lists "files changed on BOTH sides", the instance edited core. Move that edit into the starter or behind a client-owned file, then update.

## Cut a starter release

1. Make sure `docs/ecomos/CHANGELOG.md` has a `## [X.Y.Z]` section and `docs/ecomos/MIGRATIONS.md` has a `## X.Y.Z` section (write "None." if nothing is required).
2. Dry run: `node scripts/ecomos-release.mjs X.Y.Z --verify`. It checks a clean tree, a free tag, both sections, then runs the guard and unit tests.
3. Cut: `node scripts/ecomos-release.mjs X.Y.Z --yes`. It bumps the root version, commits and creates annotated tag `vX.Y.Z`. It never pushes.
4. Pre-releases use `-rc.N`. A tag is not a production certification: lint, typecheck, build and live specs are separate gates, and release status follows `docs/ecomos/release/`.

## Write good migration notes

For each release cover only what applies: environment variables, dependencies, WordPress plugins and database, behavior changes callers depend on. For every note say who is affected, the exact steps, how to confirm, and how to roll back. Database or plugin schema changes always need a note and a backup step.

## Limits to state honestly

- Merges are manual; there is no one-command provisioning (`docs/ecomos/operations/PROVISION.md`).
- Until a team agrees a release cadence, instances should pin tags, not follow the branch.
- The scripts do not deploy, push, or touch WordPress. Plugin updates on the instance's WordPress are a separate, backed-up step.
