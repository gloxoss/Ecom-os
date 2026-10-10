# UltraPlan Discovery

## Project Idea
Ecom OS — EPIOSO's modular e-commerce starter kit. A universal Next.js 16 frontend with an engine adapter layer supporting WooCommerce and Vendure backends, addon system (i18n + multi-payment), per-client deployment model. Target: reduce zero-to-deployment time from 8-12 weeks to ≤ 2 weeks per client.

## Codebase Detection
- Codebase found: Yes
- Stack: Next.js 16, TypeScript (strict), Tailwind CSS v4, pnpm monorepo
- Patterns: Feature-first architecture, RSC-first, engine adapter pattern (ADR-004), addon system (ADR-007)

## Discovery Q&A

### Core Requirements - Batches 1, 2 & 3
**Q: Which engine should we fully implement first?**
A: WooCommerce first — it matches your Sprint A-C plan and Yasmine (small merchant) persona

**Q: Which screens are your absolute launch minimum?**
A: Core 8 plus Account pages (profile, orders, order detail)

**Q: What's your priority for the next sprint?**
A: Steps 6-9: Addon loader, CLI scaffold, storefront baseline screens, test harness

**Q: How long should the next sprint take?**
A: 2 weeks max — keep the 16-week overall timeline on track

**Q: For the initial storefront screens (Step 8), what's the visual quality bar?**
A: Premium with animations — GSAP hero, scroll effects, micro-interactions from day one

**Q: Confirm which screens you want built in this sprint:**
A: Home page, Catalog page, PDP, Cart page, Checkout flow, Account pages

**Q: Real WooCommerce backend or mock data?**
A: Real WC sandbox — set up a WordPress + WooCommerce dev instance and code against it now

**Q: Build login + register + profile + orders all together?**
A: Yes, build both for full account flow

**Q: Deployable staging URL at the end of this sprint?**
A: Local dev only — no public URL yet

### Users & Context - Batch 4
**Q: Which persona is the priority?**
A: All three simultaneously (Yasmine, Marc, Karim)

**Q: Which locale combination should work perfectly on launch day?**
A: Global: English as primary, French and Arabic as secondary

**Q: Mobile-first or desktop-first in design?**
A: Mobile-first — 80%+ of Moroccan shoppers are mobile

**Q: Checkout as guest or create account?**
A: Guest checkout with optional account creation after purchase

### Integration Points - Batches 5 & 6
**Q: Which payment provider first?**
A: All three at once (CMI, Stripe, COD)

**Q: Email service for v1?**
A: [User skipped, defer to default/later]

**Q: WhatsApp notifications for COD?**
A: Yes, via a simple webhook POST to a configured URL

**Q: Confirm WooCommerce API strategy?**
A: WPGraphQL for reads + WC REST for writes (per ADR-001)

**Q: How should storefront stay in sync with WooCommerce?**
A: Webhook-driven ISR — WP fires webhook on product change, Next.js revalidates the specific path

**Q: WooCommerce sandbox location?**
A: Local XAMPP/MAMP for dev only

**Q: Product images handling?**
A: Product images stored in WordPress media library, served via next/image optimization

### Edge Cases - Batches 7 & 8
**Q: WooCommerce backend goes down?**
A: Show cached version with a subtle 'data may be stale' banner

**Q: What happens when a product is out of stock?**
A: Show 'out of stock' immediately — disable add-to-cart, offer 'notify me when available'

**Q: Payment fails mid-checkout?**
A: Save the cart and show a friendly error — let them retry or pick a different payment method

**Q: Should shopping cart persist?**
A: Persistent cart — saved to cookies/localStorage for 30 days, restored on return

**Q: Product deleted but URL bookmarked?**
A: Show 'This product is no longer available' and suggest similar products

**Q: Only one payment provider enabled?**
A: Show the enabled options only — no mention of disabled providers

**Q: Duplicate orders webhook?**
A: Idempotent order creation — same cart+payment combo doesn't create duplicate orders

### Quality Attributes - Batch 9
**Q: Enforce Lighthouse >= 90 as a CI gate?**
A: Yes, enforce Lighthouse ≥ 90 on mobile

**Q: Testing tools?**
A: Jest + Cypress — more mature ecosystem

**Q: Accessibility (a11y) in v1?**
A: Basic accessibility — proper heading structure, alt text, focus management

**Q: Logging comprehensiveness?**
A: Comprehensive — structured JSON logs with PII redaction

### Existing Patterns - Batch 10
**Q: Keep exact directory structure and patterns?**
A: Mostly yes, but I want to adjust the directory structure
*Follow-up:* Flatten feature folders, use route groups differently, move shared UI to `packages/ui`, change apps/packages split, different import aliases.

**Q: Component library approach?**
A: Radix UI + custom styling — headless primitives only

**Q: Env-var based addon flags?**
A: Yes — keep env-var based addon flags with build-time tree-shaking

**Q: Engine factory approach?**
A: Yes — `@ecom-os/engine` namespace with `interface.ts`, `factory.ts`, and types

### Preferences & Tradeoffs - Batch 11
**Q: Faster development time vs cleaner abstraction layers?**
A: Clean abstraction layers — Ecom OS is a template that will be cloned many times, so it needs to be solid

**Q: Testing isolated UI components locally?**
A: Test them directly in isolated Next.js routes (e.g. `/dev/components`) — it's faster and avoids maintaining Storybook in v1

**Q: How should global client-side state be managed?**
A: Redux Toolkit — we need heavy state management

**Q: When configuring addons for a new client deployment, do you prefer:**
A: Both — configured in code, but with a read-only dashboard

### Monetization & Business Model - Batch 12
**Q: How will EPIOSO monetize Ecom OS itself when onboarding new clients?**
A: Per-project setup fee for Yasmine/Marc, plus optional monthly retainer for maintenance

**Q: For your merchants, do they need multi-vendor marketplace capabilities in v1?**
A: No, single vendor only — keep it simple for Yasmine and Karim

**Q: Do you need to track "Ecom OS platform fees" automatically on transactions?**
A: No, merchants keep 100% of their sales (minus payment gateway fees)

**Q: Will you need a centralized admin portal for EPIOSO to manage client deployments and billing?**
A: Not yet — we'll just manage them via Hostinger/Vercel dashboards and GitHub for now

### Visual & UX Vision - Batch 13
**Q: Describe the baseline look and feel you want for the initial storefront template:**
A: Modern and minimal — clean typography, lots of whitespace, sleek GSAP micro-interactions

**Q: Should the storefront support Dark Mode out of the box?**
A: Yes, full dark mode support from day one (handled by `next-themes` and Tailwind)

**Q: How should the catalog filtering UX work?**
A: Sidebar on desktop, slide-up bottom sheet on mobile

**Q: What should the mobile navigation feel like?**
A: Native-feeling bottom tab bar (Home, Search, Cart, Account)


# 2026-10-10 handoff and run reconciliation

The user requested an audit and a better tracked plan. Existing supplied handoff answers settled requirements; no new answers or approvals are fabricated. This update reuses prior discovery and reconciles all nine categories instead of sending redundant discovery questions.

1. Core: reusable guest-first Woo commerce, not a client-specific rewrite.
2. Users: guest buyers/quote requesters, capability-scoped WP staff and platform operators; customer accounts optional/off.
3. Integrations: Woo authority, verified GraphQL catalog, Store API cart/checkout, CMS, optional search/provider/RFQ modules.
4. Edges: outages/empty/deleted data, complete connections, exact variations, stock/price changes, duplicate/concurrent/uncertain transactions, expiry/off-state.
5. Quality: exact-SHA evidence, production browser proof, real fixtures, accessibility, measured budgets, restore and independent second client.
6. Patterns: preserve EcomEngine/theme/addon seams and one hub; native/hybrid WP admin.
7. Preferences: preserve current UI and isolated client deployments; French first for ParaLoca.
8. Business: reusable starter with optional addon capability, no invented fees/subscription/vendor/cost commitment.
9. Visual: approved ParaLoca reference through profile/theme; different neutral client proves reuse.

Authoritative source: ../00_START_HERE.md, ../01_MASTER_AGENT_PROMPT.md, ../02_PHASED_EXECUTION_PLAN.md, ../03_TARGET_ARCHITECTURE_AND_ADDONS.md, ../04_REPORTING_AND_ACCEPTANCE.md and their linked scope/design sources. Numbered duplicate integration/admin documents are not separate requirements.

Open owner decisions D-01..D-08 live in SUMMARY; they block only affected activation/release. Historical contradictory requirements are superseded, not silently deleted. All 58 ECO requirements are retained in active-plan.json and VALIDATE.md.
