# Isolated restore runbook

- **Document**: `restore-isolation.md`
- **Status**: implemented, exercised on this machine against the real `EcomOS` WP/Woo dump
  (`/c/wp-local/ecomos-backup2.sql`, 54 tables) and against synthetic hostile dumps.
- **Scope**: `scripts/restore-isolation/`, `scripts/verify-restore.ts`,
  `scripts/verify-restore.test.mjs`.
- **Companion**: `RESTORE.md` (the operator restore procedure) and
  `evidence/ECO-1105/design.md` (the design this implements).

---

## 1. What "isolation" means here, and why a database name is not it

The previous `verify-restore.ts` imported the dump into a **database name** on the
**same MySQL service** that holds the source. A database name is not a boundary. The
dump's own statements decide where writes land, and several of them ignore the
connection's default schema entirely:

| Statement in the dump | What actually happens on a shared service |
| --- | --- |
| `USE source_db;` | the rest of the dump is applied to the **source** |
| `INSERT INTO source_db.t ...` | fully qualified write to the **source** |
| `CREATE TRIGGER` / `EVENT` / `PROCEDURE` | objects created on the **source** service |
| `LOAD DATA INFILE` / `SELECT ... INTO OUTFILE` | reads or writes files as the importer's OS user |
| `GRANT ...` / `CREATE USER ...` | the importer's account is widened, or a new one is made |

All of these run with the importing identity's privileges. A before/after checksum of
the source is *evidence after the fact*; it is not a boundary.

Isolation here is four separations, each independently sufficient:

1. **A separate service process.** A second `mysqld`, started and stopped by the
   harness, with its own pid file and log. The source service is never the process
   that executes the dump.
2. **A separate data directory.** A fresh directory created by
   `mysqld --initialize-insecure`, so a `USE`-qualified statement can only ever write
   inside that directory.
3. **Restricted, target-only credentials.** The importer holds exactly:
   `SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES,
   CREATE TEMPORARY TABLES, LOCK TABLES` on `restore_target.*` and nothing else. No
   `GRANT OPTION`, no `FILE`, no `SUPER`, no `CREATE USER`, no global privilege, and no
   access to any other schema.
4. **Loopback on its own port.** The service binds `127.0.0.1:3309` only
   (`--bind-address=127.0.0.1 --port=3309`). Port **3308 belongs to someone else** and
   is never contacted; `assertIsolationConnection()` refuses any other host/port, and
   the tests assert that refusal.

## 2. Module layout

```
scripts/restore-isolation/
  config.ts            ports, connection guards, privilege sets, non-destructive SQL guard
  provision-target.ts  init a fresh datadir, start mysqld on 127.0.0.1:3309, create the
                       target schema and the restricted user
  gate.ts              the fail-closed isolation gate
  import-dump.ts       import over the target connection only, as the restricted user
  inspect.ts           completeness / HPOS / RFQ inspection
  teardown.ts          stop the service; nothing destructive
  index.ts             orchestration + the status policy
```

`scripts/verify-restore.ts` keeps its CLI shape and exit codes and delegates the target
to `restore-isolation`. `scripts/verify-restore.test.mjs` is the hostile-dump suite.

## 3. Provision → import → inspect → teardown

Run from the repository root.

**Provision, import, inspect, teardown in one command:**

```bash
node node_modules/tsx/dist/cli.mjs scripts/verify-restore.ts --dump /path/to/dump.sql
```

Equivalent via the environment: `ECOM_OS_RESTORE_BACKUP=/path/to/dump.sql`.

Provisioning performs, in order:

1. Resolve the MySQL bin directory (contains `mysqld.exe`, `mysql.exe`, `mysqldump.exe`,
   `mysqladmin.exe`). Configure with `--mysql-bin-dir` or `ECOM_OS_MYSQL_BIN_DIR`.
   Default: `%APPDATA%/Local/lightning-services/mysql-8.4.0+2/bin/win64/bin`.
2. **Prove port 3309 is free and fail closed if it is not.**
3. `mysqld --no-defaults --initialize-insecure --basedir=... --datadir=<fresh>`.
4. Start `mysqld` with `--datadir=<fresh> --port=3309 --bind-address=127.0.0.1
   --pid-file=... --local-infile=0 --secure-file-priv=<run>/file-transfer --skip-log-bin
   --mysqlx=0`.
5. As **root of that service only**, create `CREATE DATABASE IF NOT EXISTS restore_target`
   and the restricted user with the target-only grant, for both `'...'@'localhost'` and
   `'...'@'127.0.0.1'` (reverse DNS may resolve either way).
6. Prove the restricted credentials work. Then the gate runs (section 4).

Run artefacts live under
`%TEMP%/ecomos-restore-isolation/<run-id>/` (`data/`, `file-transfer/`,
`mysqld.pid`, `mysqld.log`, `isolation-state.json`). Override the root with
`ECOM_OS_RESTORE_ISOLATION_ROOT`. `isolation-state.json` records the non-secret run
facts only; the restricted password is generated per run, held in memory, passed to the
client through `MYSQL_PWD` (never argv), and never written or printed.

**The dump must be a single-schema export.** A `mysqldump --databases` artifact carries
`CREATE DATABASE x; USE x;`; the importer has no privilege on `x`, so the import stops
at that line and the run reports FAIL with a hint to re-export. That refusal is the
protection working, not a bug. Isolation does **not** rewrite the dump to redirect those
statements, because silently rewriting where a dump writes is exactly the class of
behaviour that caused the original incident.

**Teardown** stops the service with `mysqladmin shutdown` (falling back to terminating
the pid recorded in the run's own pid file, and only if that pid file still names it).
It performs **no** `DROP`, `TRUNCATE`, `DELETE` or overwrite of any database, schema,
table or user, and **leaves the data directory in place** so the restored state stays
inspectable. Destructive cleanup is not implemented and there is deliberately **no flag
that turns it on**; adding one needs recorded owner approval first.

## 4. The fail-closed gate

The gate runs over the **target connection, as the restricted user**, and **before any
byte of the dump is read**. If any check is false the run imports nothing and exits
non-zero naming the failed gate.

| Gate | Check |
| --- | --- |
| `gate-port` | `@@port` is 3309 |
| `gate-datadir` | `@@datadir` is the directory just provisioned |
| `gate-identity` | `CURRENT_USER()` is the restricted user, never root |
| `gate-no-global-privilege` | `SHOW GRANTS` holds no global privilege (a bare `USAGE` on `*.*` is allowed) |
| `gate-target-only-grants` | no grant names any schema other than the target |
| `gate-no-grant-option` | no `WITH GRANT OPTION` |
| `gate-restricted-privilege-set` | every granted privilege is in the target-only set; none of `FILE`, `SUPER`, `CREATE USER`, `TRIGGER`, `EVENT`, `CREATE ROUTINE`, `RELOAD`, `SHUTDOWN`, `PROCESS`, `EXECUTION`, `SHOW DATABASES` |
| `gate-no-source-schema` | `information_schema.schemata` exposes no schema but the target and the MySQL system schemas |
| `gate-no-file-io` | `local_infile=0` and `secure_file_priv` sits inside the run directory |
| `gate-source-port-distinct` | a configured source port is not 3309 (present only when one is configured) |

## 5. Inspection

Covered over the target connection: table completeness, HPOS orders, RFQ quotes.

- **Table completeness** — the run requires `*wc_orders`, `*woocommerce_order_items`,
  `*woocommerce_order_itemmeta`, `*ecomos_rfq_quotes`, `*ecomos_rfq_revisions`
  (override with `--required-table <suffix>`, repeatable). The prefix is detected from
  the restored `*wc_orders`. **Zero tables is FAIL, never success.**
- **HPOS orders** — order rows present; no empty `status`; no null `total_amount`;
  order items present; `_qty` meta present; `_variation_id` meta covered (a zero count
  passes only when nothing in the restored item table carries a non-zero `variation_id`,
  i.e. the catalog has no variable products). Guest orders (`customer_id = 0`) are
  reported as a note.
- **RFQ** — quote `state` non-empty; revisions reference a real quote (no orphans);
  `*_ecomos_rfq_quotes.converted_order_id` exists and every non-null value references a
  real restored order (no dangling quote→order link).

## 6. Exit codes

| Code | Status | Meaning |
| --- | --- | --- |
| `0` | `VERIFIED` | Gate passed, the dump imported as the restricted user, every integrity check passed, and this run's isolated service was confirmed stopped (data directory left in place). |
| `1` | `FAIL` | A gate failed, the import was refused/aborted, the import produced zero tables, or an integrity check failed. Never claimed as a restore. |
| `2` | `NOT RUN` | Blocked on a real artifact or environment: no `--dump`, no MySQL binaries, or the isolated service could not be started. |
| `3` | `PARTIAL` | The restore imported and inspected cleanly, but this run's isolated service was not confirmed stopped (kept with `--keep-target`, or shutdown did not land). Not a complete rehearsal. |

`VERIFIED` does **not** include a destructive rollback drill. `rollbackObserved` is
always `false` because dropping the target to prove it can be dropped is not
authorized. The cycle that is verified is: separate service → restricted import →
inspection → non-destructive teardown.

## 7. What is NOT authorized

- **No destructive database operation anywhere** — no `DROP` of a database, schema,
  table, view, trigger, event, routine or user; no `TRUNCATE`; no `DELETE`; no
  overwrite. Not in the implementation, not in teardown, not in the tests. The test
  suite scans every module in `scripts/restore-isolation/` and `verify-restore.ts` and
  fails if a destructive statement appears.
- **No root import.** Root is used only to initialise the fresh data directory and to
  create the target schema and restricted user, and only against the service on 3309
  that this tool started. `importSqlText()` throws if handed a root connection.
- **No contact with port 3308 or any other service.** `assertIsolationConnection()`
  rejects any host/port other than `127.0.0.1:3309`.
- **No killing a process that was not started here.** Teardown terminates only the pid
  recorded in this run's pid file, and only when it still matches.
- **No secrets printed.** Passwords travel in `MYSQL_PWD`, never on a command line; error
  text is scrubbed before it is logged or reported.

## 8. Verifying the boundary itself

```bash
node --test scripts/verify-restore.test.mjs
```

The suite provisions one isolated service on 3309, creates a synthetic decoy schema
`decoy_source` inside it, and runs each hostile fixture through the real orchestration
against its own fresh target schema and restricted user. Each case asserts the outcome
*and* that the decoy is unchanged (row count, two CRC aggregates and `CHECKSUM TABLE`,
before and after). Fixtures: `USE other_db`, fully qualified `other_db.table`,
`CREATE TRIGGER`, `CREATE EVENT`, `CREATE PROCEDURE`, `LOAD DATA LOCAL INFILE`,
`SELECT ... INTO OUTFILE`, `GRANT`, `CREATE USER`, `DROP DATABASE`, `TRUNCATE` and
`DELETE` against the decoy, an empty dump (zero tables → FAIL), and a partial/aborted
import (FAIL with the partial state named). Nothing in the suite touches a real source
or port 3308.
