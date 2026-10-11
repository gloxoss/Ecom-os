# ECO-1002 — Final-HEAD reproducibility, guard, gate runner and provenance

**Commits:** `b8f87cc` (resolution, guard, build) · **Audit findings:** 9, 10

## Reproduced before, repaired after

The audited checkout could not run its own checks. Three `@ecom-os/*` symlinks in
`apps/storefront/node_modules` pointed into the force-removed worktree
`C:/dev/ecomos-eco301`.

| Check | Before | After |
| --- | --- | --- |
| `node node_modules/vitest/vitest.mjs run` | exit 1 — 435 passed, 7 files failed (workspace packages unresolved) | **exit 0 — 521 passed, 62 files** |
| `node node_modules/typescript/bin/tsc -p apps/storefront/tsconfig.json --noEmit --incremental false --pretty false` | exit 2 — 112 errors | **exit 0 — 0 errors** |
| `node node_modules/tsx/dist/cli.mjs scripts/check-engine-imports.ts` | exit 1 — `packages/addons-rfq/src/index.ts is missing runtime export 'register'` / `'disable'` | **exit 0 — clean** |
| `node --test scripts/check-engine-imports.test.mjs` | exit 0 — 13/13 | exit 0 — 13/13 |
| `node --test .agent-hub/test/*.test.mjs` | exit 0 — 16/16 | exit 0 — 16/16 |

Repairs: `pnpm install` restored the links (and `pnpm-lock.yaml` gained the RFQ
addon's missing dependencies); `packages/addons-rfq` gained the runtime
`register`/`disable` contract. The 13 passing guard regression tests did not mean
the guard passed against the repository, and still do not — the guard is now run
against the repository itself.

## Gate runner mismatch (finding 10)

The recorded gate 9 command combined two test runners and fails as written:

```
node node_modules/tsx/dist/cli.mjs --test apps/storefront/e2e/release.spec.ts \
  apps/storefront/e2e/profile-reuse.spec.ts \
  apps/storefront/src/__tests__/security/health.test.ts
-> exit 1, 9 passed / 1 failed
```

`health.test.ts` imports `vitest`; it cannot load under `node:test`. Split, both pass:

| Command | Result |
| --- | --- |
| `tsx --test apps/storefront/e2e/release.spec.ts apps/storefront/e2e/profile-reuse.spec.ts` | exit 0 — 9 passed |
| `vitest run apps/storefront/src/__tests__/security/health.test.ts` | exit 0 — 2 passed |

## Provenance (finding 10)

Gate 3 recorded `0955d63075d92f9e47296a777285c37670ad8f2b`, an orphan commit that
added only `PHASE_3_REPORT.md` and is **not** an ancestor of HEAD
(`git merge-base --is-ancestor 0955d630 HEAD` -> false; no children, on no branch).
All five Phase 3 task SHAs are ancestors of `18c8b1a0`, the integrated parent.

Gate 3 was re-recorded against an integrated commit with the Phase 3 checks actually
executed there:

| Check | Result |
| --- | --- |
| `vitest run apps/storefront/src/features/catalog apps/storefront/src/components/search packages/ecom-engine/src/search` | exit 0 — 100 passed |
| `tsc -p apps/storefront/tsconfig.json --noEmit --incremental false` | exit 0 — 0 errors |

## Limits

No fresh production build at the time of this task; that is ECO-1012/ECO-1013. The
recorded checks are single-host and local; nothing here exercises WordPress.
