# Ecom OS — Business Context

> Business requirements, personas, and decision gates for all agents.

---

## Business Objective

Reduce zero-to-deployment time for new EPIOSO e-commerce clients by **70%** (8–12 weeks → ≤ 2 weeks).

### KPIs

| KPI | Baseline | Target |
|-----|----------|--------|
| Time-to-first-deploy | 8–12 weeks | ≤ 2 weeks |
| Engineering hours/client | ~400h | ≤ 120h |
| New-client gross margin | ~45% | ≥ 70% |
| Concurrent clients | 1–2 | 5+ |
| Code reuse rate | 0% | ≥ 80% |

---

## Personas

### Yasmine — Small Moroccan Merchant
- Non-technical, runs a clothing boutique
- Needs: simple admin, WhatsApp order notifications, COD + CMI payment
- Engine: WooCommerce (familiar WordPress admin)
- Locale: fr, ar (RTL)

### Marc — European Agency Partner
- Manages 5+ e-commerce clients
- Needs: white-label platform, Stripe integration, multi-language
- Engine: WooCommerce or Vendure depending on client scale
- Locale: fr, en

### Karim — Mid-Market CTO
- Runs a 50-person company, needs custom integrations
- Needs: API-first, plugin extensibility, self-hosted
- Engine: Vendure (full control)
- Locale: en, fr

### Salma — End Shopper
- Mobile-first, expects fast pages, local payment options
- Needs: < 2s LCP, CMI/COD payment, Arabic support
- Measures: Lighthouse ≥ 90, checkout < 3 steps

---

## Decision Gates

### Gate A — End of Sprint B (Week 8)
**Question:** Pilot client signed or warm pipeline (≥ 2 leads with budget)?
- **YES** → proceed to Sprint C (multi-payment + ship)
- **NO** → pause Sprint D, redirect to lead-gen using staging URL as demo

### Gate B — End of Sprint C (Week 12)
**Question:** First deployment shipped + Vendure-engine client in pipeline?
- **YES** → proceed to Sprint D (Vendure engine)
- **NO** → pause Sprint D, refine WC engine

---

## Sprint Timeline

| Sprint | Weeks | Output |
|--------|-------|--------|
| A — Foundation | 1–4 | Monorepo, engine adapter, WC adapter, brand config |
| B — WC engine v1 + i18n | 5–8 | Full WC storefront, i18n addon, staging deploy |
| C — Multi-payment + ship | 9–12 | Stripe/CMI/COD, security hardening, first client |
| D — Vendure engine | 13–16 | Vendure fork, adapter, plugins, second engine |

---

## Scope Boundaries (v1)

### In Scope
- Universal Next.js 16 frontend
- WooCommerce adapter (shipped first)
- Vendure adapter (shipped second)
- i18n addon (fr/ar/en, RTL)
- Multi-payment addon (Stripe, CMI, COD)
- Admin CMS (WC uses WP admin; Vendure uses Vendure admin)
- Starter-kit packaging (`npx create-ecom-os`)
- Documentation

### Out of Scope (v1)
- Multi-branch / geolocated routing → v1.1
- Marketplace mode (multi-vendor)
- Native mobile apps (PWA only)
- Subscriptions / recurring billing
- B2B features
- Marketing automation
- POS integration
- SaaS multi-tenancy → v2+
