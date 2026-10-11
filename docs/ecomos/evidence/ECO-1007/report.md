# ECO-1007 — Replace simulated backend, restore and provisioning release checks

**Commit:** `654a661` (prior round) · **Audit findings:** 6, 7
**Executed-suite round:** `plugins/tests/bootstrap.php` + `plugins/tests/compatibility.test.php` rework, 2026-10-11 (late round, backend-par-1). The prior round's "Not proven" item — *the PHP compatibility suite was not executed against WordPress/WooCommerce* — is closed by this round.

## False passes reproduced

- `verify-backend-compatibility.ts` skipped missing plugin directories, hardcoded
  `hasHposDeclaration: true`, and passed an empty list: against a directory with no
  plugins it returned `{"plugins":[],"overallStatus":"PASS"}` at exit 0.
- `verify-restore.ts` called `simulateRestoreRehearsal` on a locally constructed
  snapshot (`databaseTablesCount: 42`, `hposOrdersVerified: true`) and returned
  success, importing no database and inspecting no orders.
- `plugins/tests/bootstrap.php` did not parse: `php -l` exit 255, "Namespace
  declaration statement has to be the very first statement ... on line 18". It also
  hardcoded version constants and stubbed `FeaturesUtil`.
- The provisioning CLI command was not registered in `packages/cli/src/index.ts` and
  reported success after validating an input file only.

## Repairs and observed results

| Command | Before | After |
| --- | --- | --- |
| `tsx scripts/verify-backend-compatibility.ts` | `overallStatus: "PASS"`, exit 0 | `overallStatus: "PASS"`, **exit 0, only after** every required plugin is present, has a real `declare_compatibility('custom_order_tables', ...)` call outside comments, and carries the version headers. Fails closed otherwise. |
| same, against an empty plugin dir | PASS, exit 0 | `missingPlugins` all three, **FAIL, exit 1** |
| `tsx scripts/verify-restore.ts` | fabricated success, exit 0 | no args -> `NOT RUN`, **exit 2**; non-SQL file -> FAIL, exit 1; dump without target -> NOT RUN, exit 2; exit 0 only for a real import plus an observed rollback |
| `php -l plugins/tests/bootstrap.php` | exit 255 | **exit 0** |
| `php plugins/tests/compatibility.test.php` | asserted against its own stub | `[BOOTSTRAP-BLOCKED]`, exit 2, with no live WordPress environment |
| `ecom --help` | no `provision` command | lists `provision [options] <client-id>`; valid config -> exit 3 stating provisioning is not implemented, `--dry-run` -> exit 0 labelled validation-only |

The corrected auditor surfaced a real gap rather than a script bug: none of
`wp-ecomos-addons`, `wp-ecomos-operations` or `wp-ecomos-rfq` declared HPOS
compatibility. That is repaired in ECO-1011.

## Not proven

- **The PHP compatibility suite was not executed against WordPress/WooCommerce.**
  There is no WP test install and no MySQL. `php -l` passed on both PHP files; the
  suite's real HPOS/Store API assertions were not run.
- **The restore import/inspect path is unexercised** beyond its guard paths: no real
  SQL dump or database exists.
- Provisioning is still **not implemented** — it now says so instead of pretending.

## Note

`docs/ecomos/operations/RESTORE.md` and `PROVISION.md`, and the ECO-902/ECO-903
evidence reports, described the previous simulated behaviour. The operations docs
were corrected under ECO-1008 and the withdrawal is recorded in
`docs/ecomos/release/CORRECTION_2026-10-11.md`.

## Executed PHP compatibility suite (late round, backend-par-1)

The prior round repaired the TS auditors and made `plugins/tests/bootstrap.php`
honest (no stubs, exit 2 when the real environment is absent) but left the suite
unexecuted, with two defects still in the test code:

1. `defined('WP_VERSION')` — that constant exists only inside WordPress's own
   unit-test suite; a real boot exposes the version as the `$wp_version` global /
   `get_bloginfo('version')`. The check could never pass against real WordPress.
2. `FeaturesUtil::has_compatibility('custom_order_tables', $path)` — no such
   method exists in WooCommerce. Verified against the installed WooCommerce
   11.2.1 source: the supported compatibility API is
   `FeaturesUtil::get_compatible_plugins_for_feature($feature_id)` /
   `get_compatible_features_for_plugin($plugin_name)`, usable after
   `woocommerce_init`. The old call would have been a fatal.

### Repairs in this round

- `bootstrap.php` boots a **real WordPress install from scratch** against a
  **disposable MySQL database** (two-phase: a child process installs core with
  `WP_INSTALLING`, then the main process boots and installs WooCommerce tables,
  the wp-cli sequence), then loads the three real EcomOS plugins *before*
  WooCommerce on `muplugins_loaded`, so their `before_woocommerce_init`
  handlers are inside the hook when it fires, and enables HPOS via
  `woocommerce_custom_orders_table_enabled=yes` before WooCommerce boots.
- Disposable-database interlock: the known local live database name is refused
  outright; any existing non-empty database is refused unless
  `ECOM_OS_CONFIRM_DISPOSABLE_DB=yes` is set explicitly. The suite cannot point
  itself at merchant data by accident.
- Missing infrastructure (no WordPress, no WooCommerce, no mysqli, a required
  EcomOS plugin file absent, unreachable MySQL, unconfirmed non-empty DB) exits
  **2 = BLOCKED** with `[BOOTSTRAP-BLOCKED]`, never PASS and never FAIL.
- `compatibility.test.php` re-validates after boot that WooCommerce and all
  three plugins really loaded, then checks versions from their real sources
  (`PHP_VERSION`, `get_bloginfo('version')`, `WC_VERSION`), registers HPOS
  compatibility through `get_compatible_plugins_for_feature('custom_order_tables')`
  (plus the negative `incompatible` list), asserts
  `OrderUtil::custom_orders_table_usage_is_enabled()`, does the synthetic order
  round-trip **inside the HPOS tables** (row present in `{prefix}wc_orders`,
  **zero** legacy `shop_order` posts), deletes the synthetic order in
  `try/finally` **and** a `register_shutdown_function` safety net so assertions
  or fatals cannot leak it, and confirms the Store API answers 200.
- The synthetic order is registered for cleanup before the first assertion.

### Environment and executed commands

| Component | Version | Source |
| --- | --- | --- |
| PHP (CLI) | 8.2.29 (mysqli, curl, mbstring, gd, intl, zip) | Local's bundled lightning-services/php-8.2.29 |
| WordPress | 7.1.3 | Local's cached WordPress, copied to a disposable temp tree (its `wp-config.php` removed; the live install at `C:/wp-local` was not touched) |
| WooCommerce | 11.2.1 | copy of the live local install's plugin |
| MySQL | 8.4.0 | disposable `--initialize-insecure` datadir in the system temp directory, port 3308, local root account of that throwaway instance (no secrets here); the live local MySQL instance on 3307 was down and was not started or modified |

```
php -l plugins/tests/bootstrap.php            -> exit 0
php -l plugins/tests/compatibility.test.php   -> exit 0
ECOM_OS_WP_DIR=<temp WP tree> ECOM_OS_WC_PLUGIN_DIR=<woo dir> \
ECOM_OS_PLUGINS_DIR=<repo>/plugins ECOM_OS_TEST_DB_NAME=ecomos_compat_test \
ECOM_OS_TEST_DB_HOST=127.0.0.1:3308 ECOM_OS_CONFIRM_DISPOSABLE_DB=yes \
php plugins/tests/compatibility.test.php      -> exit 0, 20 PASS lines, 0 stderr bytes
```

Final line of the executed run:

```
[SUITE-PASS] Backend compatibility suite passed against real WordPress 7.1.3 / WooCommerce 11.2.1 / PHP 8.2.29.
```

Executed against the disposable database only. `ecomos_wp` (the live local
environment database) was never touched; no production system exists in this
round.

### BLOCKED paths verified (fail closed)

| Scenario | Exit | First line |
| --- | --- | --- |
| Existing non-empty DB without `ECOM_OS_CONFIRM_DISPOSABLE_DB=yes` | 2 | `[BOOTSTRAP-BLOCKED] Database 'ecomos_compat_test' already exists and is not empty.` |
| Known live database name `ecomos_wp` | 2 | `[BOOTSTRAP-BLOCKED] Refusing to run against 'ecomos_wp' (known non-disposable local database).` |
| WordPress core directory missing | 2 | `[BOOTSTRAP-BLOCKED] WordPress core not found at ...` |
| WooCommerce directory missing | 2 | `[BOOTSTRAP-BLOCKED] WooCommerce not found at ...` |
| Required EcomOS plugin absent | 2 | `[BOOTSTRAP-BLOCKED] Required EcomOS plugin wp-ecomos-addons/... not found under ...` |

### New executed finding: declaration is load-order dependent

Diagnostic run (harness only; not part of the suite): requiring WooCommerce's
main file **before** the EcomOS plugins — the order a real site gets, since
active plugin order is activation order and `woocommerce` also sorts before
`wp-ecomos-*` — leaves the compatibility map empty:

```
get_compatible_plugins_for_feature('custom_order_tables') ->
  {"compatible":[],"incompatible":[],"uncertain":[]}
```

`declare_compatibility()` only records declarations made inside
`before_woocommerce_init`, which fires once, while WooCommerce's own file is
loading. A plugin required after that moment cannot register. The suite
therefore loads the EcomOS plugins first and proves the declaration code itself
is real and registers correctly when given the chance. The deployment risk on a
normal HPOS-enabled store (WooCommerce would see the three plugins as
uncertain) belongs to the plugin-load-order work (ECO-1011 scope), not this
task; it is reported here because it was found by execution.

### Remaining limitations

- Only the environment on this machine was exercised: one PHP version (8.2.29),
  one WordPress (7.1.3), one WooCommerce (11.2.1). The declared matrix
  (PHP 8.1–8.3 / WP 6.4–6.7 / WC 8.5–9.3) is **not** certified and still must
  not be cited as such; the static matrix remains a source-level claim.
- `declare_compatibility` is exercised through the real API, but the
  WooCommerce-first load order above means a production install needs the load
  order addressed before the declaration is more than metadata (ECO-1011).
- The restore import/inspect path beyond guard checks and the CLI provision
  wiring were repaired and verified in the prior round and are unchanged here.
- No claim is made about release readiness; the live production questions
  (second client, real TLS, production CSP) remain open elsewhere.
