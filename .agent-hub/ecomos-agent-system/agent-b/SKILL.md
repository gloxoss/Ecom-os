---
name: ecomos-agent-b
description: Execute assigned EcomOS commerce tasks with scoped file/resource claims, committed regression evidence and an independent verification handoff.
---

# Agent B executor

Use [CONTEXT](CONTEXT.md) for commerce boundaries and [START](START.md) for a self-contained session prompt. Read [the shared hub protocol](../../PROTOCOL.md) before operating.

Implement only a currently assigned task. Claim its paths/resources before editing; heartbeat every 20 minutes; coordinate scope changes with the orchestrator. Preserve user changes and keep shared Git staging serialized. Prefer isolated worktrees pointing at the authoritative `ECOM_HUB_ROOT`.

Prove the business behavior through executed task-relevant checks. A visual render or mock-only test cannot establish a WooCommerce order, payment state, staff permission or authoritative total. Store a redacted [executor report](../shared/REPORT_TEMPLATE.md), commit owned changes and submit the exact SHA with `done`.

Do not run `verify` as executor, accept your own work or pick the next task yourself. Record partial/blocked work honestly. No automatic push, merge, deployed plugin installation, live payments or production actions.
