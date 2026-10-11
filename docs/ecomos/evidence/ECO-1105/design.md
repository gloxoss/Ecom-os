# ECO-1105 — isolated restore service: read-only design

**Status: DESIGN ONLY. Not implemented.** ECO-1105 is OPEN and unassigned; A0 (`ECO-1100`)
is RED. This note is the read-only design COMMON.md permits while waiting. No file under
`scripts/restore-isolation/` has been created and no database service has been started,
stopped or written to by this work.

## 1. Why the current design cannot satisfy the acceptance

`scripts/verify-restore.ts` takes `ECOM_OS_MYSQL_HOST`, `_PORT`, `_USER`, `_BIN` and two
database **names** — `--source-db` and `--target-db`. One service, one identity, two
databases in it:

```ts
function mysqlConnectionArgs(): string[] {
  const host = process.env.ECOM_OS_MYSQL_HOST;   // one host
  const port = process.env.ECOM_OS_MYSQL_PORT;   // one port
  const user = process.env.ECOM_OS_MYSQL_USER;   // one identity
```

A target database name is therefore not isolation. Anything in the dump that does not
respect the database name in the connection — a `USE other_db;`, a fully qualified
`other_db.table`, a trigger, an event, a routine, `LOAD DATA ... INTO TABLE other_db.t`, or
a `CREATE TABLE ... SELECT` across schemas — runs with the importing identity's privileges on
the same service the source lives on. My own predecessor session demonstrated one variant of
this by accident: a `mysqldump --databases` artifact carried `USE ecomos_wp`, and the import
landed in the **source** database. The script correctly reported `0 tables in target` and
exited 1, but the protection was luck, not design.

## 2. What "isolated" has to mean here

Four separations, each independently sufficient to protect the source:

1. **Separate service process** — a second `mysqld` with its own `--datadir`, its own port,
   its own socket/pid, started and stopped by the restore harness. The source service is
   never the process that executes the dump.
2. **Separate data directory** — on a path the restore harness owns. A `USE`-qualified
   statement can then only ever write inside that datadir.
3. **Restricted, target-only credentials** — the importing identity has privileges on the
   **target schema only**: no `GRANT OPTION`, no global `FILE`, no `SUPER`, no `CREATE USER`,
   no access to any source schema. `GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER,
   INDEX, REFERENCES, CREATE TEMPORARY TABLES, LOCK TABLES ON restore_target.* TO ...`.
4. **Source read-only and unreachable for writes** — the dump is produced by a separate,
   read-only identity (`SELECT`, `LOCK TABLES`, `SHOW VIEW`, `TRIGGER`, `EVENT` only), and the
   importing identity has **no route** to the source service: different port, and the harness
   passes only the target connection to the importer.

A before/after checksum of the source is **additional** evidence, never the boundary — PLAN.md
says so explicitly, and it is right: a checksum detects damage after the fact, it does not
prevent it.

## 3. Proposed shape

```
scripts/restore-isolation/
  provision-target.ts     # init a fresh datadir, start a second mysqld on a free loopback port,
                          # create the target schema and the restricted user, prove reachability
  import-dump.ts          # import ONLY over the target connection, with the restricted user
  inspect.ts              # completeness/fidelity queries over the target connection
  teardown.ts             # stop the service; destructive cleanup DISABLED by default
  index.ts                # orchestration + the fail-closed gate
```

**Fail-closed gate, before any SQL is read** (the plan's phrase: "fail before importing SQL
when isolation cannot be proved"):

1. Target service answers on its own port, and its `@@datadir` is the one provisioned.
2. `SELECT @@port`, `@@datadir`, `CURRENT_USER()` on the target connection equal what was
   provisioned — service-identity confusion is the failure mode being prevented, so it is
   checked rather than assumed.
3. The target user's effective grants, read from `SHOW GRANTS`, contain **no** global
   privilege and no schema other than the target.
4. Source connection, if used at all, is a different port AND its grants are read-only.
5. Only then is the dump opened. Any gate failure exits non-zero with the failing gate named.

## 4. Required tests (synthetic decoys only)

Run against fresh synthetic decoy schemas inside the isolated service — never against the
source or real staging data:

| Fixture | Expected |
| --- | --- |
| `USE source_db; INSERT …` in the dump | writes only inside the isolated datadir; source untouched; either refused or confined |
| Fully qualified `source_db.table` insert | refused by privileges, or confined to the isolated service |
| `CREATE TRIGGER` / `CREATE EVENT` / `CREATE PROCEDURE` | created in the isolated service only; never on the source |
| `LOAD DATA LOCAL INFILE` / `INTO OUTFILE` | blocked by the restricted grants (no `FILE`) |
| `GRANT` / `CREATE USER` in the dump | refused (no `GRANT OPTION`, no `CREATE USER`) |
| Zero tables imported | must be FAIL, never success |
| Partial import (aborted mid-dump) | must be FAIL with the partial state named, not treated as a restore |

Each case asserts the **source's** checksum and row counts are unchanged afterwards.

## 5. Constraints this design respects

- **No destructive operation is authorized**, including dropping the target after testing.
  `teardown.ts` stops the process and leaves data; destructive cleanup stays behind an
  explicit flag that is off, and any DROP/truncate needs recorded owner approval first.
- **No root credentials.** The provisioning identity creates the restricted user; the import
  and inspection paths never run as root.
- **No raw SQL against a source service.** The source is only ever dumped, read-only.
- **No reuse of unknown services.** `127.0.0.1:3308` is currently listening and is not mine;
  it is reported to the coordinator and will not be used.

## 6. Open questions for the coordinator

1. **Which worktree?** PLAN.md forbids reusing `.audit-verify` without handoff. The design
   assumes a fresh `sprint-a/recovery-ECO-1105` worktree from an accepted base.
2. **Service lifetime.** Start the isolated `mysqld` per restore run, or provision once and
   keep it for the task? Per-run is stronger isolation and slower; the plan's wording
   ("fresh synthetic environments") reads as per-run.
3. **Port allocation.** A fixed uncontested port is simpler; a free-port probe avoids
   collisions with the unknown 3308. The design assumes a probe that fails closed if the
   chosen port is already listening.
