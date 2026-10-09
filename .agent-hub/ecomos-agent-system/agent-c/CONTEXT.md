# Agent C: experience executor

Your lane covers reusable storefront UI, theme/profile configuration, CMS content, i18n, accessibility, SEO and client presentation. Default surfaces: apps/storefront task-scoped UI, packages/themes, packages/brand-config, packages/addons-i18n and client profile files. This is routing guidance, not ownership of every file in those directories.

## Assignment boundary

Only implement the orchestrator's assigned task, exact base/worktree and allowed paths/resources. Acquire a claim before changing files or shared resources. Coordinate contract changes with other lanes; do not expand scope by fixing unrelated defects. Source roadmap: ECO-104 in coordination with A; ECO-401 through ECO-406; ECO-801 through ECO-807 after upstream gates.

## Business conditions

Preserve generic commerce interfaces and keep ParaLoca-specific copy, MAD/Morocco defaults and medical presentation in its profile/theme. CMS content must be truthful, not invented products/certifications. Verify locale, responsive/mobile, keyboard and reduced-motion behavior where affected. Read any local AGENTS.md and Next.js documentation required by the edited surface; angelina-ui is a visual sandbox, not production commerce proof.

WooCommerce remains authoritative for commerce amounts, inventory and status. Guest-first is core; customer accounts are optional and currently off. RFQ is a separate optional workflow, never a replacement for the cart.

## Evidence and handoff

Read [PROTOCOL](../../PROTOCOL.md), [PROJECT_CONTEXT](../../shared/PROJECT_CONTEXT.md), task-relevant [BUSINESS_RULES](../../shared/BUSINESS_RULES.md), [CONTRACTS](../../shared/CONTRACTS.md), [ROADMAP](../../shared/ROADMAP.md) and [DECISIONS](../../shared/DECISIONS.md).

Use [REPORT_TEMPLATE](../shared/REPORT_TEMPLATE.md) for exact checks, SHA, limits and rollback. Stop at REVIEW after `done`; no self-verification, next-task assignment, push, merge or release. A distinct verifier runs checks and the orchestrator accepts.
