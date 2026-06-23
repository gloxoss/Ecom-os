# ADR-005: Hosting baseline (Hostinger for WC engine, VPS for Vendure engine)

**Status:** Accepted
**Date:** 2026-06-23

---

## Context

EPIOSO needs a default hosting recommendation per engine that meets NFR-001 (TTFB), NFR-010 (uptime), NFR-020 (1k concurrent on WC), NFR-021 (5k concurrent on Vendure), and keeps client costs predictable.

## Decision

- **WooCommerce engine deployments:** Hostinger Business plan (or higher) hosting both WordPress and Next.js.
- **Vendure engine deployments:** A small VPS (Hetzner CX22 / Hostinger VPS / Contabo VPS-M class — 2–4 vCPU, 4–8 GB RAM) running Docker Compose with Vendure + PostgreSQL + Redis + Next.js.

These are **defaults**, not lock-ins. Clients with existing infra may override.

## Rationale

- **Hostinger fits 80% of Yasmine-class WC clients.** Cheap, already where many of them are, Node app slot is native. EPIOSO operates Hostinger daily (Section 5 of `zakio-ecosystem` skill).
- **Vendure needs containerization.** Vendure + Postgres + Redis is not a fit for shared hosting. A small VPS is the lowest-cost honest recommendation.
- **No proprietary cloud lock-in.** Both can be moved to any provider (AWS, GCP, Hetzner, OVH, DigitalOcean) without architecture changes. Client owns the runtime.
- **Cost predictability.** Hostinger Business ≈ USD 5–15/mo; small VPS ≈ USD 6–20/mo. Both are quoteable in client proposals without surprises.

## Alternatives considered

- **Vercel for the Next.js storefront, separate hosting for the engine.** Rejected for v1: Vercel cost can spike unpredictably on a non-trivial e-commerce site, and serverless cold starts hurt LCP. Reconsider for v1.1+ if a client specifically wants it.
- **AWS / GCP managed services.** Rejected for v1: ops complexity unjustified for Yasmine-class clients; EPIOSO would absorb the support burden.
- **Self-hosted Kubernetes.** Rejected: ops cost massively exceeds revenue per client at v1 scale.
- **Cloudflare Pages + D1 + Workers.** Tempting but immature for transactional e-commerce; reconsider in 12 months.

## Consequences

- **Easier:** Pricing transparency in client quotes; ops staff (Oussama solo) already knows the stack.
- **Harder:** Hostinger's shared-hosting limits (no root, limited background workers) will eventually pinch large WC clients — at which point those clients migrate to VPS, which is fine.
- **Hard constraint:** Every deployment runbook must include verified Hostinger or VPS setup steps with versions pinned.
