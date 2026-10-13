# EcomOS migration notes

What an instance owner must do when updating from the starter. One section per release, newest first. `scripts/ecomos-release.mjs` refuses to tag a version that has no section here (write "None." when nothing is required). `scripts/ecomos-upgrade.mjs` prints the lines added since the instance's last sync.

Write each note as: what changed, who is affected, exact steps, how to confirm, how to roll back. Cover four areas when relevant: environment variables, dependencies, WordPress plugins and database, and behavior changes callers depend on.

## 1.0.0-rc.4

- **Behavior: theme selection.** `THEME_NAME` set in `apps/storefront/.env.local` is now honored by `generate-theme.ts` (it was ignored; the build used `angelina`). An unknown theme name now stops the build instead of using the default theme. Instances that relied on the silent fallback must set a valid `THEME_NAME`. Confirm: `generate-theme.ts` prints `Generated theme-vars.css for theme: <your theme>`. Rollback: revert the merge.
- **Tooling.** `scripts/seed-instance-fixtures.php` seeds synthetic test products on any `*.local` site (`remove` mode deletes them); `apps/storefront/playwright.config.ts` reads `STOREFRONT_URL`.
- **WordPress connector role.** The read-only REST connector needs four read capabilities for the storefront to work: `read_private_shop_orders`, `read_private_products`, `read_private_shop_coupons`, `manage_product_terms` (see `.agents/skills/ecomos-instance-creation/references/instance-checklist.md`). The API key stays read-only.
- **Dependencies, environment.** None.

## 1.0.0-rc.3

- **Behavior: client registration is generated.** New tracked files `apps/storefront/src/clients.generated.ts` and `packages/themes/src/registry.generated.ts` are built by `node scripts/generate-clients.mjs` (run automatically by `predev` and `prebuild`). A client is now a folder: `clients/<id>/profile.ts` exporting exactly one `<name>Profile`, and `packages/themes/src/clients/<id>/theme.ts` exporting exactly one `<name>Theme`. Run the script after adding one; `pnpm guard` fails when the generated files are stale.
- **Who is affected.** Instances that edited `apps/storefront/src/lib/client-profile.ts` or `packages/themes/src/index.ts` to register a client. During the merge take the starter version of both files and delete the manual registration; the folders are discovered automatically.
- **Behavior change.** `getActiveClientTheme` now resolves every theme in the registry (including `angelina`, `luxury`, `minimal`) instead of falling back to the ParaLoca theme for ids it did not list.
- **Confirm.** `node scripts/generate-clients.mjs --check` prints "up to date"; type check and unit tests pass. Rollback: revert the merge.
- **Dependencies, WordPress, environment.** None.

## 1.0.0-rc.2

- **Dependencies.** `typescript` in `packages/brand-config` and `packages/ecom-engine` is now pinned to `^5.9.3` (it was `latest`, which resolved to 7.0.2 and broke type checking). `@ecom-os/addons-rfq` is now in `pnpm-lock.yaml`. Run `pnpm install --frozen-lockfile`. Confirm: `pnpm -r typecheck` passes. Rollback: revert the merge.
- **Behavior: order recovery.** `findOrderByAttemptCorrelation` now throws when its scan cap (default 10 pages x 100 orders, maximum 50 pages) is reached with every page full, instead of returning `null`. `executeIdempotentCheckout` already treats a thrown lookup as an unknown outcome and refuses to retry. Instances that call the function directly must treat a throw as "unknown", never as "no order exists".
- **Behavior: search suggestions.** `GET /api/search/suggestions` returns HTTP 503 (with empty groups) when the engine or product lookup fails. A genuinely empty catalog still returns 200. The built-in client fetcher already treats non-OK responses as empty.
- **WordPress / database.** No schema changes. HPOS is now exercised by the live specs with data sync on. To enable it on an instance site: back up the database, run `wp wc hpos sync`, then `wp wc hpos enable --with-sync`. If WP-CLI reports a plugin as "uncertain" although its code declares `custom_order_tables`, `--ignore-plugin-compatibility` is the documented override. Rollback: `wp wc hpos disable`, or restore the backup.
- **Environment variables.** No new required variables.
- **Operations rule.** Never start MySQL, PHP or nginx for a Local site outside the Local app (no custom supervisors). A second process tree holding the database lock makes Local fail with "Unable to start site".

## Template for the next release

```
## X.Y.Z

- **Dependencies.** ...
- **Behavior.** ...
- **WordPress / database.** ...
- **Environment variables.** ...
```
