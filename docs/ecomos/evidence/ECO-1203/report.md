# ECO-1203 evidence — supported backend boot, reproducible CI and operational recovery

- **Agent:** `sprint-recovery-1` (executor, platform) · **Coordinator:** `sprint-lead-1`
- **Assignment base:** `6bcd767edbeec70091995c0788379193e6fe2d17` · **Branch:** `sprint-a/integrated`
- **Worktree:** `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/ecomos-recovery-ECO-1100`
- **Verdict:** the backend really boots and the HPOS/Store API paths really work on one
  measured combination; three previously unenforced checks are now in CI. One documented
  command in the task brief does not work as written. Everything not listed as RUN below is
  unproven and claimed nowhere in this report.

## 1. Environment that was actually exercised

| Component | Value |
| --- | --- |
| Node | v24.21.0 local; CI workflow pins 22 |
| PHP | 8.2.29 (Local by Flywheel), `-c C:/wp-local/php.ini` |
| MySQL | 8.4.0, `127.0.0.1:3308` (the local environment; port 3309 is the restore-isolation port) |
| WordPress / WooCommerce | 7.1.3 / 11.2.1, HPOS custom order tables enabled |
| Test database | `ecomos_compat_test`, disposable, recreated per run |

There is no `php` and no usable `pnpm` on `PATH` on this machine; PHP was invoked by absolute
path and pnpm through `npx -y pnpm@11.7.0` (or `node node_modules/tsx/dist/cli.mjs`). The
commands below are the ones actually run, not the ideal ones.

## 2. Executed checks

| Check | Command | Result |
| --- | --- | --- |
| Backend declaration gate | `pnpm exec tsx scripts/verify-backend-compatibility.ts` | exit 0, PASS for `wp-ecomos-addons`, `wp-ecomos-operations`, `wp-ecomos-rfq` |
| Real backend boot + HPOS + Store API | `php -c C:/wp-local/php.ini plugins/tests/compatibility.test.php` with `ECOM_OS_WP_DIR`, `ECOM_OS_WC_PLUGIN_DIR`, `ECOM_OS_TEST_DB_NAME=ecomos_compat_test`, `ECOM_OS_TEST_DB_HOST=127.0.0.1:3308`, `ECOM_OS_CONFIRM_DISPOSABLE_DB=yes` | exit 0, 20 assertions PASS |
| Same suite, no disposable confirmation | same command without `ECOM_OS_CONFIRM_DISPOSABLE_DB` | exit 2 BLOCKED (fail-closed observed, see §3.4) |
| Plugin contract suites | `node --test plugins/wp-ecomos-operations/tests/*.spec.mjs plugins/wp-ecomos-addons/tests/*.spec.mjs` | exit 0, 13/13 pass |
| Restore isolation + hostile dumps | `node --test scripts/verify-restore.test.mjs` | exit 0, 23/23 pass (provisions a real isolated `mysqld` on 3309) |
| Engine import guard | `node node_modules/tsx/dist/cli.mjs scripts/check-engine-imports.ts` | exit 0, "Engine imports and addon runtime exports clean" |
| Guard self-test | `node --test scripts/check-engine-imports.test.mjs` | exit 0, 13/13 pass |
| Production runtime security | `cd apps/storefront && node ../../node_modules/tsx/dist/cli.mjs ../../scripts/verify-production-runtime.mjs` | exit 0, CSP/nonce/account containment, revalidate `no-store, private`, fail-closed config |
| PHP capability / admin / workflow suites | `php -c ... plugins/wp-ecomos-operations/tests/{capabilities,admin,workflows}.test.php` | exit 0 each (capabilities: 24 assertions) |
| Addon lifecycle | `php -c ... plugins/wp-ecomos-addons/tests/lifecycle.test.php` | exit 0 |

The booted compatibility run is the substantive one. Against real WordPress 7.1.3 and
WooCommerce 11.2.1 it proved: PHP/WP/WC meet the declared minimums; all three companion
plugins are registered HPOS-compatible through `get_compatible_plugins_for_feature()` and none
are registered incompatible; HPOS custom order tables are the effective storage; a
`wc_create_order()` round-trip persists into the HPOS orders table with no legacy
`shop_order` post; a guest order keeps `customer_id = 0`; the synthetic order is deleted
afterwards; and `GET /wc/store/v1/products` returns 200 from the real Store API.

## 3. Findings

**3.1 The brief's runtime command does not work as written.** `node
scripts/verify-production-runtime.mjs` from the repository root exits 1 with
`ERR_MODULE_NOT_FOUND: Cannot find module ...\next\server` imported from
`next-intl/dist/esm/production/middleware/middleware.js`. Cause: the installed `next@16.3.8`
publishes no `exports` map, so Node's ESM resolver cannot satisfy the extensionless
`next/server` subpath; the same failure hits `next/server` from any directory under plain
`node`, and under `tsx` the `@/` tsconfig aliases fail unless the working directory is
`apps/storefront`. The working invocation is the one recorded in §2 and it is now what CI
runs. The script itself is sound: all three check groups pass once it resolves.

**3.2 The backend gate is a declaration gate, not a compatibility test.** Its own header says
so: it proves the plugins exist and declare HPOS opt-in and version headers. It would pass on
a backend that boots and fails everywhere. The compatibility claim in this report rests on the
PHP suite, not on this gate.

**3.3 CI enforced none of this.** `.github/workflows/ci.yml` ran guard, lint, typecheck,
`test:coverage`, `hub:test`, gitleaks, trivy and the storefront build on Node 22. No backend
gate, no production-runtime check, no plugin contract suites, no PHP, no restore tests. Three
steps were added (all infra-free, all verified locally with the exact commands above):
the backend gate, the plugin contract suites, and the production runtime checks. The PHP
compatibility suite and `verify-restore.test.mjs` are deliberately **not** added: the first
needs a WordPress + WooCommerce install and the second needs a MySQL service, neither of which
the current job provides.

**3.4 Fixture safety behaved as designed.** Pointed at an existing, non-empty
`ecomos_compat_test` without `ECOM_OS_CONFIRM_DISPOSABLE_DB=yes`, the bootstrap refused with
exit 2 and named the reason. It also refuses the known live database name outright.

## 4. NOT RUN — explicitly unsupported or unproven

- **Any combination other than WordPress 7.1.3 / WooCommerce 11.2.1 / PHP 8.2.29.** The
  declared floors (PHP 8.1, WC 8.5, WP 6.4) were never booted on their own. There is no
  version matrix here, only one measured point.
- **CI on a real runner.** The workflow has never been observed executing; the three new steps
  were validated by running their exact commands on this machine (Windows, Node 24), not on
  `ubuntu-latest`.
- **Non-HPOS storage mode.** HPOS was enabled for the whole run; legacy post storage was not
  exercised.
- **Multisite, alternative database engines, PHP 8.3+.** Untested.
- **A real production backup, a live production rollback, or concurrent restore and traffic.**
  None were performed; `rollback.md` §7 already discloses the same gap.
- **Restore-suite execution in CI.** `verify-restore.test.mjs` auto-detects a local MySQL
  binary and provisions its own service; running it in CI needs a service container first.

## 5. Runbook revalidation against the verified isolation model

`docs/ecomos/operations/rollback.md` and `restore-isolation.md` were re-read against what the
tests actually prove. They are consistent and needed no correction: the isolation rule (never
import into the live service), the `127.0.0.1:3309` binding with 3308 explicitly reserved for
the local environment, the exit-code contract (0 VERIFIED / 1 FAIL / 2 NOT RUN / 3 PARTIAL),
destructive cleanup left disabled, and §7's honest list of what is not claimed. The 23-test
suite confirms the port gate, the target-only privilege set, the absence of destructive SQL,
and that no fixture references the real source.

## 6. Files changed

- `.github/workflows/ci.yml` — three steps added (§3.3).
- `docs/ecomos/evidence/ECO-1203/report.md` — this report.

Two files modified in this worktree by the preceding ECO-1107 session
(`docs/ecomos/evidence/ECO-1107/report.md`, `docs/ecomos/release/SPRINT_A_ACCEPTANCE.md`) were
left untouched and are not part of this commit.
