# ECO-1213 evidence — scoped merchant jobs and existing addon lifecycle acceptance

- **Agent:** `sprint-recovery-1` (executor, platform) · **Coordinator:** `sprint-lead-1`
- **Assignment base:** `1f3f8f2ea5b65c76243da02ab5f83ec5649ae978` · **Branch:** `sprint-a/integrated`
- **Worktree:** `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/ecomos-recovery-ECO-1100`
- **Verdict:** a store manager really completes stock, order and content jobs against real
  WordPress/WooCommerce, unprivileged staff are refused, addon on/off agrees across the
  capability layers and leaves core data alone, and the lifecycle is idempotent and
  recoverable. The new suite also **found and fixed a real defect that made the "never touch
  core tables" migration guard a no-op on any install with a custom table prefix** (§3).

## 1. Environment

| Component | Value |
| --- | --- |
| WordPress / WooCommerce | 7.1.3 / 11.2.1, HPOS custom order tables enabled |
| PHP / MySQL | 8.2.29 / 8.4.0 at `127.0.0.1:3308` |
| Test database | `ecomos_compat_test`, disposable, table prefix `wpt_` |
| Node (for the JS contract suites) | v24.21.0 |

The `wpt_` prefix matters: it is the reason the defect in §3 was reachable at all.

## 2. What was exercised

The new live suite is `plugins/tests/merchant-jobs.test.php`. It boots the real install
through `plugins/tests/bootstrap.php`, creates real users holding the real roles, and does the
jobs through the real APIs. 50 assertions, exit 0:

```
ECOM_OS_WP_DIR=C:/wp-local/wp
ECOM_OS_WC_PLUGIN_DIR=C:/wp-local/wp/wp-content/plugins/woocommerce
ECOM_OS_TEST_DB_NAME=ecomos_compat_test ECOM_OS_TEST_DB_HOST=127.0.0.1:3308
ECOM_OS_CONFIRM_DISPOSABLE_DB=yes
php -c C:/wp-local/php.ini plugins/tests/merchant-jobs.test.php   -> exit 0
```

| Area | Proved |
| --- | --- |
| Role model | `ecomos_operator` and `ecomos_fulfillment` are registered in WordPress and core roles survived registration |
| Manager jobs | The operator stock edit persisted (7 → 3 when re-read); the status change persisted (order reads `processing` and lives in the `wpt_wc_orders` HPOS table, no legacy post); the front-page content change persisted on the configured front page |
| WooCommerce accounting | Processing the 2-unit order reduced stock 3 → 1, so the merchant flow is not bypassing WooCommerce's own accounting |
| Fail closed | A subscriber is refused all eight jobs and every REST permission callback returns a 403 `WP_Error`; the fulfillment clerk may view and progress orders but is refused products, inventory, coupons, content, quotes and technical settings; the store manager is refused `technical_settings` and holds none of `manage_options`, `edit_plugins`, `activate_plugins`, `edit_themes`, `edit_files`, `unfiltered_html` |
| Addon projection | With `quotes` off the quote job is refused for **every** role including the platform administrator; turning it on permits administrator and manager, still refuses the clerk, and the REST layer agrees. Catalog product, its stock and the order status are unchanged by both toggles |
| Lifecycle | Installing the same addon twice is idempotent (one registry entry, original install time kept); migrations run once and a second run applies nothing; rollback reverses applied versions in order; deactivation records retained data and stops the addon reading as enabled; an addon whose files vanished is reported missing instead of fataling; catalog, stock, orders and posts survive all of it |

Regression suites re-run after the plugin change, all exit 0:

| Suite | Command | Result |
| --- | --- | --- |
| Backend compatibility (real WP/WC) | `php -c ... plugins/tests/compatibility.test.php` | exit 0, 20 assertions |
| Plugin contract suites | `node --test plugins/wp-ecomos-operations/tests/*.spec.mjs plugins/wp-ecomos-addons/tests/*.spec.mjs` | exit 0, 13/13 |
| Standalone PHP suites | `capabilities.test.php`, `admin.test.php`, `workflows.test.php`, `lifecycle.test.php` | exit 0 each (capabilities: 24 assertions) |
| Typecheck | `pnpm --filter @ecom-os/engine-woocommerce typecheck` | exit 0 |

## 3. Defect found and fixed: the core-table migration guard was a no-op on a custom prefix

`ecomos_addon_migrate_up()` and `ecomos_addon_rollback_down()` claim the safety invariant
"never allow DROP or ALTER on core WooCommerce tables". The check was:

```php
preg_match('/\b(DROP|ALTER)\s+TABLE\s+(wp_)?(posts|postmeta|wc_orders)\b/i', $sql)
```

The prefix is hardcoded to the optional literal `wp_`. This install's prefix is `wpt_`, so the
pattern does not match its own core tables:

```
SQL: DROP TABLE wpt_posts
old pattern blocks it: NO
new pattern blocks it: YES
```

**Consequence, observed, not theorised.** The first run of the new suite carried that exact
statement as a migration. The guard did not block it, `$wpdb->query()` executed it, and the
install's posts table was gone for the rest of the run: a front page created moments earlier
counted zero. Anything shipped this way on a custom-prefix install could delete the posts,
postmeta or HPOS orders tables through an ordinary addon migration, and the same hole sat in
the rollback path.

**Fix** (`plugins/wp-ecomos-addons/lifecycle.php`): one helper, `ecomos_sql_targets_core_table()`,
used by both directions. It builds the target list from the live `$wpdb->prefix` and keeps
`wp_` as a second candidate for dumps restored under a different prefix; it covers `DROP`,
`ALTER` **and** `TRUNCATE`, and it tolerates a schema-qualified name (`` `other_db`.`wpt_posts` ``)
instead of letting the qualifier defeat the match. The suite proves the guard refuses all four
of those forms, still refuses to over-block (an `ALTER` on the addon's own table executes), and
that the posts table survives the refused migration.

## 4. NOT RUN — not claimed here

- **The admin-page redirect.** `ecomos_enforce_admin_boundaries()` ends in `wp_die()`, which
  terminates the process, so its 403 cannot be asserted in-process. Its guard and page list are
  covered by the source contract suites only; no live HTTP request was made.
- **A real browser session.** Every capability decision here was checked at the layer that makes
  it (`ecomos_check_permission`, `ecomos_rest_require_capability`), not through the rendered UI.
- **Any WordPress/WooCommerce/PHP combination other than 7.1.3 / 11.2.1 / 8.2.29.**
- **The RFQ plugin.** Reviewed as a neighbour, not edited: its implementation belongs to Agent 2
  under ECO-1212/ECO-1202.
- **Residual guard gap, stated plainly:** `DROP DATABASE`, `DELETE FROM` and `RENAME TABLE`
  against core tables are still not blocked, and an addon can still rewrite its own tables
  freely. The invariant is narrower than "a migration cannot destroy data".

## 5. Files changed

- `plugins/wp-ecomos-addons/lifecycle.php` — prefix-aware core-table guard, used by both
  migration directions.
- `plugins/tests/merchant-jobs.test.php` — new live acceptance suite (50 assertions).
- `docs/ecomos/evidence/ECO-1213/report.md` — this report.
