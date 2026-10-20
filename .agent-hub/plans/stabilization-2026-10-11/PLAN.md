# Four-agent stabilization and release-path plan

Date: 2026-10-11. Owner's next-execution directive authorizes Sprint A now. This pack is the actionable continuation of [.ultraplan/SUMMARY.md](../../../.ultraplan/SUMMARY.md), not a replacement product vision or a second task board.

## Outcome and honest completion

Build a secure, reusable guest-first WooCommerce application, proved on ParaLoca and a different isolated client. Four agents finishing Sprint A establishes a stabilization gate. A finished release candidate additionally needs Sprint B, merchant approval and the release checks below. Production deployment is excluded.

The October 11 audit's approximately **58% weighted product readiness** is a provisional baseline, not a test result or a launch certificate. Do not add arbitrary percentages after each task. Re-score demonstrated outcomes for core, RFQ, ParaLoca and evidence coverage; critical failures block release regardless of percentage.

## Current snapshot, before agent activation

Observed branch: `fix/ecomos-phase-0`. Initial audit HEAD: `6a9564d796478666362010b5f32e81fd4b8b5fa9`; planning snapshot: `b8ae0601f217f1d7d8a224583340aee3fdc2ec0d`; current HEAD: `c2ec316d672c9386d39cace2a870dd5aba0d50e9`. Recent commits closed live browser proof for variation purchase (order 32, 1476.00 MAD) and isolated client-2 (order 12, 158.00 EUR), and fixed missing image crashes.

Executed during baseline check:
- Storefront TypeScript with `--noEmit --incremental false`: exit 0. The reported `InventoryAvailability.isPurchasable` regression is not currently reproduced.
- Vitest: exit 0, **521 tests in 62 files**.
- Engine import guard: exit 0.
- Fresh clean pinned production build: **NOT RUN**. All-package lint/typecheck/hub/PHP/browser checks: to be certified by ECO-1100.

Active worktree notes: preexisting dirty `plugins/wordpress-mcp` and untracked `plugins/wp-ecomos-rfq/tests/state-machine.harness.php` are preserved. Transient curl debug files (`apps/storefront/{c3,h3,h4}.txt`) should not be staged.

Hub worker capacity: `claude-platform`, `claude-verifier`, and temporary planning worker `sprint-plan-writer` (with `PLAN-002` marked PARTIAL) have cleanly left the hub. Only `backend-par-1` remains registered (holding ECO-1006 RFQ routes/repository/tests and ECO-1007), leaving 3 of 4 worker slots free for the incoming executors and verifier. Obtain real handoff before activating the RFQ executor.

## Four sessions, clear ownership

1. **Agent 1, Commerce.** Own cart synchronization, checkout correctness and attempt durability. Then prove the complete guest buying journey. No RFQ state/authorization implementation.
2. **Agent 2, RFQ.** Own guest/staff separation, persistence errors, immutable offers, private access and conversion. Then prove professional quotation journeys and reconcile owner-approved ParaLoca facts.
3. **Agent 3, Recovery/platform.** First record the clean baseline, then own isolated restore/recovery, compatibility/CI and release evidence. No source database write or destructive cleanup without approval.
4. **Agent 4, Coordinator/independent verifier.** Establish handoffs and assignment boundaries, verify each executor's exact SHA, coordinate local integration, maintain the hub and enforce gates. No application feature fixes under its verification identity.

Start Agent 4 first. Have it tell Agents 1-3 when to join and which worktree/task to claim. Exactly three executor workers plus one verifier worker; the orchestrator identity adds no worker slot. If Agent 4 implements conflict repairs, another worker must verify its exact result. Prefer returning repairs to the owning implementer so Agent 4 stays independent.

## Phases and task order

### A0: pin the baseline before implementation

Agent 4 reconciles active work and chooses a documented base. Agent 3 records ECO-1100 in an isolated worktree, including versions, Git status, existing processes/resources and complete test/build results. Agent 4 independently checks that exact report/SHA.

Run the repository's actual scripts: `pnpm guard`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm hub:test`, and `pnpm build`, plus the existing PHP/compatibility checks where configured. Use the pinned package manager and lockfile; acquire install/build resources. Never print local secret values.

If the TypeScript regression returns, the coordinator assigns a minimal preflight repair to its owning implementer with exact paths and new evidence. Existing lint/build defects also need bounded preflight assignments, not disabled checks or unexplained baseline exceptions. A0 is BLOCKED until the agreed baseline is green. This does not prevent read-only planning, contract design or safe tests that do not edit contested code.

### A1: parallel security and correctness repairs

**Agent 1:** ECO-1101 and ECO-1102. They share checkout.ts and are sequential within this one agent, while the other agents run in parallel. Woo cart operations must be authoritative and reconcile the complete product/variation/quantity multiset. Durable claims must survive multiple processes, crashes and restart. Test the crucial case where Woo creates an order but the HTTP response or local recording is lost: recovery must discover the correlated order before retrying. Identical later purchases need fresh attempts and remain legitimate. Taxes, shipping and currency come from Woo.

**Agent 2:** ECO-1103 then ECO-1104, after explicit backend-par-1 handoff. Guest proof is required even with privileged service credentials. Enumerate all read/mutation routes, offers, PDFs, acceptance and conversion; test missing/forged/expired/cross-quote proofs, wrong-role staff, configured staff credentials, upstream errors and malformed successes. Offer revisions stay immutable. Terminal transitions and concurrent conversion are enforced durably.

**Agent 3:** ECO-1105 then ECO-1106. The import service must be structurally separate from source, with a distinct data directory and restricted credentials. A before/after checksum is additional proof, not the protection boundary. Raw SQL may use USE, fully qualified source tables, routines, triggers, events or filesystem privileges. Attack fixtures run only against synthetic decoys in isolated services. Verify actual HPOS/quote/revision fidelity and application/plugin/config recovery, not merely table count or scratch deletion.

No destructive database operation is authorized by this plan. Keep destructive cleanup disabled and use fresh synthetic environments. If the concrete recovery experiment requires DROP, truncation, overwrite or a migration, prepare its exact target/operation for owner approval before execution. No destructive tests against source, shared staging business data or production.

### A2: independent acceptance and integrated Sprint A gate

Agent 4 independently verifies submitted exact SHAs and only then accepts the work. Local integration is authorized by the directive after stream acceptance; remote push, production release and deployment are not.

Agent 3 records ECO-1107's integrated results; Agent 4 re-executes decisive checks on the same final SHA in an independent worktree. All stream commits must be ancestors. Run the full test/build suite plus cart/attempt races, credential-present RFQ attacks, restore isolation/failure cases and relevant real browser checks.

Sprint A passes only when all six repair tasks are independently accepted and the integrated gate passes. Missing environments, source-safety proof or decisive browser checks are BLOCKED. The Sprint A gate is ECO-1107, **not** the hub's overall phase-9 gate.

### B: complete the browser journeys, only after Sprint A acceptance

Prepare these assignments after ECO-1107 acceptance; do not silently start them during stabilization.
- Agent 1, ECO-1201: catalog/PDP to cart to shipping/tax/COD to owned confirmation/status, desktop/mobile, retries, stock/variation failures and a new legitimate repeat purchase. HPOS readback verifies actual order lines and totals.
- Agent 2, ECO-1202: two quote entry methods, one independent three-product basket, guest submission/access, real staff session, immutable revised offer, private PDF, exact-revision acceptance/conversion, notification sink and full RFQ OFF checks.
- Agent 3, ECO-1203: real supported backend boot/load order/version matrix, reproducible CI and safe operations. Report untested combinations as unsupported.
- Each lane then closes the original product acceptance: Agent 1 ECO-1211 catalog scale/search freshness; Agent 2 ECO-1212 reusable themes/CMS/SEO; Agent 3 ECO-1213 real staff jobs/existing addon lifecycle. These are targeted completion and proof, not new feature expansion.
- Agent 3 prepares ECO-1204; Agent 4 verifies both clients and the integrated Sprint B result. The second client needs separate installation/database/secrets and a real guest order; changing a brand label alone is insufficient.

Only targeted corrections to existing scope. No broad UI redesign, new addons or architecture replacement.

### R: reviewable release candidate, after browser proof

Agent 2 prepares ECO-1301: actual merchant content approvals and French/MAD/Morocco UAT. Owner approval of merchant facts cannot be delegated to an agent or fabricated. Keep placeholder facts unapproved/hidden.

Agent 3 prepares ECO-1302's release packet; Agent 4 independently checks the final pinned result. Include all required original handoff outcomes: search/catalog, CMS/native staff admin, theme reuse, existing addon off-state, guest commerce/RFQ, two clients, config/security/privacy, measured SEO/performance/accessibility, CI/build and safe recovery.

Stop at a release candidate and a concrete owner launch decision. Do not certify production TLS/CSP from localhost alone, enable unapproved gateways/accounts, install extra deployed plugins or change DNS. Production work requires separate explicit approval.

## Task registration and status

[manifest.json](manifest.json) supplies task IDs, dependencies, proposed path bounds, acceptance and evidence locations. It is an assignment manifest, **not a live status board**. All tasks use hub phase 9 to preserve historical gates 0-8; A/B/R labels describe corrective execution stages, not new numeric hub phases.

Tasks are created OPEN in the canonical hub. Agent 4 assigns them to real registered workers only when dependencies/handoffs pass, then workers claim paths. The hub does not enforce this manifest's per-task dependencies, so the coordinator must check them before assigning. Do not record phase 9 until every required phase-9 task, including reconciled legacy work, is accepted and integrated.

Use `node .agent-hub/hub.mjs status`, `check`, `inbox` and `next`. On a fresh machine, import missing manifest task definitions through `hub task`; never copy or edit runtime events by hand. Do not reopen historical accepted tasks unless a current defect justifies it, and record which old finding each corrective task addresses.

Legacy mapping: checkout ECO-1003/1004 and ECO-1016 -> 1101/1102/1201; RFQ ECO-1005/1006/1008 -> 1103/1104/1202; restoration/release/compatibility ECO-1009/1010/1007/1011/1014 -> 1105/1106/1203/1301/1302. This map preserves history, it does not automatically accept or supersede old tasks. Catalog/build work ECO-1012/1013 and newer changes must be revalidated in A0 and B.

## Branches, claims and shared contracts

Use isolated task branches/worktrees outside the authoritative source directory's tracked files, with one canonical `ECOM_HUB_ROOT`. Create a task worktree from the coordinator's accepted base, not whatever HEAD happens to be when a session starts. Do not reuse/remove `.audit-verify` or existing worktrees without their owner's handoff.

Proposed names: `sprint-a/commerce-ECO-1101`, `sprint-a/rfq-ECO-1103`, `sprint-a/recovery-ECO-1105`. Finish, verify and integrate/rebase approved prerequisite slices before a dependent task's new assignment base. Commit only owned paths. Root lockfile, workspace manifests, engine public contracts, generated files, shared engine index, common Playwright config and client fixtures require an explicit single-owner assignment if a fix needs them. Never widen to all packages or all storefront source.

Acquire git-index for Git staging/commit/merge operations, workspace-install for installs, workspace-build for builds, storefront-dev for the server, php-staging for shared Woo fixtures and browser for UI tests. Release each resource only after its process/operation finishes. Checkout and RFQ browser tests must serialize against shared staging; isolated code branches do not isolate database mutations. Use synthetic data and track fixture ownership/order IDs without secrets.

Implement attempt durability inside the existing approved commerce/backend architecture. No new addon or new deployed plugin during stabilization. If an existing backend module needs changes, assign its exact paths to one owner before editing and coordinate durable-schema decisions; destructive migrations still require explicit approval.

## Definition of done for every task

Executor evidence includes exact base and final SHA, changed files, requirement-to-check mapping, commands/exit codes, safe fixture references, browser evidence when required, migration/rollback impact and remaining FAIL/BLOCKED/NOT RUN items. Never include credentials, signed guest links, cart tokens, private customer payloads or dumps.

Executor submits `done`; a different verifier claims only verification evidence paths and verifies that exact SHA; orchestrator accepts only demonstrated acceptance. Fixes produce a new SHA and require a new review. Gate reports distinguish local synthetic proof from production facts.

Read [COMMON.md](COMMON.md), [tracking and readiness rubric](TRACKING.md), and the four [startup prompts](prompts/04-coordinator-verifier.md). The owner can launch the coordinator now; implementation activation waits for its safe handoff and baseline gate.

