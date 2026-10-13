# Updating a client instance from the EcomOS starter

An instance (for example `ParaLoca/paraloca-store`, next to this repo, branch `paraloca-instance`) is a git clone of this starter. Its remote `starter` points at the starter repo, so improvements flow one way: starter to instance.

Agent skills for this workflow ship with the starter: `ecomos-instance-creation`, `ecomos-instance-updates`, `ecomos-upstream-first`, `ecomos-code-map` (in `.agents/skills/`, with pointers in `.claude/skills/`).

## Keep merges clean

- Change core code (`packages/`, `apps/storefront/src`, `plugins/`, `scripts/`) only in the starter, then pull it into instances.
- Client-specific work stays in client-owned places: `clients/<client>/`, `packages/themes/src/clients/<client>/`, `apps/storefront/.env.local`, content, and addons the client owns.
- A problem found in an instance is fixed in the starter first and logged in `FIX_LEDGER.md` (`ecomos-upstream-first`).

## Update steps

From the instance root, tracked files clean:

1. Preview, changes nothing: `node scripts/ecomos-upgrade.mjs` (add `--to vX.Y.Z` to pick a release). It shows incoming commits, plugin and dependency changes, new migration notes, files changed on both sides and a trial merge.
2. Read `MIGRATIONS.md` and `CHANGELOG.md`. Back up the instance database if WordPress plugins changed.
3. Apply on a new branch: `node scripts/ecomos-upgrade.mjs --apply --verify`. Conflicts abort cleanly and leave your branch untouched.
4. Run the full gate on the upgrade branch (guard, lint, typecheck, unit tests, build) and the live specs on the instance's staging site.
5. Merge the upgrade branch into the instance branch. Production only with explicit authorization.

## Releasing the starter

`node scripts/ecomos-release.mjs X.Y.Z --verify` (dry run), then `--yes` to bump the version, commit and create annotated tag `vX.Y.Z`. It needs `CHANGELOG.md` and `MIGRATIONS.md` sections for that version and never pushes. Pre-releases use `-rc.N`. A tag is not a production certification.

## Limits today

- Updates are manual merges driven by the preview script; there is no one-command provisioning (`operations/PROVISION.md`) and no automatic deploy.
- `--verify` runs only the architecture guard and unit tests. Lint, typecheck, build and live specs stay your responsibility.
- Registering a brand-new client still edits `apps/storefront/src/lib/client-profile.ts` in the starter (fix ledger item 7).
- Database or plugin schema changes need their own migration notes and a backup step.
