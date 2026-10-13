# Updating a client instance from the EcomOS starter

An instance (for example `C:\dev\paraloca-store`, branch `paraloca-instance`) is a git clone of this starter. Its remote `starter` points at the starter repo, so improvements flow one way: starter to instance.

## Keep merges clean

- Change core code (`packages/`, `apps/storefront/src`, `plugins/`, `scripts/`) only in the starter, then pull it into instances.
- Client-specific work stays in client-owned places: `clients/<client>/`, `packages/themes/src/clients/<client>/`, `apps/storefront/.env.local`, content, and addons the client owns. These rarely conflict with starter changes.
- If an instance needs a core change, make it in the starter (behind config or an addon) and pull it back. A hand edit to core in the instance becomes a merge conflict later.

## Update steps

1. In the instance: `git status` must be clean. Commit or stash first.
2. `git fetch starter`, then read `git log HEAD..starter/<branch> --oneline` and the starter's `docs/ecomos/CHANGELOG.md`.
3. `git merge starter/<branch>` (or merge a tagged release once tags exist).
4. `pnpm install --frozen-lockfile`, then run guard, lint, typecheck, unit tests and build.
5. Run the live specs against the instance's own staging site before deploying. Deploy staging first, production only with explicit authorization.
6. If a starter change touches WordPress plugins, update them on the instance's WordPress through its own staged process and keep a database backup first.

## Limits today

- There are no release tags or semantic versions yet. Until tagged releases exist, instances follow a starter branch tip, which is less safe than pinning a tag.
- There is no automated upgrade or provisioning command (`PROVISION.md`). Updates are manual git merges.
- Database or plugin schema changes need their own migration notes in the starter changelog.
