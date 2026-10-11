# Rollback runbook — data, application and configuration

- **Task:** `ECO-1106` (fidelity and safe rollback) · **Status:** reverses are described and
  bounded; **no production action is authorized by this document**
- **Companion:** [release/ROLLBACK.md](../release/ROLLBACK.md) covers *deployment* rollback
  (switching traffic back to a previous known-good deployment). This document covers the two
  reverse operations that happen *before* any deployment question: recovering data and
  reverting application or configuration state.

## 1. Which rollback, and why the distinction matters

Three different things are called "rollback", and conflating them is how a restore becomes a
data-loss incident:

| Rollback | What it reverses | Owner here |
| --- | --- | --- |
| **Data recovery** | A restoration of database contents from a backup | this document, §2–§4 |
| **Application/config rollback** | Code, plugin and configuration changes | this document, §5 |
| **Deployment rollback** | Which build serves traffic | [release/ROLLBACK.md](../release/ROLLBACK.md) |

This runbook never authorizes the third, and never performs the second on production.

## 2. Data recovery — the isolation rule

**A restore is never performed against the live service.** It is performed into a separate
MySQL service with its own data directory, its own port and a restricted target-only
identity, by `scripts/restore-isolation` (see
[restore-isolation.md](restore-isolation.md) for provisioning and the fail-closed gate).

The rule exists because a database *name* is not a boundary. A dump can carry `USE other_db;`,
a fully-qualified `other_db.table` write, or a trigger, event or routine — each of which runs
against whichever service the importer is connected to, not whichever schema the operator
intended. Importing into the live service to "see if the dump works" is the failure this
runbook forbids.

| Step | Action | Command |
| --- | --- | --- |
| 1 | Prove the target service is isolated | `scripts/verify-restore.ts` gate; refuses before reading SQL |
| 2 | Import the dump into the isolated service | `scripts/verify-restore.ts --dump <path>` |
| 3 | Inspect completeness and fidelity | same run, §3 checks |
| 4 | Decide | on PASS, the dump is *restorable*; on FAIL, stop and investigate |
| 5 | Stop the isolated service | `scripts/restore-isolation` teardown — data left in place |

Exit codes are the contract: **0** VERIFIED, **1** FAIL, **2** NOT RUN (no artifact or no
isolated environment — this is a blocker, not a pass), **3** PARTIAL.

## 3. What a restore must prove before it is believed

A restore that imports "some tables" has not been verified. The checks are:

- **Schema completeness** — every expected table present. A **zero-table import is FAIL**, and
  no table count is ever hardcoded or assumed.
- **HPOS order fidelity** — orders present in the order tables with their line items, each
  line's `_variation_id` and `_qty` intact, and `total_amount` non-null and equal to the sum of
  its lines (a null total is a silent data defect, not a cosmetic one).
- **RFQ fidelity** — quotes and their revisions present, each revision referencing a real
  quote, the current-revision pointer resolving, and the quote→order link intact where a quote
  was converted.
- **Source unchanged** — the source's checksums and row counts are compared before and after.
  This is *additional* evidence, never the protection; the protection is that the importer is
  never connected to the source at all.

## 4. Failure handling

| Situation | Correct response |
| --- | --- |
| Gate refuses: target can reach the source | **Stop.** Do not import. Fix isolation; the safety property is broken |
| Import fails part-way | The isolated service holds a partial restore. It is **FAIL**, named as partial — never promoted, never reported as a success |
| Import succeeds, inspection fails | Investigate the dump or the expectation. Do not promote |
| No artifact or no isolated environment | **NOT RUN** (exit 2). A blocked check is not a passed check |
| Source checksums differ | **Stop everything.** Treat as a data-integrity incident |

**Destructive cleanup is disabled, deliberately.** The target service is stopped and its data
left in place. Dropping the target schema, the database or the user is a destructive operation
and is **not authorized** by this plan, including "tidying up after testing". Deleting and
recreating a database is not a rollback rehearsal.

## 5. Application and configuration rollback

Reverses a bad application, plugin or configuration change. Each step is bounded, and each is
recorded before it is performed so the reversal is itself reviewable.

**Application code**
1. Identify the exact commit range to reverse and confirm it is the cause. Reverting a change
   that is not the cause turns one defect into two.
2. Reverse with `git revert <sha>` (a new commit that undoes it) rather than force-pushing or
   rewriting history — history stays auditable, and the reversal is itself reversible.
3. Re-run the checks that the original change was supposed to satisfy. A revert that breaks
   something else has not rolled back; it has moved the failure.

**Plugins (WordPress/WooCommerce)**
1. Record the active plugin set and versions *before* changing anything.
2. Deactivate before replacing; never swap a plugin's files under a live request.
3. WooCommerce owns orders, stock, taxes and payment state. A plugin rollback must not touch
   order data; if it does, §2 applies instead.
4. Our own companion plugins run their own schema migrations. Reversing a plugin does **not**
   reverse its schema — that is a migration decision and needs explicit approval (§6).

**Configuration**
1. Environment configuration is the deployment's, not the repository's. Record the previous
   values before editing, by key, and never print secret values.
2. Reversal is a restore of those values, then a restart. Config changes take effect on
   restart; a "reverted" config that was never reloaded is still live.
3. Cache and revalidation state can outlive a config reversal. Revalidate or purge after
   rolling back, or the old behaviour persists invisibly.

## 6. What is not authorized

- **No destructive database operation** — no `DROP`, `DELETE`, `TRUNCATE` or overwrite of a
  database, schema, table or user, in production, in staging, or in the isolated test service.
  A specific destructive experiment requires the exact target and operation to be reviewed and
  explicitly approved first, by the owner, in writing.
- **No production action.** No deployment, DNS change, plugin installation on a real site, or
  payment exposure under this runbook.
- **No restore into a service that can reach the source.** If isolation cannot be proved, the
  restore does not run.
- **No restoring from an untrusted dump** into any service with access to real data.

## 7. Honest status

The isolation mechanism, gate, import, inspection and failure paths are implemented and
exercised by `scripts/verify-restore.test.mjs` against synthetic decoys. What has **not** been
exercised, and is not claimed here:

- A restore against a **real production backup**. None exists in this environment.
- A **live production rollback** of any kind.
- **Concurrent** restore and traffic.
- Migration reversal for companion plugin schema changes — flagged in §5 and unapproved.
