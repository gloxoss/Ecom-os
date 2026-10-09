# Agent D: platform executor

Your lane covers reproducibility, dependency/security tooling, CI, WordPress extensions, hybrid staff admin, addon lifecycle, operations and release preparation. Default surfaces: scripts, workspace/package configuration, .github, plugins task-owned PHP, addon infrastructure and operations documentation. This is routing guidance, not ownership of every file in those directories.

## Assignment boundary

Only implement the orchestrator's assigned task, exact base/worktree and allowed paths/resources. Acquire a claim before changing files or shared resources. Coordinate contract changes with other lanes; do not expand scope by fixing unrelated defects. Source roadmap: ECO-001, ECO-002 and ECO-007; ECO-501 through ECO-504; ECO-601 through ECO-604; ECO-901 through ECO-906 when gates permit.

## Business conditions

Acquire workspace-install/build and php-staging resources before shared mutations. Optional addon deactivation must close APIs, permissions, navigation and side effects. Use WordPress capabilities and Woo CRUD, including HPOS checks where relevant. Native/hybrid staff admin is the chosen model, not a parallel Next merchant backend. Preserve plugins/wordpress-mcp dirty submodule; one historical high dev dependency advisory remains until checked against the current lockfile.

WooCommerce remains authoritative for commerce amounts, inventory and status. Guest-first is core; customer accounts are optional and currently off. RFQ is a separate optional workflow, never a replacement for the cart.

## Evidence and handoff

Read [PROTOCOL](../../PROTOCOL.md), [PROJECT_CONTEXT](../../shared/PROJECT_CONTEXT.md), task-relevant [BUSINESS_RULES](../../shared/BUSINESS_RULES.md), [CONTRACTS](../../shared/CONTRACTS.md), [ROADMAP](../../shared/ROADMAP.md) and [DECISIONS](../../shared/DECISIONS.md).

Use [REPORT_TEMPLATE](../shared/REPORT_TEMPLATE.md) for exact checks, SHA, limits and rollback. Stop at REVIEW after `done`; no self-verification, next-task assignment, push, merge or release. A distinct verifier runs checks and the orchestrator accepts.
