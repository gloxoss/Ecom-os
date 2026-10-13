# EcomOS migration notes

What an instance owner must do when updating from the starter. One section per release, newest first. `scripts/ecomos-release.mjs` refuses to tag a version that has no section here (write "None." when nothing is required). `scripts/ecomos-upgrade.mjs` prints the lines added since the instance's last sync.

Write each note as: what changed, who is affected, exact steps, how to confirm, how to roll back. Cover four areas when relevant: environment variables, dependencies, WordPress plugins and database, and behavior changes callers depend on.

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
