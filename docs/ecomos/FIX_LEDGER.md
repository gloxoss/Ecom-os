# Upstream fix ledger

Rule: a problem found in a client instance (or in a live test against one) is fixed in the **starter first**, then pulled into every instance. This ledger records each one so the same problem is not met twice. Add a row when you find a problem, even if the fix is small, and mark `OPEN` until it lands in the starter.

| # | Problem | Found where | Root cause | Starter fix | Status |
|---|---|---|---|---|---|
| 1 | Fresh install failed with `--frozen-lockfile` | First clean clone of the ParaLoca instance | `4f5b07a` added `@ecom-os/addons-rfq` to `apps/storefront/package.json` without updating `pnpm-lock.yaml` | `72de430` | FIXED |
| 2 | `pnpm -r typecheck` failed in `brand-config` | CI-equivalent run | `"typescript": "latest"` resolved to 7.0.2, which removed `baseUrl` | `221d595` | FIXED |
| 3 | Live catalog test picked the wrong product | HPOS re-test after seeding 103 products | Fixture finder took the first simple product from the newest 100 | `5832f9e` | FIXED |
| 4 | Search outage looked like "no results" | Follow-up audit | Route swallowed engine errors and returned an empty 200 | `7b14b19` | FIXED |
| 5 | Absent order could be reported from a capped scan | Follow-up audit | Lookup returned `null` after its page cap | `e99ce47` | FIXED |
| 6 | Local site would not start | Staging bring-up | A custom supervisor script ran MySQL outside Local and held the database lock | Process rule in `MIGRATIONS.md` and `PROGRESS.md` | FIXED (rule) |
| 7 | New client needs a core file edit | Planning the ParaLoca instance | `apps/storefront/src/lib/client-profile.ts` hard-registers `paraloca` and `demo-2` imports | Proposed: generate the registry from `clients/*/profile.ts` like `addons.generated.ts` | OPEN |
| 8 | HPOS pre-check blocks enabling although the plugin declares support | Enabling HPOS on staging | WP-CLI reports the eCommerce bridge as "uncertain" | Documented override in `MIGRATIONS.md` | DOCUMENTED |
| 9 | WP-CLI cannot reach Local's database | Staging tooling | Local's MySQL port changes on every start | Helper script reads `my.cnf` and probes ports (machine-local, not in repo) | DOCUMENTED |

## How to add a fix

1. Reproduce and fix it in the starter repository, with a test.
2. Add a row here with the commit.
3. Add a migration note if instances must act (`MIGRATIONS.md`).
4. Pull it into instances with `node scripts/ecomos-upgrade.mjs`.
