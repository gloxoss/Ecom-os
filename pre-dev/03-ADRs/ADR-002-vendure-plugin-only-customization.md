# ADR-002: Vendure customization is plugin-only — no core forking

**Status:** Accepted
**Date:** 2026-06-23

---

## Context

Vendure switched to GPLv3 effective v3.0.0 (July 2024). EPIOSO wants to base the custom engine on Vendure but cannot accept GPLv3 obligations for clients who receive the deployed code (Phase 1 research, business case Section 2).

Vendure provides a **plugin license exception**: custom plugins can be released under any license. Core modifications, if conveyed (i.e., handed off to a client running it on their own server), must be GPLv3.

## Decision

**All EPIOSO-specific Vendure customizations SHALL be implemented as Vendure plugins.** The Vendure core packages (`@vendure/core`, `@vendure/admin-ui`, `@vendure/asset-server-plugin`, etc.) SHALL NOT be modified in any deployment.

If a customization cannot be done as a plugin, escalate to: (a) contribute upstream to Vendure, or (b) re-evaluate the requirement, or (c) acquire the Vendure commercial license — in that order.

## Rationale

- **GPLv3 sidestepped entirely.** The plugin license exception means our plugins (and therefore all of Ecom OS's value) can ship under any license to any client, without forced source disclosure.
- **Clean upgrade path.** Pristine core means we can pull Vendure upstream releases without merge conflicts.
- **Architecturally aligned.** Vendure's plugin system is purpose-built for exactly this; resisting it would be working against the grain.
- **Cheaper.** Vendure commercial license is non-trivial; plugin-only path keeps direct cost at zero.

## Alternatives considered

- **Fork Vendure core.** Rejected: GPLv3 contagion on every client deployment; merge hell on upstream updates.
- **Acquire Vendure commercial license for every client.** Rejected: cost, contractual complexity, kills the unit economics in `01-business-case.md`.
- **Pick a non-GPL alternative (Medusa, Saleor).** Rejected in Phase 1 (`01-competitive-analysis.md`) for unrelated technical reasons; Vendure remains the best fit if we discipline ourselves to plugins.

## Consequences

- **Easier:** Licensing clarity. Architectural discipline (plugin-first). Upgrade resilience.
- **Harder:** Some customizations that would be a one-liner core patch become a plugin (extra ceremony). Acceptable cost.
- **Hard constraint:** Code review for any Vendure-engine work MUST enforce "no core changes." Add a CI check that fails if `node_modules/@vendure/**` is modified or if `vendure/src/` contains files outside `plugins/`.
