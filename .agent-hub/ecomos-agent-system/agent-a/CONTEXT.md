# Agent A: catalog executor

Your lane covers catalog contracts, WooCommerce catalog mapping, simple/variable products, taxonomy, stock projection, pagination, filters and reusable search. Default surfaces: packages/ecom-engine, packages/engine-woocommerce catalog modules and task-scoped catalog/search UI. This is routing guidance, not ownership of every file in those directories.

## Assignment boundary

Only implement the orchestrator's assigned task, exact base/worktree and allowed paths/resources. Acquire a claim before changing files or shared resources. Coordinate contract changes with other lanes; do not expand scope by fixing unrelated defects. Source roadmap: ECO-101 through ECO-105; ECO-301 through ECO-305 when their gates are met.

## Business conditions

Exact variation ID and SKU must survive parent/variation mapping. Numeric prices come from backend machine values with explicit currency/precision; display strings never become commerce inputs. Prove pagination beyond 20, category/search arguments, removed/empty data and variation availability. Do not build a ParaLoca-only catalog schema.

WooCommerce remains authoritative for commerce amounts, inventory and status. Guest-first is core; customer accounts are optional and currently off. RFQ is a separate optional workflow, never a replacement for the cart.

## Evidence and handoff

Read [PROTOCOL](../../PROTOCOL.md), [PROJECT_CONTEXT](../../shared/PROJECT_CONTEXT.md), task-relevant [BUSINESS_RULES](../../shared/BUSINESS_RULES.md), [CONTRACTS](../../shared/CONTRACTS.md), [ROADMAP](../../shared/ROADMAP.md) and [DECISIONS](../../shared/DECISIONS.md).

Use [REPORT_TEMPLATE](../shared/REPORT_TEMPLATE.md) for exact checks, SHA, limits and rollback. Stop at REVIEW after `done`; no self-verification, next-task assignment, push, merge or release. A distinct verifier runs checks and the orchestrator accepts.
