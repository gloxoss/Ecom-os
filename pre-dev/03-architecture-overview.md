# Architecture Overview — Ecom OS

**Version:** v1.0-draft
**Owner:** Oussama Zaki (zakio)
**Date:** 2026-06-23

---

## 1. System Context

Ecom OS is a **per-client-deployed monorepo template**, not a multi-tenant SaaS. Each deployment is a self-contained Next.js application plus the chosen backend engine (WooCommerce **or** Vendure) plus the enabled addons.

```
┌─────────────────────────────────────────────────────────────┐
│                  ONE CLIENT DEPLOYMENT                      │
│                                                             │
│   ┌──────────────────────────┐                              │
│   │ Universal Next.js 16     │  ← Salma (shopper)           │
│   │ Storefront               │                              │
│   │  + enabled addons        │                              │
│   └──────────────────────────┘                              │
│              │                                              │
│              ▼   EcomEngine adapter                         │
│   ┌──────────────────────────┐                              │
│   │ Engine 1: WooCommerce    │  ← Yasmine (merchant)        │
│   │ Engine 2: Vendure        │  ← Karim (mid-market CTO)    │
│   └──────────────────────────┘                              │
│              │                                              │
│              ▼   external services                          │
│   CMI · Stripe · SMTP · WhatsApp webhook                    │
└─────────────────────────────────────────────────────────────┘
```

Multiple deployments run in parallel — each on its own infrastructure, sharing only the **monorepo template** as the upstream source of truth.

---

## 2. Major Components & Responsibilities

| Component | Tech | Responsibility |
|---|---|---|
| **Universal Storefront** | Next.js 16 (App Router, RSC), Tailwind v4 | Serve all user-facing pages; never know which engine is behind it |
| **EcomEngine adapter** | TypeScript interface + 2 implementations | Single typed contract for products, cart, checkout, orders |
| **WooCommerceEngine** | WPGraphQL + WooCommerce REST | Adapt WPGraphQL Pro reads + WC REST writes to the EcomEngine contract |
| **VendureEngine** | Vendure Shop API (GraphQL) | Adapt Vendure GraphQL to the EcomEngine contract |
| **Addon Loader** | Convention-based + env-var flags | Tree-shake disabled addons; mount enabled ones |
| **i18n Addon** | JSON dictionaries + Next.js i18n routing | Translate UI; flip RTL; expose admin editor per engine |
| **Multi-Payment Addon** | `PaymentGateway` interface + 3 providers | Show enabled providers at checkout; verify callbacks |
| **CMI / Stripe / COD providers** | Provider-specific SDKs / HTTP | Initiate payment, verify signed callbacks, mark order paid |
| **WordPress + WooCommerce** | PHP / MySQL | Merchant admin + order persistence (WC engine deployments) |
| **EPIOSO i18n WP plugin** | PHP | Expose translation admin UI inside WordPress |
| **Vendure server** | NestJS + PostgreSQL + Redis | Headless commerce core (custom engine deployments) |
| **EPIOSO Vendure plugins** | TypeScript Vendure plugins | i18n editor, payment integrations, future addons |
| **Hostinger / VPS** | Shared hosting / Docker host | Runtime infrastructure (per deployment) |

---

## 3. Data Flow Summary

### Read path (catalog → PDP)
1. Shopper requests `/{locale}/catalog/shirts`
2. Next.js RSC calls `engine.listProducts({ category: 'shirts', locale })`
3. The adapter (WC or Vendure) issues a single GraphQL query
4. Response is cached at the Next.js layer (ISR, 60s)
5. RSC renders the page server-side; client island handles add-to-cart only

### Write path (checkout → order)
1. Shopper submits checkout form
2. Server action validates input (Zod) and calls `engine.placeOrder(...)`
3. The adapter creates the order in WC (REST) or Vendure (GraphQL)
4. The selected `PaymentGateway` is invoked
5. On callback, the gateway's verification function runs server-side
6. On successful verification, `engine.markOrderPaid(orderId)` is called
7. Notifications fire (email + optional WhatsApp webhook)

### Content-update path (merchant → storefront)
1. Merchant edits a product in WP admin (or Vendure admin)
2. WP webhook hits `/api/revalidate?path=/products/{slug}` (or Vendure webhook)
3. Next.js triggers on-demand ISR for that path + related listing pages
4. Storefront reflects the change within ≤60s

---

## 4. Third-Party Integrations

| Integration | Direction | Trust boundary | Failure handling |
|---|---|---|---|
| WooCommerce REST API | Outbound + webhook inbound | Server-only credentials | Retry with exponential backoff; surface degraded state in admin |
| WPGraphQL | Outbound | No auth needed for public reads | Fall back to cached response |
| Vendure Shop API | Outbound | Session cookie / bearer | Same degraded-state pattern |
| CMI | Redirect + signed callback | HMAC verification mandatory | Invalid signature → log + alert, do not mark paid |
| Stripe | API + signed webhook | Stripe webhook signing key | Idempotency keys on every Payment Intent |
| SMTP / SendGrid / Mailgun / Resend | Outbound | API key in env | Email failure does NOT block order creation |
| WhatsApp webhook | Outbound | URL configured per deployment | Best-effort; never blocks |
| Hostinger SSH (deploy) | EPIOSO engineer outbound | SSH key pair | Atomic deploy with rollback on failure |

---

## 5. Deployment Topology

### WooCommerce engine deployment (Yasmine-class)
```
┌─────────────────────────────┐    ┌──────────────────────────┐
│ Hostinger Business plan     │    │ Hostinger Node app slot  │
│ ─────────────────────────── │    │ ──────────────────────── │
│ WordPress + WooCommerce     │◄───┤ Next.js 16 storefront    │
│ MySQL                       │    │ (PM2 + reverse proxy)    │
│ EPIOSO i18n WP plugin       │    │ Universal frontend       │
└─────────────────────────────┘    └──────────────────────────┘
                                              ▲
                                              │
                                              shopper
```

### Vendure engine deployment (Karim-class)
```
┌──────────────────────────────────────────────────────────────┐
│ VPS (Hetzner / Hostinger VPS / Contabo) — Docker Compose     │
│ ──────────────────────────────────────────────────────────── │
│  ┌──────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Vendure core │  │ PostgreSQL │  │ Redis      │            │
│  │ + EPIOSO     │  │            │  │ (queues)   │            │
│  │ plugins      │  │            │  │            │            │
│  └──────────────┘  └────────────┘  └────────────┘            │
│                                                              │
│  ┌──────────────────────────────────┐                        │
│  │ Next.js 16 storefront (PM2)      │                        │
│  └──────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────┘
                          ▲
                          shopper
```

### Monorepo (upstream source of truth)
```
ecom-os/
├── apps/
│   ├── storefront/                  # Universal Next.js 16 app
│   └── vendure/                     # Vendure server (only for engine 2)
├── packages/
│   ├── ecom-engine/                 # EcomEngine interface + types
│   ├── engine-woocommerce/          # WC adapter
│   ├── engine-vendure/              # Vendure adapter
│   ├── addons-i18n/                 # i18n addon code
│   ├── addons-multi-payment/        # Payment gateway adapters
│   ├── brand-config/                # Per-deployment brand schema
│   └── ui/                          # Shared UI primitives
├── plugins/
│   ├── wp-epioso-i18n/              # WordPress companion plugin (PHP)
│   └── vendure-epioso-*/            # Vendure plugins (TS)
├── scripts/
│   ├── create-ecom-os.ts            # `npx create-ecom-os` CLI
│   └── deploy-hostinger.ts          # SSH/PM2 deploy script
└── docs/
    ├── setup.md
    ├── addon-authoring.md
    └── deploy-runbook.md
```

Each client deployment is a **fork or downstream clone** of the template, then customized via `brand.config.ts` and env vars. Updates from upstream flow via git rebase / merge — not at runtime.

---

## 6. Boundaries & What This Architecture Does NOT Do

- **No central control plane.** Each deployment is independent. No "Ecom OS Cloud" managing deployments in v1.
- **No multi-tenancy.** One client = one app = one database. (Multi-tenancy = v2+ if SaaS-ification ever happens.)
- **No runtime addon hot-loading.** Addons are toggled at build/deploy time, not live.
- **No engine bridging.** A deployment uses either WC or Vendure — never both at once.
- **No CMS layer beyond the engine.** WP/Vendure admins are the only content-management surfaces.

---

## 7. Open Architectural Questions (resolved in ADRs below)

- WPGraphQL vs REST for WC adapter → **ADR-001**
- Vendure customization model → **ADR-002**
- Per-tenant vs per-deployment topology → **ADR-003**
- Engine adapter pattern shape → **ADR-004**
- Hosting baseline → **ADR-005**
- Auth strategy → **ADR-006**
- Addon enable/disable mechanism → **ADR-007**
