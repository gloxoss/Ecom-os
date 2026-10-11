# ECO-1105 — restore service isolation

- **Agent:** `sprint-recovery-1` (executor, platform) · **Coordinator:** `sprint-lead-1`
- **Assignment base:** `5dd5bce44e73f4c62732d6d0e79d7b3c099c63eb` · **Branch:** `sprint-a/recovery-ECO-1105`
- **Worktree:** `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/ecomos-recovery-ECO-1105`
- **Verdict: the target is now a structurally separate MySQL service, and the gate refuses
  before any dump SQL is read.**

## 1. What was wrong before

`scripts/verify-restore.ts` imported a dump into a database **name** on the **same MySQL
service** that holds the source. `ECOM_OS_MYSQL_HOST/PORT/USER` were single-valued, so
`--target-db` chose only a schema inside a service the source also lived in. A dump carrying
`USE other_db;`, a fully-qualified `other_db.table` write, a trigger, an event, a routine or
`LOAD DATA INFILE` executes against whichever service the importer is connected to. My own
predecessor session demonstrated one variant by accident: a `mysqldump --databases` artifact
carried `USE ecomos_wp` and the import landed in **the source database**.

## 2. What isolation means now

| Separation | Implementation |
| --- | --- |
| **Separate service process** | `mysqld` with its own fresh `--datadir`, pid file, and a socket bound to **127.0.0.1:3309 only** |
| **Separate data directory** | provisioned per run under the isolation root |
| **Target-only restricted user** | grants limited to the target schema: `SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES, CREATE TEMPORARY TABLES, LOCK TABLES`. No `GRANT OPTION`, no `FILE`, no `SUPER`, no `CREATE USER`, no global and no second-schema privilege |
| **Source unreachable for writes** | the importer is never connected to the source; the source is dumped by a separate read-only path |
| **Fail-closed gate before any SQL is read** | see §3 |

`rollbackObserved` and any checksum comparison are *additional* evidence; the protection is
that the importer is never on the source service.

## 3. The gate — runs before the dump is opened

`scripts/restore-isolation/gate.ts`, called from `index.ts` in the order
`provision → create schema + user → GATE → open dump → import → inspect → teardown`. If any
check fails, nothing is imported and the failing gate is named:

1. `@@port` equals the isolation port.
2. `@@datadir` is the directory just provisioned (service-identity confusion is the failure
   mode being prevented, so it is read, not assumed).
3. `CURRENT_USER()` is the restricted user — never root.
4. `SHOW GRANTS` for that user: no global privilege, no second schema, no `WITH GRANT OPTION`.
5. A configured **source** port, if the caller has one, differs from the isolation port.

## 4. Evidence — commands I executed and their results

Verified by me in the worktree at the base above, after the implementer's own run.

| Check | Command | Exit | Observed |
| --- | --- | --- | --- |
| No artifact | `tsx scripts/verify-restore.ts` | **2** | `status: "NOT RUN"`, `[RESTORE-NOT RUN]` — refuses |
| Real dump through the isolated service | `tsx scripts/verify-restore.ts --dump C:/wp-local/ecomos-backup2.sql` | **0** | VERIFIED; 289,750-byte, 54-table single-schema dump; gate passed; teardown stopped the service |
| Hostile-dump suite | `node --test scripts/verify-restore.test.mjs` | **0** | **23/23 pass** |
| Orphan check after the runs | `netstat` | — | port 3309 clear; **port 3308's PID unchanged (34064)** — never contacted |

The suite's own assertions include the properties that matter: *a configured source on the
isolation port is refused before provisioning*, *the restricted user holds the target-only
privilege set and nothing else*, *the implementation contains no destructive SQL statement*,
and *no fixture or test file references the real source or a non-isolated target*. Hostile
fixtures — `USE decoy_source`, qualified insert, `CREATE TRIGGER`/`EVENT`/`PROCEDURE`,
`LOAD DATA LOCAL INFILE`, `INTO OUTFILE`, `GRANT`, `CREATE USER`, `DROP DATABASE`, `TRUNCATE`,
`DELETE` — are each refused by the restricted grants, and each case asserts the decoy source is
unchanged afterwards by row count, two CRC aggregates and `CHECKSUM TABLE`.

Two behaviours worth naming because they are the isolation *working*:

- A `mysqldump --databases` artifact **fails** at exit 1: it carries `CREATE DATABASE x; USE x;`
  and the importer is not privileged on `x`, so the import stops and nothing is created. The
  importer deliberately does **not** rewrite the dump to redirect those statements.
- An empty dump is **FAIL** on `tables-imported`; a partially imported dump is **FAIL** naming
  the partial state. Zero tables is never success.

## 5. Honest limits — carried from the implementation, and mine to state

1. **`VERIFIED` no longer includes a destructive rollback drill.** `rollbackObserved` is always
   `false`, because dropping the target is not authorized. Exit 0 certifies: separate service,
   restricted import, full inspection, non-destructive teardown. Exit **3 PARTIAL** now means
   all checks passed but this run's isolated service was not confirmed stopped.
2. **Only a single-schema export restores.** A `--databases` artifact fails by design, as
   above; the runbook and the FAIL message say so.
3. **`_variation_id` is coverage, not always a positive assertion.** A zero count passes only
   when nothing in the restored order-items carries a non-zero `variation_id` — with a
   simple-product catalogue the check cannot distinguish "none expected" from "all lost", and
   the detail string says which case applied. A variable-product catalogue would be caught.
4. **The test suite reuses one isolated service** across fixtures through an explicit
   `existingService` seam (fresh schema and fresh restricted user per case) to keep runtime at
   ~30s. `verify-restore.ts` itself provisions a fresh service per run, as the design prefers.
   Per-case schemas remain in that service, intentionally, since destructive cleanup is not
   authorized.
5. **Isolation run directories are left under `%TEMP%/ecomos-restore-isolation/`** by design;
   nothing in the code deletes them.
6. `--confirm-drop` is accepted for CLI compatibility and ignored; `--confirm-target` is now
   optional, because the target is a fresh service by construction.
7. **Not run:** any real production backup (none exists), any live rollback, concurrent
   restore-with-traffic, or any production action.

## 6. Not authorized, and not done

No `DROP`/`DELETE`/`TRUNCATE`/overwrite of any database, schema, table or user — in the
implementation, in teardown, or in the tests. Destructive cleanup stays disabled. Port 3308 was
never contacted; the service on it belongs to another task. No production, deployment, DNS or
plugin-installation action was taken.
