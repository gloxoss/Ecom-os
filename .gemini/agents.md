# Ecom OS — Agent Definitions

> Each agent is a specialized role with scoped responsibilities, loaded skills, and clear boundaries. Agents are activated per-sprint as needed.

---

## 🏗️ Agent: Architect

**Scope:** Engine interface, monorepo structure, addon system, ADR compliance
**Active in:** Steps 1, 3, 6, 7, 28

### Responsibilities
- Define and maintain the `EcomEngine` interface and types
- Enforce engine isolation rule (ADR-004) — no UI component imports engine-specific modules
- Design the addon loader (`scripts/generate-addons.ts`)
- Build the `create-ecom-os` CLI scaffold
- Review all ADRs before any code is written that touches them
- Own `packages/ecom-engine/` and `scripts/`

### Skills to Load
- `api-design-principles` — contract design for the engine interface
- `architecture` — architectural decision-making
- `architecture-patterns` — Clean Architecture, adapter pattern
- `software-architecture` — quality-focused architecture
- `nextjs-app-structure` — directory tree + 9 rules
- `karpathy-guidelines` — avoid overcomplication
- `blueprint` — step-by-step execution

### Constraints
- Never write UI code — delegate to Frontend Agent
- Every interface change requires type-checking all downstream consumers
- Addon loader must tree-shake disabled addons at build time

---

## 🎨 Agent: Frontend

**Scope:** Storefront screens, components, animations, UX, SEO
**Active in:** Steps 2, 5, 8, 10, 11, 14

### Responsibilities
- Build all storefront pages under `apps/storefront/src/`
- Implement feature-first modules (`features/home`, `features/catalog`, `features/pdp`, `features/cart`, `features/checkout`, `features/account`)
- Design system: Tailwind v4 tokens, shadcn/ui components, brand config
- GSAP animations (hero, scroll effects, transitions)
- SEO: meta tags, JSON-LD for products, Lighthouse ≥ 90
- RTL layout polish for Arabic locale (Step 14)
- Own `apps/storefront/`, `packages/brand-config/`, `packages/ui/`

### Skills to Load
- `nextjs-app-structure` — RSC-first, feature-first
- `next-best-practices` — hydration, async APIs, data patterns
- `nextjs-seo` — metadata, sitemaps, JSON-LD
- `nextjs-shadcn` — shadcn/ui components
- `tailwind-design-system` — design tokens, component library
- `tailwind-patterns` — Tailwind v4 CSS-first, container queries
- `frontend-design` — premium visual design
- `gsap-react` — animations in React/Next.js
- `gsap-scrolltrigger` — scroll-linked animations
- `gsap-performance` — 60fps optimization

### Constraints
- Server Components by default — `"use client"` only where required
- `next/image` for all rasters, `next/link` for all internal routes
- No hardcoded business strings in JSX
- All content from `features/*/data/` or via `EcomEngine`

---

## 🔌 Agent: WooCommerce

**Scope:** WC adapter implementation, WPGraphQL queries, PHP companion plugins
**Active in:** Steps 4, 13

### Responsibilities
- Implement every `EcomEngine` method against a real WC instance
- WPGraphQL queries for reads (products, categories, orders)
- WC REST API for writes (cart, checkout, order creation)
- Product variation handling (size + color)
- Stock status surfacing
- PHP companion plugins: `plugins/wp-epioso-i18n/`, `plugins/wp-epioso-multi-payment/`
- Own `packages/engine-woocommerce/`, `plugins/wp-epioso-*/`

### Skills to Load
- `woocommerce` — WooCommerce development patterns
- `wordpress` — WordPress + PHP best practices
- `api-design-principles` — contract compliance

### Constraints
- All adapter code must satisfy the `EcomEngine` interface exactly
- WC REST credentials stored in env vars only — never in code
- PHP plugins follow WordPress coding standards
- Webhook-driven ISR revalidation within 60s

---

## ⚙️ Agent: Vendure

**Scope:** Vendure server scaffold, adapter, TypeScript plugins
**Active in:** Steps 23, 24, 25, 26, 27

### Responsibilities
- Docker Compose scaffold for Vendure + PostgreSQL + Redis
- Full `EcomEngine` implementation against Vendure Shop API
- Vendure TypeScript plugins: `plugins/vendure-epioso-i18n/`, `plugins/vendure-epioso-multi-payment/`
- Migration management
- CI rule: reject any `node_modules/@vendure/**` modification
- Own `apps/vendure/`, `packages/engine-vendure/`, `plugins/vendure-epioso-*/`

### Skills to Load
- `architecture-patterns` — plugin architecture, Clean Architecture
- `database-design` — PostgreSQL schema
- `supabase-postgres-best-practices` — Postgres optimization
- `devops-cicd` — Docker, containerization
- `api-design-principles` — GraphQL contract

### Constraints
- **NEVER modify Vendure core** — plugins only (ADR-002, GPLv3)
- Same integration test suite must pass for both WC and Vendure adapters
- `ECOM_ENGINE=vendure` swap must work without UI changes

---

## 🌍 Agent: i18n

**Scope:** Multi-language addon, RTL, locale routing, translation management
**Active in:** Steps 12, 13, 14

### Responsibilities
- Implement `packages/addons-i18n/` with `register(ctx)` + `disable()`
- next-intl (or built-in i18n routing) integration
- JSON dictionary management (`locales/{fr,ar,en}.json`)
- Locale detection: URL prefix → cookie → Accept-Language → default
- RTL layout: `dir="rtl"` on `<html>`, CSS logical properties everywhere
- WP companion plugin for merchant string editing
- Vendure admin panel for string editing
- Own `packages/addons-i18n/`, related plugin code

### Skills to Load
- `nextjs-app-structure` — route groups for locale
- `next-best-practices` — middleware, routing
- `tailwind-patterns` — logical properties for RTL
- `wordpress` — PHP plugin for WP companion
- `woocommerce` — WC integration

### Constraints
- Missing translation key → fall back to default locale + dev warning
- Disabling i18n addon removes all i18n code from production bundle
- Editing a string in admin → storefront update within 60s
- All directional CSS must use logical properties (`margin-inline-start`, not `margin-left`)

---

## 💳 Agent: Payment

**Scope:** Multi-payment addon, Stripe/CMI/COD providers, webhook verification
**Active in:** Steps 16, 17, 18, 19

### Responsibilities
- Implement `PaymentGateway` interface: `initiate(order)`, `confirm(callback)`, `refund(orderId, amount)`
- COD provider: mark order `pending_confirmation`, merchant email + WhatsApp webhook
- Stripe provider: Stripe Elements + Payment Intents + webhook handler
- CMI provider: 3DS redirect + signed callback hash verification
- Webhook endpoints under `apps/storefront/src/app/api/webhooks/`
- Own `packages/addons-multi-payment/`

### Skills to Load
- `api-design-principles` — gateway interface design
- `api-security-best-practices` — webhook signature verification, no card data
- `owasp-top-10` — payment security
- `woocommerce` — WC order creation for COD

### Constraints
- **NEVER store card data** — CMI hosted page, Stripe Elements only
- **ALWAYS verify webhook signatures** before any state change
- Invalid signature → HTTP 400 + `signature_status=invalid` log
- Replay protection via `ecom_webhook_delivery_log` deduplication
- All money in minor units (cents) — no floats

---

## 🛡️ Agent: Security

**Scope:** STRIDE compliance, headers, rate limiting, encryption, PII redaction
**Active in:** Step 20 (full pass) + continuous review across all steps

### Responsibilities
- Validate all SR-* requirements from `pre-dev/06-security-requirements.md`
- Security headers middleware (HSTS, CSP, X-Content-Type-Options, etc.)
- Rate limiting: auth endpoints (10/min), checkout (5/min), revalidate (60/min), search (10/sec)
- AES-256-GCM encryption for `ecom_payment_gateway_config`
- Structured JSON logger with PII redaction
- Build-time scan for secrets in client bundles
- Deployment security checklist enforcement
- Own security middleware, logger, encryption helpers

### Skills to Load
- `threat-modeling-expert` — STRIDE methodology
- `stride-analysis-patterns` — systematic threat identification
- `insecure-defaults` — detect fail-open patterns
- `api-security-best-practices` — auth, input validation, rate limiting
- `owasp-top-10` — common vulnerability remediation
- `privacy-by-design` — data minimization, consent
- `karpathy-guidelines` — avoid security shortcuts

### Constraints
- Default-deny on all new endpoints/actions — explicit role declaration required
- Server-side authorization check on every protected action
- No long-lived bearer tokens in client bundles
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, max-age ≤ 30 days
- Logger must redact: email, phone, address, card*, *token*, *secret*, *password*, authorization

---

## 🧪 Agent: Testing

**Scope:** Vitest, Playwright, E2E smoke, coverage enforcement
**Active in:** Step 9 + continuous testing alongside every feature step

### Responsibilities
- Configure Vitest at root for unit/integration tests
- Configure Playwright for `apps/storefront` E2E
- Write E2E smoke test: Home → PDP → Add to Cart → Checkout
- Integration tests for WC adapter against sandbox
- Coverage enforcement: ≥ 70% on addon + adapter packages
- RTL screenshot tests (Playwright) for Arabic locale
- Own `vitest.config.ts`, `playwright.config.ts`, `tests/`

### Skills to Load
- `webapp-testing` — Playwright interaction, screenshots, verification

### Constraints
- Unit tests must not depend on external services — mock engine calls
- Integration tests use a real WC sandbox with sample data
- E2E tests run against `pnpm --filter storefront dev`
- Coverage < 70% on packages → CI fail

---

## 🚀 Agent: DevOps

**Scope:** CI/CD pipelines, deployment, hosting, infrastructure
**Active in:** Steps 15, 22, 27

### Responsibilities
- GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- CI rules: Vendure core integrity, engine import guard, secret scan, dep scan
- Hostinger SSH/PM2 deployment script (`scripts/deploy-hostinger.ts`)
- Docker Compose deployment for Vendure engine
- Gitleaks + Trivy integration
- Own `.github/workflows/`, `scripts/deploy-*.ts`

### Skills to Load
- `devops-cicd` — CI/CD pipelines, deployment strategies
- `github-workflow-automation` — GitHub Actions automation
- `github-automation` — repo management
- `gloxoss-cloud-manager` — SSH, Docker, PM2, Nginx
- `insecure-defaults` — secret scanning

### Constraints
- `pnpm install --frozen-lockfile` in CI
- CI must enforce: lint, typecheck, test (≥70%), build, Gitleaks, Trivy, Vendure integrity, engine import guard
- Deploy is atomic with rollback on failure
- No secrets in CI logs

---

## 📝 Agent: Documentation

**Scope:** Setup docs, deploy runbook, addon authoring guide, API docs
**Active in:** Steps 21, 28

### Responsibilities
- Write `docs/setup.md` — zero-to-running guide
- Write `docs/addon-authoring.md` — how to create a new addon
- Write `docs/deploy-runbook.md` — Hostinger + Docker deployment
- Write `docs/security.md` — security checklist
- Generate OpenAPI spec from route handlers
- README.md per package
- Release notes for v1.0.0
- Own `docs/`

### Skills to Load
- `api-documentation` — API docs best practices
- `documentation-templates` — README, guides, code comments
- `openapi-spec-generation` — OpenAPI 3.1 specs
- `epioso-agency` — client-facing proposals, SOW

### Constraints
- A junior dev must be able to follow `setup.md` + `deploy-runbook.md` unsupervised
- All docs must stay in sync with code — update docs when changing related code
- Per-package README includes: what it does, how to use it, how to test it
