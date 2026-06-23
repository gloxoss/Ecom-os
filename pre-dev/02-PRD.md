# Product Requirements Document (PRD) — Ecom OS

**Version:** v1.0-draft
**Owner:** Oussama Zaki (zakio)
**Date:** 2026-06-23

---

## 1. Product Vision

> "Ecom OS is EPIOSO's pre-built e-commerce platform. It lets us deploy a production-grade, MENA-ready online store for any client in 2 weeks instead of 8 — with the choice of two backend engines (WooCommerce or custom NestJS/Vendure) and a universal Next.js storefront — by toggling pre-built addons instead of writing them from scratch."

---

## 2. Target Users

(See `01-user-personas.md` for full personas.)

| Persona | Primary engine | v1 importance |
|---|---|---|
| **Yasmine** — Moroccan SMB founder | WooCommerce | **Primary** |
| **Marc** — International agency partner | Either | **Primary** |
| **Karim** — Mid-market regional CTO | Vendure | Secondary (v1.1 anchor) |
| **Salma** — End shopper | Universal frontend | Constant — UX bar |

---

## 3. Feature List with RICE Scores

**Scoring:** Reach (1–10, % of deployments needing it), Impact (1–10, how much it moves the needle), Confidence (0–1.0), Effort (engineer-weeks). **RICE = (R × I × C) / E**. Higher = ship sooner.

### Core platform — must-ship v1

| # | Feature | R | I | C | E | RICE | Phase |
|---|---|---|---|---|---|---|---|
| F-01 | Universal Next.js 16 storefront (home, catalog, PDP, cart, checkout, account, order history) | 10 | 10 | 1.0 | 4.0 | **25.0** | v1 WC |
| F-02 | Engine adapter abstraction (typed data layer, swap engines without touching UI) | 10 | 10 | 0.9 | 1.5 | **60.0** | v1 WC |
| F-03 | WooCommerce adapter (read products/categories/cart/orders + checkout) | 10 | 10 | 0.9 | 2.5 | **36.0** | v1 WC |
| F-04 | Per-deployment theme/brand config (logo, colors, fonts, hero) | 10 | 8 | 1.0 | 1.0 | **80.0** | v1 WC |
| F-05 | Addon enable/disable system (env vars + DB flags) | 10 | 9 | 0.9 | 1.0 | **81.0** | v1 WC |
| F-06 | Starter monorepo template (one-command bootstrap of a new client deployment) | 10 | 9 | 0.9 | 0.5 | **162.0** | v1 WC |
| F-07 | Developer documentation (setup, addon authoring, deploy runbook) | 10 | 7 | 1.0 | 1.0 | **70.0** | v1 WC |
| F-08 | Vendure fork + EPIOSO plugin scaffold (core untouched, plugin-only customization) | 5 | 10 | 0.9 | 4.0 | **11.3** | v1 Vendure |
| F-09 | Vendure adapter for the universal frontend | 5 | 10 | 0.9 | 1.5 | **30.0** | v1 Vendure |

### Addons — v1

| # | Feature | R | I | C | E | RICE | Phase |
|---|---|---|---|---|---|---|---|
| F-10 | i18n addon — JSON dictionary, per-language routing, fallback locale | 9 | 9 | 1.0 | 1.5 | **54.0** | v1 WC |
| F-11 | i18n RTL support for Arabic (CSS logical properties, dir attribute) | 7 | 8 | 0.9 | 0.5 | **100.8** | v1 WC |
| F-12 | i18n admin editor (edit strings without redeploy — WC: WP plugin; Vendure: admin panel) | 8 | 7 | 0.8 | 1.5 | **29.8** | v1 |
| F-13 | Multi-payment gateway adapter (single interface, pluggable providers) | 9 | 10 | 1.0 | 1.5 | **60.0** | v1 WC |
| F-14 | CMI payment provider (Moroccan card payments) | 8 | 10 | 0.7 | 2.0 | **28.0** | v1 WC |
| F-15 | Stripe payment provider | 7 | 8 | 1.0 | 0.5 | **112.0** | v1 WC |
| F-16 | Cash-on-delivery provider (zero-friction MENA default) | 9 | 9 | 1.0 | 0.3 | **270.0** | v1 WC |

### Deferred — v1.1

| # | Feature | R | I | C | E | RICE | Phase |
|---|---|---|---|---|---|---|---|
| F-17 | Multi-branch / geolocated order routing addon | 4 | 10 | 0.7 | 3.0 | **9.3** | **v1.1** |
| F-18 | PayPal payment provider | 3 | 6 | 0.9 | 0.3 | **54.0** | v1.1 |
| F-19 | Shipping rate calculator (per-zone, COD-compatible) | 6 | 7 | 0.7 | 1.5 | **19.6** | v1.1 |
| F-20 | Abandoned-cart email addon | 5 | 6 | 0.7 | 1.0 | **21.0** | v1.1 |

### Explicitly out of scope (any version)

- Marketplace mode (multi-vendor) · Native mobile apps · Subscriptions/recurring billing · B2B quoting · POS · Migrating existing EPIOSO sites · SaaS-ifying Ecom OS

---

## 4. User Flows (narrative)

### Flow A — End shopper buys on a WC-engine deployment
Salma lands on the storefront from Instagram → browses catalog (FR locale auto-detected) → switches to Arabic (i18n addon swaps strings + flips to RTL) → adds 2 products to cart → checks out → chooses COD (multi-payment addon shows COD + CMI + Stripe based on deployment config) → enters address → confirms → sees order confirmation → receives email + WhatsApp notification.

### Flow B — Yasmine (merchant) manages her store
Logs into WordPress admin (WC engine native) → adds new product (title + price + images + AR translation field added by i18n addon) → saves → product appears on Next.js storefront within ~60s via ISR revalidation.

### Flow C — EPIOSO deploys Ecom OS for a new client (developer flow)
`npx create-ecom-os my-client --engine=woo` → fills brand config (logo, colors, locales, payment providers) → `pnpm install` → connects to client's WooCommerce backend via env vars → `pnpm dev` → smoke-test → `pnpm deploy:hostinger` → live in 2 weeks instead of 8.

### Flow D — Karim's CTO team extends the Vendure engine
Clones the Ecom OS repo → reads addon authoring docs → creates a new plugin in `addons/branch-routing/` → registers it in deployment config → ships it without forking Vendure core (preserving GPLv3 plugin license exception).

---

## 5. Non-Goals (v1)

- **Not** a SaaS sold to merchants.
- **Not** a multi-tenant platform.
- **Not** a CMS — Ecom OS is e-commerce-first; content management is what the engine provides natively.
- **Not** a drag-and-drop page builder.
- **Not** a replacement for the WordPress or Vendure admin UI (we use them as-is).

---

## 6. Success Metrics Per Feature

| Feature | Success metric |
|---|---|
| F-01 Universal storefront | Lighthouse perf ≥ 90, LCP < 2.0s on 3G |
| F-02 Engine adapter | Same UI component renders both engines with zero engine-specific imports |
| F-03 WC adapter | All CRUD + checkout flows verified against a real WC instance |
| F-04 Theme config | New client branded in ≤ 4 hours (logo + 6 colors + 2 fonts + hero) |
| F-05 Addon flags | Toggling i18n on/off in env requires no code changes; deploy passes |
| F-06 Starter template | `create-ecom-os` boots a working dev environment in < 5 minutes |
| F-10 i18n | Adding a third locale = adding one JSON file, zero code changes |
| F-11 RTL | Arabic version visually mirrored, no broken layouts in design review |
| F-13/14/15/16 Payments | Live test transaction succeeds end-to-end per provider |
| F-08/09 Vendure engine | First Vendure-engine client builds + deploys in ≤ 4 weeks |

---

## 7. Open Questions (carried into Phase 3)

1. **WC adapter: REST or WPGraphQL?** Need a perf + DX benchmark before locking in (Charter Q4).
2. **Vendure admin: ship as-is or custom-skin it per client?** (Charter Q5).
3. **Translation storage**: WordPress side (WPML/Polylang) or independent JSON in the frontend repo?
4. **ISR revalidation strategy**: webhook-driven (WC → Next) or time-based?
5. **Per-deployment isolation model**: one Next.js app per client, or multi-tenant Next.js with config-driven theming? (Strong lean: **one app per client** for v1 to avoid premature multi-tenancy.)
