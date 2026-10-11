# ECO-1007 — Replace simulated backend, restore and provisioning release checks

**Commit:** `654a661` · **Audit findings:** 6, 7

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
