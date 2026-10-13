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
| 7 | New client needs a core file edit | Planning the ParaLoca instance | `client-profile.ts` and `packages/themes/src/index.ts` hard-registered client imports | `eb9a2ab`: registries generated from `clients/*/profile.ts` and `themes/src/clients/*/theme.ts` | FIXED |
| 8 | HPOS pre-check blocks enabling although the plugin declares support | Enabling HPOS on staging | WP-CLI reports the eCommerce bridge as "uncertain" | Documented override in `MIGRATIONS.md` | DOCUMENTED |
| 9 | WP-CLI cannot reach Local's database | Staging tooling | Local's MySQL port changes on every start | Helper script reads `my.cnf` and probes ports (machine-local, not in repo) | DOCUMENTED |
| 10 | First instance upgrade failed with "Committer identity unknown", and the script blamed conflicts | First real run of `ecomos-upgrade.mjs` on the ParaLoca instance | New clones have no git identity; the script treated every merge failure as a conflict | `40aa66b` (identity pre-check, honest error); creation skill now sets identity | FIXED |
| 11 | `THEME_NAME` in `.env.local` was ignored, the build silently used `angelina` | Building the ParaLoca instance | `apps/storefront/scripts/generate-theme.ts` read only the shell environment; an unknown name also fell back to the default theme | `generate-theme.ts` now loads `.env.local` and fails on an unknown theme | FIXED |
| 12 | The documented read-only connector got 403 on orders, products, brands and coupons | Verifying the instance connector | Role with only `read` + `manage_woocommerce` lacks read access to those resources; the storefront calls them | Role needs `read_private_shop_orders`, `read_private_products`, `read_private_shop_coupons`, `manage_product_terms` (key stays read-only, writes return 401). Added to creation checklist and INSTALL | DOCUMENTED |
| 13 | Generated files tracked in git differ per client (`addons.generated.ts`, `theme-vars.css`) | Building the ParaLoca instance | Instance builds rewrite tracked files, so every update can conflict on them | Proposed: stop tracking them or generate to an ignored path | OPEN |
| 14 | RFQ live browser spec could not run against an instance | Running specs on the ParaLoca instance | `sprint-b-rfq-live-browser.spec.ts` hard-coded `http://localhost:3000` | Spec reads `STOREFRONT_URL` | FIXED |
| 15 | Client profile does not drive the storefront shell: header says "Beano Coffee", `<html lang="en">` is fixed, landing and nav are the Angelina template | Inspecting the built ParaLoca instance | `getActiveClientProfile` is used only for theme colors and the quotes flag; brand name, logo, nav, footer, locale and landing content are not read from the profile | Proposed: profile-driven header, footer, locale and landing sections in the starter, with ParaLoca content in `clients/paraloca/` | OPEN |

## How to add a fix

1. Reproduce and fix it in the starter repository, with a test.
2. Add a row here with the commit.
3. Add a migration note if instances must act (`MIGRATIONS.md`).
4. Pull it into instances with `node scripts/ecomos-upgrade.mjs`.
