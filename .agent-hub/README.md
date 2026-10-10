# EcomOS agent hub

This is the coordination layer for building and cleaning EcomOS with several agents. It records assignments, exclusive file/resource claims, progress, committed evidence, independent verification and orchestration acceptance. It does not replace WooCommerce or implement the product roadmap by itself.

## Start here

From `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/Ecom-os`:

```powershell
node .agent-hub/hub.mjs check
node .agent-hub/hub.mjs status
node .agent-hub/hub.mjs next
node .agent-hub/hub.mjs prompt --role orchestrator --lane orchestrator
```

The package shortcuts are `pnpm hub <command>` and `pnpm hub:test`. Codex discovery starts at [.agents/skills/ecomos-agent-hub/SKILL.md](../.agents/skills/ecomos-agent-hub/SKILL.md); Claude discovery starts at [.claude/skills/ecomos-orchestrator/SKILL.md](../.claude/skills/ecomos-orchestrator/SKILL.md). Both route to the same canonical hub.

Use the dedicated [orchestrator skill](ecomos-agent-system/orchestrator/SKILL.md) for business decisions, assignments, report audits and acceptance. [The hub skill](skills/ecomos-agent-hub/SKILL.md) handles role routing and shared coordination; [the orchestrator starter](ecomos-agent-system/orchestrator/START.md) is paste-ready. Task-specific prompts come from `prompt TASK --agent ORCHESTRATOR_ID` after assignment. Paste the generated prompt into a new coding session; the hub does not launch AI sessions. Create tasks with `task ID --title "..." --phase N --description "..."` so the acceptance intent is preserved in every generated prompt.

## Operating model

There are four implementation lanes and a separate independent verifier:

- Agent A: catalog contracts, Woo catalog mapping, variations, taxonomy and search.
- Agent B: guest sessions, cart, checkout, shipping/tax, order ownership and payment security.
- Agent C: storefront experience, themes, client profiles, CMS, accessibility, SEO and i18n.
- Agent D: reproducibility, CI, WordPress plugins, staff admin, addon infrastructure and operations.
- Agent 5: independent verification of committed changes; no application repairs.
- Orchestrator: owner-facing decisions, dependency gates, assignments, integration and final acceptance.

These are roles, not a requirement to launch all agents. The hub admits at most four active executor/verifier registrations. Use the lower capacity exposed by the current AI provider and machine; an active coordinator also consumes a provider process slot. Reserve a slot for verification as tasks reach review.

## Context and authority

Read [PROJECT_CONTEXT](shared/PROJECT_CONTEXT.md), [BUSINESS_RULES](shared/BUSINESS_RULES.md), [CONTRACTS](shared/CONTRACTS.md), [ROADMAP](shared/ROADMAP.md) and [DECISIONS](shared/DECISIONS.md). The owner handoff remains authoritative for target scope; code, exact commits and executed checks establish current implementation. The numbered copies of the owner's integration/admin documents are duplicates, not separate requirements.

[PROTOCOL](PROTOCOL.md) describes command use, claims, Git isolation and acceptance. [The role kit](ecomos-agent-system/README.md) contains paste-ready starters and evidence templates.

## Shared state versus tracked guidance

Tracked configuration/task definitions and these instructions describe intended work. Local runtime state lives under `.agent-hub/.runtime/`: state, append-only events, generated BOARD and CHANGELOG. It is gitignored and must not contain secrets or customer payloads. Generated runtime views must not be edited by hand.

A report under `docs/ecomos/evidence/TASK-ID/` is supporting evidence; executor submissions outside that root are rejected. Independent reports belong under `docs/ecomos/verification/TASK-ID/`. The implementation commit, independent checks and real staging behavior determine completion. Historical reports are not automatically accepted into the new hub.

## Worktree isolation

Prefer a dedicated branch/worktree per implementation task. Set `ECOM_HUB_ROOT` to the authoritative repository root so all worktrees use one board. Use the authoritative CLI path when the task worktree lacks the hub:

```powershell
$env:ECOM_HUB_ROOT = "C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/Ecom-os"
node "$env:ECOM_HUB_ROOT/.agent-hub/hub.mjs" status
```

Paths claimed in the hub are repository-relative. Claims apply across worktrees: contract/package changes still collide even when filesystem isolation prevents overwrite. A shared working tree is acceptable only for disjoint claims and serialized Git staging/commits.

Coordination assumes one local machine and one canonical state directory. OneDrive synchronization is not a distributed lock or a supported cross-machine journal transport. If needed, set the same `ECOM_HUB_STATE_DIR` outside OneDrive in every local agent session; preserve that directory as the board's history. Do not switch state directories mid-task without copying and validating the complete journal while all writers are stopped.

`ECOM_HUB_ROOT` normally names the authoritative repository root. The CLI also accepts its `.agent-hub` directory for compatibility; use the repository-root convention in new prompts.

## Authorization

The owner requested this hub to speed up coordinated EcomOS work. It authorizes hub creation and safe local development, not every future roadmap feature, automatic launch, live payment, paid service or deployment. Approved local plugin installation is scoped to the three named plugins on `paraloca.local`; it does not authorize additional installation or production actions.

No automatic push, merge or deployment follows `done`, `verify` or `accept`. Preserve the existing dirty `plugins/wordpress-mcp` submodule unless a later task explicitly owns its modification.

The hub enforces roles, ownership and transitions for its own commands. Agent IDs are cooperative registrations, not authenticated user identities. Claims do not sandbox an editor or shell, prove a test was executed, or grant external permissions. Actual filesystem/service access and independent verification still apply.
