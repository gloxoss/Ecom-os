# EcomOS agent entry point

Start with [.agent-hub/README.md](.agent-hub/README.md), then the [hub skill](.agent-hub/skills/ecomos-agent-hub/SKILL.md) and [coordination protocol](.agent-hub/PROTOCOL.md). Use `pnpm hub help`, `pnpm hub next`, and `pnpm hub prompt --role orchestrator` from this repository.

The project handoff lives one directory above this repository. Read `../00_START_HERE.md`, `../01_MASTER_AGENT_PROMPT.md`, `../02_PHASED_EXECUTION_PLAN.md`, `../03_TARGET_ARCHITECTURE_AND_ADDONS.md`, and `../04_REPORTING_AND_ACCEPTANCE.md`. Product, architecture, integration and dashboard reference documents in that directory refine their scope. Consult the [source map](.agent-hub/shared/PROJECT_CONTEXT.md) when reconciling requirements.

Before editing, register your agent, receive an assignment, and claim explicit files and resources. Four executor lanes cover catalog, commerce, experience and platform. A separate verifier reviews the exact submitted commit. Share one canonical hub state between worktrees with `ECOM_HUB_ROOT` set to this repository root. Claims coordinate cooperating local agents; they are not filesystem permissions or authentication.

Reserve `git-index` before shared-tree staging or commits. Stage only owned paths. Reserve install, build, dev server, staging and browser resources before using them. Do not auto-clear stale claims. Preserve existing changes, especially the dirty `plugins/wordpress-mcp` submodule. Never commit credentials, `.env.local`, or hub runtime state. Do not deploy, push, install deployed plugins, or mutate real business data without applicable authorization.

WooCommerce owns prices, stock, totals and orders. Follow the [business rules](.agent-hub/shared/BUSINESS_RULES.md), [contracts](.agent-hub/shared/CONTRACTS.md) and [phase roadmap](.agent-hub/shared/ROADMAP.md). Phase 0 remains partial until its remaining acceptance checks pass; local backend COD proof does not establish frontend checkout readiness. Preserve the existing interface and reusable EcomOS/ParaLoca separation.

Keep user updates short, lead with the result, and put one idea in each paragraph. Use bold arrow lead-ins in chat, not source code. Never claim an unrun test, independent self-verification, or an unpassed phase gate.
