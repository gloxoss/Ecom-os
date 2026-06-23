# Project Charter — Ecom OS

**Owner:** Oussama Zaki (zakio) — EPIOSO
**Status:** Draft v0.1
**Date:** 2026-06-23

---

## 1. Problem Statement

EPIOSO rebuilds e-commerce infrastructure from scratch for every new client. Each engagement re-implements the same 80% (catalog, cart, checkout, auth, admin, i18n, payments, shipping) and customizes the remaining 20%. This caps how fast we can ship, how many clients we can serve in parallel, and how aggressively we can price. We need a pre-built, modular e-commerce platform — **Ecom OS** — that turns every new project into "configure + skin + add 1–2 custom modules" instead of "build from zero."

---

## 2. Business Objective & KPIs

**Objective:** Reduce zero-to-deployment time for new EPIOSO e-commerce clients by **70%** while maintaining or improving production quality.

| KPI | Baseline (custom build) | Target (Ecom OS) | Measured by |
|---|---|---|---|
| Time-to-first-deploy for a new client | 8–12 weeks | **≤ 2 weeks** | Calendar days from kickoff to staging |
| Engineering hours per client project | ~400h | **≤ 120h** | Time tracking per project |
| New-client gross margin | ~45% | **≥ 70%** | (Revenue − dev cost) / Revenue |
| Concurrent e-commerce clients EPIOSO can carry | 1–2 | **5+** | Active billable projects |
| Re-use rate of platform code across clients | 0% | **≥ 80%** | LOC reused vs. LOC custom per project |

---

## 3. Stakeholders & RACI

| Stakeholder | Role |
|---|---|
| **Oussama Zaki (zakio)** | Owner, Product Lead, Lead Engineer, sole decision-maker for v1 |
| **EPIOSO studio** | Brand owner, primary beneficiary |
| **Future pilot client** | First production deployment, validation source (TBD — see open questions) |
| **Agency partners (white-label)** | Secondary buyers of Ecom OS deployments |
| **End shoppers** | Ultimate users of any deployed storefront — non-negotiable UX bar |

**RACI for v1 decisions:** Oussama is **R, A, C, and I** for all decisions in v1. No external sign-off required until pilot client is engaged.

---

## 4. Scope — In

- Universal **Next.js 16** frontend (App Router, RSC-first) that can connect to either backend engine via a typed data layer.
- **Engine 1 — Headless WooCommerce** adapter (REST or GraphQL via WPGraphQL). **Shipped first.**
- **Engine 2 — Custom NestJS backend** built on top of a forked **Vendure** core (plugin architecture, PostgreSQL, GraphQL API). Shipped second.
- **Addon system (v1):**
  - Multi-language (i18n via JSON dictionary, admin-editable)
  - Multi-payment gateway (Stripe, CMI Morocco, PayPal — adapter pattern)
- **Admin CMS** for the custom engine (Vendure admin UI extended; WooCommerce uses WP admin natively).
- **Starter-kit packaging:** monorepo template + per-addon enable/disable flags via DB or config.
- **Documentation:** developer setup, addon authoring guide, deployment runbook (Hostinger + Docker).

---

## 5. Scope — Out (v1)

- **Multi-branch / geolocated order routing** → deferred to **v1.1**. (High complexity, only 1–2 clients need it.)
- **Marketplace mode** (multi-vendor, vendor payouts) — not on roadmap.
- **Native mobile apps** (Expo) — out of scope; PWA only.
- **Subscriptions / recurring billing** — not in v1.
- **B2B features** (quotes, net terms, customer-specific pricing) — not in v1.
- **Marketing automation** (email flows, abandoned-cart) — addon, not v1.
- **POS / in-store integration** — not in scope.
- **SaaS-ifying Ecom OS** (multi-tenant hosted version sold to other agencies) — explicitly v2+; v1 is a per-client deployment.
- **Migrating existing EPIOSO clients** (VetaProf, TFS, zdream) to Ecom OS — separate initiative, not part of v1.

---

## 6. Budget & Timeline

**Budget framing:** Internal R&D. No external cash spend beyond existing tooling (Hostinger, GitHub, Claude, Vercel free tier). The investment is Oussama's engineering time.

**Estimated engineering effort:**
- WooCommerce engine v1: ~8 weeks part-time (~160h)
- Custom Vendure-based engine: ~8 weeks part-time (~160h) after WC engine ships
- **Total to both engines production-ready: 16 weeks**

**Timeline assumption:** part-time effort alongside active EPIOSO client work. Full-time sprint could compress this to 6–8 weeks total.

**Payback model:** First deployed client recovers ~50% of build time vs. doing it from scratch. Break-even at 2 clients.

---

## 7. Key Assumptions

1. **Vendure's plugin architecture maps cleanly onto our addon model** — confirmed by Vendure docs review; v1 plan depends on this being true at depth.
2. **WPGraphQL** (or REST) is sufficient for all storefront operations including checkout — true for 90% of WC stores; payment gateway integration may need WC-side helper plugins.
3. **A single universal Next.js frontend can serve both engines** via an adapter abstraction without leaking engine-specific concerns into UI components.
4. **Hostinger** remains the primary deployment target. Docker-compose for the custom engine; PHP/MySQL native for WC engine.
5. **All v1 addons can be enabled per-deployment via env vars or DB flags** — no need for hot plug/unplug at runtime.
6. **No pilot client is required to define v1** — generic-first is acceptable.

---

## 8. Known Constraints

- **Engineering capacity:** single engineer (Oussama), part-time alongside other projects. Schedule slips if EPIOSO client load spikes.
- **Hostinger shared hosting limits:** no root, limited background workers, no native PostgreSQL on shared plans. Custom engine may require a small VPS upgrade for any client using it.
- **Vendure license:** GPL v3 — must verify implications for commercial client deployments (open question below).
- **WooCommerce versioning churn:** WC and WP plugin ecosystem changes frequently; the adapter must isolate that volatility.
- **Moroccan payment context:** CMI integration is poorly documented and requires a real merchant account for end-to-end testing.

---

## 9. Open Questions Log

| # | Question | Why it matters | Owner | Decide by |
|---|---|---|---|---|
| Q1 | Vendure GPL v3 — does it constrain our ability to ship closed-source customizations per client? | Affects whether we keep custom engine as the primary path | Oussama | End of Phase 1 (Discovery) |
| Q2 | Who is the first pilot client? | Validates the platform with real data + closes the payback loop | Oussama | Before Phase 7 (Execution Blueprint) |
| Q3 | Do we white-label Ecom OS for agency partners in v1, or hold that for v1.1? | Affects how we structure repo ownership and licensing | Oussama | Phase 8 (Client Package) |
| Q4 | REST or WPGraphQL for the WooCommerce adapter? | Performance + DX trade-off; locks adapter architecture | Oussama + research | Phase 3 (Architecture) |
| Q5 | Self-hosted Vendure admin vs. custom-built admin? | Time-to-ship vs. brand consistency | Oussama | Phase 3 (Architecture) |

---

## 10. Sign-Off

**Project sponsor:** Oussama Zaki — EPIOSO
**Approval:** ☐ Approved · ☐ Approved with changes · ☐ Rejected

Signature: _____________________________ Date: ___________
