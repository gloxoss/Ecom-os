---
name: ecomos-agent-hub
description: Coordinate EcomOS multi-agent implementation and cleanup using bounded assignments, shared file/resource claims, independent verification and phase acceptance. Use for orchestration, joining a lane, auditing agent reports or preparing self-contained task prompts.
---

# EcomOS agent hub

Repository: `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/Ecom-os`. Keep reusable EcomOS core distinct from the ParaLoca client theme/profile and optional RFQ addon. This skill supports authorized local work; it does not authorize production, paid actions, automatic push/merge or additional deployed plugin installation.

## Choose the role

- Orchestrator: use the dedicated [orchestrator skill](../../ecomos-agent-system/orchestrator/SKILL.md), [context](../../ecomos-agent-system/orchestrator/CONTEXT.md) and [starter](../../ecomos-agent-system/orchestrator/START.md).
- Executor: use the matching lane under [the role kit](../../ecomos-agent-system/README.md). Work only on an assigned task and claimed paths/resources.
- Independent verifier: use [verification context](../../ecomos-agent-system/agent-5-verifier/CONTEXT.md) and [workflow](../../ecomos-agent-system/agent-5-verifier/SKILL.md). Do not implement application fixes.

Read [PROTOCOL](../../PROTOCOL.md) and [PROJECT_CONTEXT](../../shared/PROJECT_CONTEXT.md), then task-relevant [BUSINESS_RULES](../../shared/BUSINESS_RULES.md), [CONTRACTS](../../shared/CONTRACTS.md), [ROADMAP](../../shared/ROADMAP.md) and [DECISIONS](../../shared/DECISIONS.md). Current source/tests establish what exists; the owner handoff establishes the target. Historical reports require revalidation.

## Operate

Run `node .agent-hub/hub.mjs help`, `status`, `inbox` and `next` before selecting work. Set `AGENT_ID` or use `--agent`. In isolated worktrees set `ECOM_HUB_ROOT` to the authoritative repository and invoke its CLI.

Only the orchestrator assigns/accepts/reopens. Claim before editing, including exclusive resources for staging, Git, installs, builds or browser use. Heartbeat every 20 minutes. Stale after 45 minutes does not release claims; coordinate explicit release. Keep the active executor/verifier count at most four and below the provider's available capacity.

Use `resources TASK --add|--remove` to coordinate assigned shared operations, and `progress TASK --resume` to continue a held partial/blocked task. In a shared tree, staging/commits require serialized `git-index` use. Role checks govern hub commands; cooperative IDs and claims are not authentication or an editor/shell sandbox.

Executors submit an exact owned commit and redacted report with executed checks through `done`. A different verifier independently checks the same SHA. The orchestrator audits claims against Git, evidence and business acceptance before `accept`. Do not manufacture a pass from code inspection or a historical log.

Phase gates require all accepted task SHAs integrated as ancestors of authoritative HEAD and checks run on that result. Reopened tasks or new tasks in a passed phase invalidate dependent gates. Inherited commits already submitted by other tasks are recognized; all own commit changes must remain claimed and outside protected paths.

## Conditions that change decisions

Guest purchase and guest RFQ cannot require customer accounts. WooCommerce owns canonical prices, currency, inventory, taxes, shipping and order/payment status. Browser totals are provisional. Accounts and uncertified Stripe/CMI remain disabled at direct API boundaries until their own acceptance.

Phase 0 containment/integration proof precedes Phase 1 catalog correctness and full Phase 2 storefront checkout. Backend COD smoke is not storefront proof. Client branding stays out of generic commerce packages; addon off-state covers frontend, backend, permissions and side effects. Staff administration uses the selected native/hybrid WordPress model.

Preserve user changes, including the preexisting dirty WordPress MCP submodule. Never publish credentials, cart tokens, private order/customer payloads or backups. Report concise results and limits to the owner; provide paste-ready task prompts when delegating.
