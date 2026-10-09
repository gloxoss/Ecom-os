# EcomOS coordination protocol

Run commands from the repository root, or set `ECOM_HUB_ROOT` to its authoritative path when using an isolated worktree. `node .agent-hub/hub.mjs help` is the command reference. Supply `--agent ID` or set `AGENT_ID`; never impersonate another registration.

## Roles and transitions

Only the orchestrator assigns, accepts and reopens tasks. Executors implement their assigned scope. A distinct registered verifier runs independent checks against the submitted commit and cannot implement the fix it verifies.

`OPEN -> ASSIGNED -> IN_PROGRESS -> REVIEW -> VERIFIED -> ACCEPTED`

A failed verification records incomplete work for correction, not acceptance. An inconclusive verification keeps the task in review. Partial and blocked progress record what is done, what remains and the dependency; neither means complete. Phase gates require all required tasks accepted plus an evidence report. Never accept a gate just because files exist or a historical report used the word DONE.

The initial phase seeds are open pending current verification. Read prior reports to avoid duplicate repairs, then verify their exact scope and current commit before reporting completion.

A phase gate records the authoritative repository HEAD. Every accepted task SHA in that phase must already be an ancestor of this integrated commit; accepted work on an isolated branch is not enough. Run the phase checks on that integrated result. Adding a task to a passed phase or reopening a task invalidates that phase and its dependent gates.

## Coordination loop

1. Join with the correct role/lane and real worktree. Inspect `status`, `inbox` and the assigned task.
2. Orchestrator selects a task whose phase prerequisites are satisfied and assigns bounded files/resources.
3. Executor claims that task before editing, installing, building or mutating staging.
4. Read relevant business contracts and inspect current source. Preserve user changes and work within claimed scope.
5. Implement and check a vertical slice. Heartbeat at least every 20 minutes and record meaningful partial/blocked progress.
6. Commit only the assigned changes, with Git staging serialized. Submit `done` with exact SHA and evidence.
7. Verifier checks that same SHA independently in a clean/detached inspection worktree, then records a verdict and evidence.
8. Orchestrator compares scope, implementation, verdict and integration status before accepting or reopening.

Do not self-assign the next task after finishing. Release claims when work stops; leave the registration once clean.

## Registration and assignment example

```powershell
node .agent-hub/hub.mjs join --agent lead-1 --role orchestrator --lane orchestrator --tool codex --note "Coordinate current EcomOS work"
node .agent-hub/hub.mjs join --agent codex-a-1 --role executor --lane catalog --tool codex --worktree "C:/dev/ecomos-catalog" --note "Catalog slice"
node .agent-hub/hub.mjs assign ECO-101 --agent lead-1 --to codex-a-1 --files "packages/ecom-engine/src,docs/ecomos/evidence/ECO-101" --note "Define reusable catalog contracts with explicit compatibility evidence"
node .agent-hub/hub.mjs prompt ECO-101 --agent lead-1
```

The assignment is an example of command shape, not an instruction to skip unmet phase gates. Task IDs and allowed files must match the actual task. A dependency block is resolved with evidence, not bypassed by renaming the work.

## Claims and shared resources

```powershell
node .agent-hub/hub.mjs claim ECO-101 --agent codex-a-1 --files "packages/ecom-engine/src,docs/ecomos/evidence/ECO-101"
node .agent-hub/hub.mjs files ECO-101 --agent codex-a-1 --add "packages/ecom-engine/src/types.ts"
node .agent-hub/hub.mjs heartbeat --agent codex-a-1 --note "Contracts drafted; compatibility tests running"
```

`files --add` must stay within the assigned scope. Ask the orchestrator through `say` to expand scope or coordinate a cross-lane change before editing a new contract.

File claims include folders and conflict on ancestor/descendant paths. Paths are normalized for Windows case and actual filesystem/symlink boundaries; do not use alternate spellings or links to bypass a conflict. A rejected claim means stop the conflicting operation.

Resources are exclusive and must be named in the assignment and claim when needed:

- `git-index`: staging/commit operations, especially in a shared tree.
- `workspace-install`: package installation and dependency reconciliation.
- `workspace-build`: builds/code generation that mutate shared output.
- `storefront-dev`: a shared storefront dev process.
- `php-staging`: plugin activation, fixture updates, database-changing WP operations and checkout smokes.
- `browser`: shared UI/browser automation.

Use `--resources "git-index,workspace-build"` on assignment/claim for a task that needs them. Claim only resources actually needed; never launch another installation/build or modify staging concurrently with its holder. A file claim does not implicitly grant a resource.

Once a task is claimed, acquire/release assigned resources as needed with `resources TASK --add "workspace-build"` or `resources TASK --remove "workspace-build"`. Keep a resource while its process/operation still runs. This allows code work to continue without holding idle shared resources.

A heartbeat is stale after 45 minutes. Stale claims remain held until explicit release; there is no time-based stealing. The orchestrator checks process status and outstanding work before `release TASK --force --note "reason"`. Staleness is a signal to coordinate, not permission to overwrite.

## Git and process isolation

Prefer isolated worktrees based on the orchestrator's recorded exact SHA. Do not change branches in the shared tree. Only stage explicitly owned paths; never `git add .` or blanket-add a dirty tree. Coordinate the `git-index` claim before staging/committing.

Never discard another person's changes with stash, restore, hard reset, clean, forced checkout or broad reformatting. Do not kill processes you did not start. A verifier may write its evidence report, not application repairs. Cross-lane integration is coordinated as its own assignment and verified at the resulting commit.

A local commit is authorized by the implementation handoff. A commit does not authorize pushing, merging, deploying, plugin installation, paid actions or use of real customer data. Where approval is already scoped and recorded, proceed within that scope without asking again.

In a shared tree, separate agents' commits can accumulate after a task's assignment base. `done` recognizes exact commits already submitted by other tasks as inherited work. It still checks every file touched by the submitting task's own commits against its claim and rejects protected paths, even if a later commit removes the change. The tip must be the executor's own new commit. Unregistered executor merge commits are rejected; integration remains the orchestrator's coordinated work.

## Evidence and completion

Use [REPORT_TEMPLATE](ecomos-agent-system/shared/REPORT_TEMPLATE.md). Store redacted reports under a stable task path; include raw check output only when safe and useful.

```powershell
node .agent-hub/hub.mjs progress ECO-101 --agent codex-a-1 --partial --note "Done: draft contract. Left: compatibility check and evidence."
node .agent-hub/hub.mjs progress ECO-101 --agent codex-a-1 --resume --note "Compatibility work resumed within the existing claim"
node .agent-hub/hub.mjs done ECO-101 --agent codex-a-1 --commit EXACT_SHA --evidence "docs/ecomos/evidence/ECO-101/report.md" --summary "Reusable catalog contracts added" --checks "pnpm typecheck -> PASS; relevant contract tests -> PASS"
```

Partial/blocked progress retains the claim. Use `progress --resume` when continuing that held task; it returns to IN_PROGRESS after dependency checks. If the claim was released, claim the assigned scope again before continuing. Do not submit partial/blocked work as complete.

The submitted SHA must exist and its changed files must be owned by the claim. Evidence states exact commands and results, what was not run, staging mutations, risks and rollback. Preserve a before/after or regression check that demonstrates the actual invariant. A rendering screenshot alone does not prove commerce, permissions or totals.

Do not include credentials, auth headers, cart tokens, signed order links, private customer/order payloads or local backup files. Synthetic fixture IDs and redacted status/total summaries are acceptable when clearly labeled.

Use [VERIFICATION_TEMPLATE](ecomos-agent-system/shared/VERIFICATION_TEMPLATE.md) for independent proof:

```powershell
node .agent-hub/hub.mjs join --agent verifier-1 --role verifier --lane verification --tool codex --note "Independent checks"
node .agent-hub/hub.mjs claim ECO-101 --agent verifier-1 --files "docs/ecomos/verification/ECO-101/report.md" --resources "workspace-build"
node .agent-hub/hub.mjs verify ECO-101 --agent verifier-1 --ok --commit EXACT_SHA --evidence "docs/ecomos/verification/ECO-101/report.md" --checks "Independent contract check at EXACT_SHA -> PASS"
node .agent-hub/hub.mjs accept ECO-101 --agent lead-1 --note "Scope and independent evidence checked"
```

Use `--fail` when behavior violates acceptance, or `--inconclusive` when environment/tooling prevents proof. Keep the same submitted SHA; a different fix commit requires a new review cycle. Verification must be executed independently, not copied from the executor's log.

For a task in REVIEW, a verifier claims only its report/evidence paths under `docs/ecomos/verification/` and required shared resources. This separate claim keeps the task in REVIEW and does not authorize application writes. The verdict releases the verification claim.

## Messages and stopping

```powershell
node .agent-hub/hub.mjs say --agent codex-a-1 --to lead-1 "ECO-101 needs adapter compatibility scope before further edits."
node .agent-hub/hub.mjs inbox --agent lead-1
node .agent-hub/hub.mjs progress ECO-101 --agent codex-a-1 --blocked --note "Missing approved staging capability; no live claim."
node .agent-hub/hub.mjs release ECO-101 --agent codex-a-1 --note "Checkpoint recorded; work stopped"
node .agent-hub/hub.mjs leave --agent codex-a-1
```

`log` shows events; `sync` rebuilds generated runtime views; `check` validates hub consistency. Do not edit generated BOARD, CHANGELOG, state or events to force a desired status. Reports to the owner should carry the concrete result, verified limits and next action in short attention-friendly paragraphs.

The role checks govern hub commands, not all machine access. Registrations are cooperative, not an authentication or operating-system sandbox. A claim does not prevent a shell/editor from writing elsewhere and does not authorize a provider, browser, deployment or WordPress action. Respect the actual access boundaries and review the implementation independently; text recorded as checks is an assertion until independently reproduced.

## Business checks that travel with every assignment

Guest purchase cannot require an account. WooCommerce owns prices, inventory, taxes, shipping and order/payment status. Never trust localStorage or display-formatted strings for commerce amounts. Accounts and uncertified Stripe/CMI stay disabled at direct API boundaries as well as UI.

EcomOS core must remain reusable. ParaLoca branding/medical metadata belongs to a client profile/theme; RFQ is an optional, separate basket/workflow. Disabled addons expose no operational routes, permissions or background side effects. Native/hybrid WP staff administration remains the chosen approach, not a duplicate merchant backend.

Real staging COD proof is evidence of the backend strategy, not completed storefront checkout. Phase 1 catalog contracts precede full Phase 2 checkout. Browser, CSP, concurrent-submit and release assertions need current executed evidence.
