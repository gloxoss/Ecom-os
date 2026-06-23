# ADR-001: WPGraphQL as the read API for the WooCommerce adapter

**Status:** Accepted
**Date:** 2026-06-23

---

## Context

The WooCommerce engine needs a read API for the Universal Storefront: list products, get a product, list categories, list cart contents, etc. WooCommerce ships a REST API natively; WPGraphQL is a third-party plugin (free core, commercial Pro for advanced features).

Both can work. We must pick one to lock the adapter architecture.

## Decision

**Use WPGraphQL for all reads from the WooCommerce backend.** Use WooCommerce REST API for writes (order creation, customer updates).

## Rationale

- **Single round-trip per page.** A catalog page needs products + featured images + categories + price ranges. REST forces multiple endpoints + client-side joining. GraphQL gets it in one query.
- **Typed end-to-end.** GraphQL schema generates TypeScript types via codegen, which feeds the `EcomEngine` contract directly. REST would require hand-maintained types.
- **ISR-friendly.** A single GET-with-query keys cleanly into Next.js's `fetch` cache layer.
- **Free core covers v1 reads.** All read operations needed for v1 storefront are in WPGraphQL's free core; we do NOT need WooGraphQL Pro.
- **Writes via REST is fine.** Order creation is a single endpoint; no advantage to GraphQL there, and WPGraphQL Pro's mutations are paid. REST keeps cost at zero.

## Alternatives considered

- **WC REST for both reads and writes.** Rejected: multi-query waterfalls hurt performance; hand-typed contract is fragile.
- **WPGraphQL Pro for everything.** Rejected: licensing cost per deployment; unnecessary for v1.
- **A custom WordPress REST plugin tailored to Ecom OS.** Rejected: adds an EPIOSO-maintained PHP surface where one isn't needed.

## Consequences

- **Easier:** Page-level data fetching, type safety, perf.
- **Harder:** Every client deployment must install WPGraphQL (free plugin). Documented in deploy runbook.
- **Risk:** WPGraphQL plugin updates could break adapter — mitigated by pinning a known-good version per deployment and running a smoke-test E2E on upgrade.
