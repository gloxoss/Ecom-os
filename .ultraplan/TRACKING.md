# Tracking and daily handoff

## One source of live progress

`.agent-hub/.runtime/events.jsonl` is the canonical local journal. Do not edit it or generated BOARD/CHANGELOG manually. `active-plan.json` contains requirements and decomposition, with no independent completion flags. Planning state in STATE.md is not application state.

From Ecom-os:

```powershell
node .ultraplan/scripts/status.mjs
node .ultraplan/scripts/validate.mjs
node .agent-hub/hub.mjs check
node .agent-hub/hub.mjs next
```

The status view respects `ECOM_HUB_ROOT` / `ECOM_HUB_STATE_DIR` through the hub CLI. It is read-only and does not infer application proof. Preserve the canonical state directory; runtime journal is local/gitignored and should be backed up safely for handoff without publishing secrets.

## Before assigning

1. Inspect fresh HEAD/diff, current task owners, claims and phase gates. ECO-102 was already held, then accepted by another runner during this audit; use fresh status rather than a historical assignment.
2. Select a ready slice from the active manifest and verify intra-phase dependencies, not only coarse hub gates.
3. Assign original ECO task ID and exact current files. Proposed future files are explicit design paths; reconcile them with current modules before claiming, without broad ownership or duplicate implementations.
4. Acquire only required resources. Do not steal stale registrations/claims. At most four hub workers, and obey the lower provider/machine capacity; reserve a verifier.

## Evidence per slice

Keep the ordinary hub task report under `docs/ecomos/evidence/ECO-NNN/`. Include a small slice ledger, for example:

```text
Slice: 15-02 (use actual ID from manifest)
Submitted SHA: full SHA
Tested checkout SHA/path: actual HEAD and clean/detached path
Commands: exact command -> exit/result and redacted log reference
Fixture provenance: isolated namespace, backend IDs, version/time
Evidence class: unit/mock | live backend | production browser | operational
Outcome: PASS | FAIL | BLOCKED; what was not run
Rollback: owned commit or namespace migration/restore procedure
Independent verifier: identity and separately executed checks
```

Do not expose credentials, cart tokens, signed order links, customer payloads, backups or private PDF links. The read-only status tool intentionally does not guess slice completion from an accepted parent. Update the canonical task evidence ledger when a slice is verified.

## Acceptance and integration

Executor submits an exact owned commit. A different verifier checks that same SHA in a clean inspection checkout, records real outputs and distinguishes evidence classes. Orchestrator audits the behavior and integration ancestry, then accepts. A green journal text is not authenticated proof that a command ran.

New corrective work under historically accepted units needs explicit follow-up/reopen coordination; this plan does not silently revoke or reaccept ECO-101 or Phase 0. If a reproduced P0 fails, coordinate a repair and invalidate dependent gates using hub commands. PLAN-001 tracks this audit/planning change separately and is excluded from application completion counts.

No Git commit is attempted while another actor holds `git-index`. No build, staging mutation or browser use bypasses the corresponding resource. A completed draft can be reviewed before its documentation commit is available; record that limitation honestly.

## Owner updates

Give the current outcome, one important risk/blocker, and next ready slice. Use exact accepted/total counts separately for core, RFQ and ParaLoca. Do not turn 9/58 accepted units into a production-readiness percentage or equate all work units with equal effort.

Read SUMMARY.md and run status at the beginning of every resumed session. Preserve archived sections; only active manifest sections control new execution.
