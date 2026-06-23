# ADR-003: One Next.js app per client deployment (no multi-tenancy in v1)

**Status:** Accepted
**Date:** 2026-06-23

---

## Context

Every Ecom OS client gets their own infrastructure: their own WordPress (or Vendure server), their own database, their own storefront URL. Should the Next.js storefront also be one app per client, or one multi-tenant app serving many clients based on hostname/config?

## Decision

**Each client deployment is a fully separate Next.js application** — a forked or cloned copy of the upstream Ecom OS monorepo template, configured via `brand.config.ts` and env vars.

No multi-tenancy in v1. No central "Ecom OS Cloud" plane.

## Rationale

- **Matches the unit of sale.** EPIOSO bills per client project. The deployment unit should match the billing unit.
- **Failure isolation.** One client's bad deploy can't take down another's storefront.
- **Per-client customization without abstractions.** Marc's client wants a loyalty addon? Add it to his repo. Yasmine doesn't need to opt out of anything.
- **No premature multi-tenancy code.** Building tenant routing, tenant config resolution, and cross-tenant security takes weeks and provides zero v1 value. (YAGNI.)
- **Future-proof.** If Ecom OS ever becomes a hosted SaaS (v2+), multi-tenancy can be introduced as a wrapper without re-architecting the storefront itself.

## Alternatives considered

- **One multi-tenant Next.js app, hostname-routed.** Rejected: weeks of platform work before any client ships. Increases blast radius of every change. Saves nothing in v1 because we have one paying client at a time at the start.
- **One shared Next.js app, deployed N times with different env vars.** Rejected: still couples upgrades across all clients. Hard to give one client a custom addon without affecting others.
- **One Next.js app, multi-region edge with per-tenant config in Edge KV.** Rejected: complexity premium not earned at v1 scale.

## Consequences

- **Easier:** Per-client deploys, per-client customization, clean failure isolation.
- **Harder:** Upstream improvements must be backported to each client repo via git rebase/merge — automated by a small script in `scripts/`. Documented in deploy runbook.
- **Hard constraint:** Upstream changes that affect multiple clients must include a "downstream sync checklist" in PR description.
