# ECO-1106 — restore fidelity and safe rollback

- **Agent:** `sprint-recovery-1` (executor, platform) · **Coordinator:** `sprint-lead-1`
- **Base:** `ceb8f3da1c20c7254e6f19f8cad5cca324476202` (the accepted ECO-1105 restore isolation)
- **Branch:** `sprint-a/recovery-ECO-1105` · **Worktree:** `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/ecomos-recovery-ECO-1105`
- **Verdict: fidelity verified against a real dump, and the source is proven unchanged for
  successful and failed restores alike.**

## 1. Fidelity — a real dump, 26 checks, all passing

Restored `C:/wp-local/ecomos-backup2.sql` (289,750 bytes, 54 tables, single schema) through the
isolated service, as the restricted user, with the gate passing:

```
tsx scripts/verify-restore.ts --dump C:/wp-local/ecomos-backup2.sql   -> exit 0 VERIFIED
```

**Gate checks (10)** — the isolation actually holding, read rather than assumed:

| Check | Observed |
| --- | --- |
| `gate-port` | `@@port = 3309` |
| `gate-datadir` | the directory provisioned for this run, under `%TEMP%/ecomos-restore-isolation/…` |
| `gate-identity` | `CURRENT_USER() = restore_importer@127.0.0.1` — not root |
| `gate-no-global-privilege` | no global privilege (USAGE only) |
| `gate-target-only-grants` | all schema grants on `restore_target` only |
| `gate-no-grant-option` | no `WITH GRANT OPTION` |
| `gate-restricted-privilege-set` | limited to SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES, CREATE TEMPORARY TABLES, LOCK TABLES |
| `gate-no-source-schema` | visible schemas: `information_schema`, `performance_schema`, `restore_target` — **no source schema** |
| `gate-no-file-io` | `local_infile=0`, `secure_file_priv` confined |

**Completeness (2)** — `tables-imported` 54; `required-tables-present` all 5 required tables.

**HPOS order fidelity (10)** — `wp_wc_orders` present with **10 orders**; 0 orders with an empty
status; **0 orders with a null `total_amount`** (a null total is a silent data defect, not a
cosmetic one); order items and itemmeta restored; 16 order items; **10 `_qty` meta rows** and
**10 `_variation_id` meta rows** — the variation identity the directive asked for is present in
the restored data, not merely assumed.

**RFQ fidelity (5)** — quotes and revisions tables restored; 0 quotes with an empty state;
`converted_order_id` present; **4 converted quotes with 0 dangling links**; **0 orphan
revisions**.

## 2. Source unchanged — successful and failed restores alike

The protection is structural: the importer is never connected to a source service. The
**evidence** is a fingerprint of the decoy source taken before and after **every** case — row
count, two independent CRC aggregates and `CHECKSUM TABLE` — asserted equal
(`scripts/verify-restore.test.mjs:152`, `assert.deepEqual(after, decoyBefore, 'decoy_source
changed during case …')`).

```
node --test scripts/verify-restore.test.mjs  -> exit 0, 23/23 passing
```

| Scenario | Case | Source afterwards |
| --- | --- | --- |
| **Successful** restore and inspection | compliant synthetic dump | unchanged |
| **Failed** — `USE decoy_source` | refused (1044) | unchanged |
| **Failed** — qualified `decoy_source.table` insert | refused (1142) | unchanged |
| **Failed** — `CREATE TRIGGER` / `EVENT` / `PROCEDURE` | refused (1142 / 1044) | unchanged |
| **Failed** — `LOAD DATA LOCAL INFILE` / `INTO OUTFILE` | refused (3948 / 1227) | unchanged |
| **Failed** — `GRANT` / `CREATE USER` | refused (1045 / 1227) | unchanged |
| **Failed** — `DROP DATABASE` / `TRUNCATE` / `DELETE` on the decoy | refused | unchanged |
| **Failed** — empty dump (zero tables) | FAIL, never success | unchanged |
| **Failed** — aborted import | FAIL, partial state named | unchanged |

That covers the directive's requirement in both directions: the source is unchanged after a
successful restore **and** after every failure mode.

## 3. Application and configuration rollback

Documented at [docs/ecomos/operations/rollback.md](../../operations/rollback.md). It separates
the three operations that get called "rollback" — data recovery, application/config reversal,
and deployment rollback (`release/ROLLBACK.md`) — because conflating them is how a restore
becomes a data-loss incident. It covers: the isolation rule; the fidelity checks a restore must
pass before it is believed; the failure-handling table; application reversal by `git revert`
rather than history rewriting, with the checks re-run; plugin reversal including the warning
that reversing a plugin does **not** reverse its schema migrations; configuration reversal with
the reminder that cache and revalidation state outlive a config change; and what is not
authorized.

## 4. Honest limits

1. **No destructive rollback drill, and none claimed.** `rollbackObserved` is always `false`:
   dropping the target is not authorized. What exit 0 certifies is separate service, restricted
   import, full inspection, non-destructive teardown.
2. **`_variation_id` is coverage, not always a positive assertion.** The restored catalogue has
   no variable products, so a zero count cannot distinguish "none expected" from "all lost" —
   the detail string says which case applied. A variable-product catalogue would be caught.
3. **Only a single-schema export restores.** A `mysqldump --databases` artifact fails by design
   at the restricted grants rather than being rewritten to redirect `USE`.
4. **No real production backup exists here**, so nothing is claimed about one. No live rollback,
   no concurrent restore-with-traffic.
5. **The failed-scenario source-unchanged proof runs against synthetic decoys** inside the
   isolated service, not against a live source — by design, since the whole point is never to
   point these fixtures at real data.

## 5. Not authorized, and not done

No `DROP`/`DELETE`/`TRUNCATE`/overwrite anywhere, in any scenario, including test cleanup.
Port 3308 was never contacted. No production, deployment or plugin action.

## 6. Submission — the verified chain, and a repeated hub base defect

| Item | SHA / value |
| --- | --- |
| ECO-1105 isolation (prerequisite, submitted) | `ceb8f3d` |
| This task's implementation and report | committed on `sprint-a/recovery-ECO-1105` |
| Isolated service used | own datadir under `%TEMP%/ecomos-restore-isolation/…`, port **127.0.0.1:3309** |
| Source service touched | **none** — port 3308's PID was unchanged before and after |
| Real dump restored | `ecomos-backup2.sql`, 289,750 bytes, 54 tables, single schema |

**What was executed by me rather than reported to me:** the no-artifact refusal (exit 2), the
real-dump restore (exit 0 VERIFIED), and `node --test scripts/verify-restore.test.mjs` (exit 0,
23/23) were each re-run in this worktree. The 26-check fidelity table in §1 is that run's own
output. This report measures and evidences; acceptance is the coordinator's on the verifier's
verdict.

**Hub base defect, repeated.** `ECO-1106` was assigned with base `a25c4bf` — this task's own
committed tip. `done` computes the submitted slice from that base, so it is empty and refuses
with *"Submit your own new tip commit, not another task submission"*; no commit can satisfy it.
This is the third instance of the same setting in this sprint (after ECO-1100's reopen set the
base to the worktree HEAD, and the ECO-1100 rebase stranded its base). The rule the coordinator
needs: **on assignment or reopen, set the base to a commit that precedes the executor's own
work for that task** — normally the accepted prerequisite commit (`ceb8f3d` here) — never to
the tip the executor is about to submit.
