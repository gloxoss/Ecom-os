# Software Requirements Specification (SRS) — Ecom OS

**Version:** v1.0-draft
**Owner:** Oussama Zaki (zakio)
**Date:** 2026-06-23

---

## 1. Functional Requirements

Each requirement is **testable** and **unambiguous**. Format: `FR-XXX — [imperative statement]`.

### Universal Frontend (Next.js)

- **FR-001** The storefront SHALL render the home, catalog, product detail, cart, checkout, account, and order-history pages as server components by default.
- **FR-002** The storefront SHALL use `next/image` for every raster image and `next/link` for every internal route.
- **FR-003** The storefront SHALL achieve Lighthouse Performance ≥ 90 on the default theme tested on emulated mobile 3G.
- **FR-004** The storefront SHALL render product listings in ≤ 2.0s LCP on a mid-tier mobile device over 3G.
- **FR-005** The storefront SHALL display all merchant content (product titles, descriptions, categories) without any hardcoded business strings in the component tree.

### Engine Adapter Layer

- **FR-010** The system SHALL expose a single typed data-layer interface (`EcomEngine`) covering: list products, get product, list categories, get category, cart CRUD, checkout init, place order, get order, list user orders.
- **FR-011** The system SHALL provide two implementations of `EcomEngine`: `WooCommerceEngine` and `VendureEngine`.
- **FR-012** No UI component SHALL import an engine-specific module, type, or client directly. All access goes through `EcomEngine`.
- **FR-013** Selecting the active engine SHALL be configured per deployment via a single environment variable (`ECOM_ENGINE=woocommerce|vendure`).
- **FR-014** Swapping engines for an existing deployment SHALL NOT require changes to any file under `app/`, `features/*/ui/`, or `components/`.

### WooCommerce Engine (v1)

- **FR-020** The WooCommerce adapter SHALL communicate with a WordPress + WooCommerce backend over **WPGraphQL** (decision recorded in ADR-001).
- **FR-021** The adapter SHALL authenticate write operations using a WooCommerce REST API key pair stored in env vars.
- **FR-022** The adapter SHALL handle WooCommerce product variations, including multi-attribute variations (size + color).
- **FR-023** The adapter SHALL surface stock status (`in_stock` / `out_of_stock` / `on_backorder`) on every product response.
- **FR-024** Product/category content changes in WP admin SHALL appear on the storefront within 60 seconds via webhook-driven ISR revalidation.

### Vendure Engine (v1, ships after WC engine)

- **FR-030** The Vendure adapter SHALL communicate with a Vendure backend over its native GraphQL Shop API.
- **FR-031** All EPIOSO customizations SHALL be implemented as Vendure plugins under `packages/vendure-plugins/*`. Vendure core packages SHALL NOT be modified.
- **FR-032** The Vendure server SHALL be deployable via Docker Compose with PostgreSQL and Redis.
- **FR-033** The Vendure admin UI SHALL be used as-is (no custom admin skin in v1).

### Theme & Brand Configuration

- **FR-040** Each deployment SHALL expose a single `brand.config.ts` file containing: brand name, logo paths (light + dark), primary/secondary/accent colors, font families, hero copy, contact info, social links.
- **FR-041** A new deployment SHALL be brandable end-to-end (logo + 6 colors + 2 fonts + hero) in ≤ 4 hours by a single developer.

### Addon System

- **FR-050** Each addon SHALL be enabled or disabled per deployment via an env var (`ADDONS=i18n,multi-payment`) or DB flag (custom engine).
- **FR-051** Disabling an addon SHALL remove its UI surface, code paths, and bundle weight from the production build.
- **FR-052** Adding a new addon SHALL NOT require modifying any existing addon's code.
- **FR-053** Each addon SHALL ship with: its own README, type definitions, an enable/disable flag schema, and an integration test.

### i18n Addon (v1)

- **FR-060** The i18n addon SHALL load translations from one JSON file per locale, located at `addons/i18n/locales/{locale}.json`.
- **FR-061** The addon SHALL support per-locale URL prefixes (`/fr`, `/ar`, `/en`).
- **FR-062** The addon SHALL detect the visitor's locale from URL prefix → cookie → `Accept-Language` header → fallback to deployment default.
- **FR-063** The addon SHALL apply `dir="rtl"` to the document for RTL locales (Arabic) and use CSS logical properties so layouts mirror correctly.
- **FR-064** Missing translation keys SHALL fall back to the default locale's value and emit a console warning in development.
- **FR-065** Merchants SHALL be able to edit translation strings without redeploying the application:
  - WC engine: via a WordPress admin page exposed by an EPIOSO companion WP plugin.
  - Vendure engine: via a Vendure admin panel exposed by the i18n Vendure plugin.

### Multi-Payment Addon (v1)

- **FR-070** The multi-payment addon SHALL expose a `PaymentGateway` interface with methods: `initiate(order)`, `confirm(callback)`, `refund(orderId, amount)`.
- **FR-071** The addon SHALL ship with three reference providers: `CmiGateway`, `StripeGateway`, `CashOnDeliveryGateway`.
- **FR-072** Each provider SHALL be enable-able per deployment via `PAYMENT_PROVIDERS=cmi,stripe,cod`.
- **FR-073** During checkout, the storefront SHALL display only the providers enabled for that deployment.
- **FR-074** The CMI provider SHALL implement CMI's 3DS-secure redirect flow and verify the signed callback hash before marking the order as paid.
- **FR-075** The Stripe provider SHALL use Stripe Payment Intents and verify webhook signatures.
- **FR-076** The COD provider SHALL mark the order as `pending_confirmation` and trigger a merchant notification (email + optional WhatsApp webhook).

### Starter Template & Tooling

- **FR-080** `npx create-ecom-os <name> --engine=woocommerce|vendure` SHALL scaffold a new deployment ready to run `pnpm install && pnpm dev`.
- **FR-081** First-run setup from `create-ecom-os` to a working dev environment SHALL complete in < 5 minutes on a standard developer machine.
- **FR-082** The repository SHALL ship with a one-command deploy target for Hostinger (`pnpm deploy:hostinger`) covering both engine variants.

---

## 2. Non-Functional Requirements

### Performance

- **NFR-001** Storefront p95 TTFB ≤ 400ms on cache hit.
- **NFR-002** Catalog listing page LCP ≤ 2.0s on emulated 3G + mid-tier mobile.
- **NFR-003** Hydrated JS bundle on the catalog page ≤ 180 KB gzipped.
- **NFR-004** Image responses served via `next/image` SHALL be AVIF or WebP with appropriate `srcset`.

### Availability

- **NFR-010** Target uptime ≥ 99.5% for any deployed Ecom OS instance.
- **NFR-011** No single addon failure SHALL bring down the storefront — addon errors degrade gracefully (e.g., missing translation falls back to default locale; payment provider down hides its option from checkout, doesn't block the page).

### Scalability

- **NFR-020** A single WC-engine deployment SHALL handle 1,000 concurrent visitors on a Hostinger Business plan without exceeding 80% CPU on the WP backend (cached via ISR).
- **NFR-021** A single Vendure-engine deployment SHALL handle 5,000 concurrent visitors on a 4-vCPU/8GB VPS.

### Security

- **NFR-030** All HTTP traffic SHALL be served over HTTPS. HTTP requests SHALL redirect to HTTPS.
- **NFR-031** No API credentials, secrets, or merchant data SHALL ever appear in client-side bundles.
- **NFR-032** Input from end shoppers (search, addresses, account fields) SHALL be validated server-side using a typed schema (Zod).
- **NFR-033** Payment provider callbacks SHALL be cryptographically verified (CMI hash, Stripe signature) before any order state change.
- **NFR-034** The system SHALL apply OWASP Top 10 hardening at the framework level (CSP, XSS protection, CSRF on mutations, rate limiting on auth endpoints).
- (Full security requirements live in Phase 6 — `06-security-requirements.md`.)

### Maintainability

- **NFR-040** All code SHALL be TypeScript strict mode, no implicit `any`.
- **NFR-041** Each addon SHALL be independently testable; v1 target ≥ 70% line coverage on addon packages.
- **NFR-042** Project follows the `nextjs-app-structure` 9-rule architecture (server-first, feature-first, content-data separation, etc.).

### Internationalization

- **NFR-050** All user-facing strings SHALL be sourced from the i18n addon's dictionaries when the addon is enabled.
- **NFR-051** Date, time, currency, and number formats SHALL respect the active locale via `Intl` APIs.

### Compliance

- **NFR-060** Each deployment SHALL include a configurable cookie consent banner.
- **NFR-061** Each deployment SHALL include a configurable privacy policy + terms placeholder.
- (Full privacy details in Phase 6 — `06-privacy-compliance.md`.)

---

## 3. External Interface Requirements

### EIR-001 — WooCommerce backend
- Protocol: HTTPS
- Read: WPGraphQL `/graphql`
- Write (orders, customers): WooCommerce REST API `/wp-json/wc/v3/`
- Auth: REST key pair (consumer_key + consumer_secret) in env vars
- Webhooks consumed: `product.updated`, `product.created`, `product.deleted`, `order.created`, `order.updated` → triggers Next.js ISR revalidation

### EIR-002 — Vendure backend
- Protocol: HTTPS
- Read/write: Vendure Shop API GraphQL `/shop-api`
- Admin: Vendure Admin API GraphQL `/admin-api`
- Auth: session cookie or bearer token

### EIR-003 — CMI Payment Gateway (Morocco)
- 3DS-secure form POST → CMI hosted page → callback POST with signed hash
- Auth: merchant ID + store key (env vars)

### EIR-004 — Stripe
- Stripe REST API + Payment Intents
- Webhook endpoint: `POST /api/webhooks/stripe`
- Signature verification mandatory

### EIR-005 — Email provider (transactional)
- Pluggable: SMTP fallback default; provider adapters for SendGrid/Mailgun/Resend as needed
- Used by COD confirmations, order receipts

### EIR-006 — Optional WhatsApp notification webhook
- Triggered on COD order confirmation if `WHATSAPP_WEBHOOK_URL` is set
- Outbound only; no inbound message handling in v1

---

## 4. System Constraints

- **SC-001** Target hosting baseline: Hostinger Business plan for WC engine; small VPS (≥ 2 vCPU / 4 GB) for Vendure engine.
- **SC-002** Node.js runtime version: ≥ 22 LTS.
- **SC-003** Database constraint: WC engine uses MySQL (provided by WooCommerce); Vendure engine uses PostgreSQL.
- **SC-004** Frontend framework version: Next.js 16 (App Router, RSC).
- **SC-005** Styling system: Tailwind CSS v4 only. No styled-components, no CSS-in-JS, no imported CSS megafiles beyond `globals.css`.
- **SC-006** Package manager: pnpm with workspace support (monorepo).
- **SC-007** Vendure core SHALL NOT be modified — plugin-only customization to preserve GPLv3 plugin license exception (see business case Section 2 and ADR-002 in Phase 3).
- **SC-008** All written content (UI labels, error messages) SHALL ship in French + Arabic + English at minimum for the i18n addon's default dictionaries.
- **SC-009** No external paid service SHALL be a hard dependency for v1 (free tiers or self-hosted only).
- **SC-010** Single-engineer team: every requirement must be implementable by one developer in part-time effort within the 16-week v1 window.
