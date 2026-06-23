# ADR-007: Addon enable/disable via env-flag + tree-shaking

**Status:** Accepted
**Date:** 2026-06-23

---

## Context

FR-050 / FR-051 / FR-052 require that addons can be turned on/off per deployment, that disabled addons don't ship in the production bundle, and that adding an addon doesn't require editing existing addons.

## Decision

Addons are toggled via the `ADDONS` env var (comma-separated). The addon loader reads `ADDONS` **at build time** and emits a generated `addons.generated.ts` that imports only enabled addons. Unimported addons are tree-shaken by Next.js / Turbopack.

```
ADDONS=i18n,multi-payment
```

The loader:
1. Reads `ADDONS` from the build env.
2. Resolves each name to a known addon package under `packages/addons-*`.
3. Generates `apps/storefront/src/addons.generated.ts` that imports each enabled addon's `register()` function.
4. The storefront's root layout calls `registerAddons()` which initializes each one.

Runtime hot-toggling is **not supported in v1** (PRD §5, ADR-003 alignment).

## Rationale

- **Bundle hygiene.** Tree-shaking guarantees disabled addons are zero bytes in production (verifiable via bundle analyzer).
- **No code edits to enable an addon.** Just env + redeploy. Matches the "EPIOSO engineer scaffolds in minutes" story.
- **No registry service needed.** Build-time generation = no runtime config-fetch, no extra infra.
- **Discoverability.** Devs find addons by listing `packages/addons-*`. No magic DI container to grep through.

## Alternatives considered

- **Runtime-toggle via DB flag with dynamic imports.** Rejected: still ships the code; doesn't satisfy FR-051. Adds runtime branching. Useful only if hot-toggling were a real requirement, which it isn't.
- **Per-addon git submodule pulled in at clone time.** Rejected: git submodules are operationally painful; we already have a monorepo.
- **NPM-style "install the addon to enable it".** Rejected: makes the monorepo behave differently per deployment; loses the "single upstream template" model.
- **Feature flags via a third-party service (LaunchDarkly / Unleash).** Rejected: out-of-scope cost and complexity for v1 (NFR cost discipline).

## Consequences

- **Easier:** Predictable bundles, simple mental model, no runtime surprises.
- **Harder:** Toggling an addon requires a rebuild + redeploy. Acceptable: addon changes happen per-project, not per-shopper.
- **Hard constraint:** Every addon SHALL export a `register(ctx)` function and a `disable()` cleanup. CI rejects an addon that lacks either.
