# UltraPlan Research

> Enhanced 2026-06-23 (audit pass): added the 4 highest-risk research topics the original pass missed.

## Research Topics
1. Next.js 16 Webhook-driven ISR — Why: Storefront caching and synchronization strategy (FR-024).
2. GSAP Animations & Radix/shadcn UI — Why: premium animations with headless primitives (UX bar).
3. ~~Jest + Cypress Testing~~ → **Vitest + Playwright Testing** (corrected per Cahier §2) — Why: CI/CD testing requirements.
4. ~~Redux Toolkit~~ → **Zustand + React Context** — Why: evaluated against Next.js 16 RSC + Lighthouse ≥ 90.
5. **(added) CMI 3DS-secure HMAC flow** — Why: highest-risk component (FR-074, threat model §3); poorly documented; needs real merchant creds.
6. **(added) `next-intl` vs Next.js 16 built-in i18n** — Why: locale routing + RTL for fr/ar/en (FR-060..063).
7. **(added) Tailwind v4 RTL via CSS logical properties** — Why: Arabic mirroring must be structural, not just `dir` flip (FR-063).
8. **(added) Vendure plugin-only customization model** — Why: Sprint D depends on it; confirms GPLv3 plugin exception (ADR-002). Deferred execution but research-ready.

## Tech Stack Analysis
### Recommended Stack
- **Frontend:** Next.js 16 (App Router, RSC-first), Tailwind CSS v4, **shadcn/ui** (on Radix — owned source, copied in, not a runtime dep).
- **State Management:** Zustand + React Context (cart/UI only) — *not* Redux Toolkit.
- **Animations:** GSAP via `@gsap/react` `useGSAP` (RSC-island only).
- **Backend/Engine:** WooCommerce sandbox via WPGraphQL (reads) + WC REST (writes). Vendure in Sprint D.
- **Testing:** **Vitest** (unit/integration) + **Playwright** (E2E). *Not* Jest/Cypress.

### Alternatives Considered
- **Redux Toolkit** (per an early Discovery answer) — rejected: overkill for RSC-first storefront; global provider forces Client Components, bloats JS bundle, jeopardizes Lighthouse ≥ 90 (NFR-001/003).
- **Jest + Cypress** (original UltraPlan recommendation) — rejected: Cahier §2 pins **Vitest + Playwright** (faster, native ESM, better Next.js integration). This was an UltraPlan error, corrected in the audit.
- **Radix UI primitives directly** — superseded by **shadcn/ui** (which is built on Radix but gives owned, copy-in source). Cahier §2 + `.gemini/CLAUDE.md` are authoritative.

## Findings by Topic

### GSAP Animations & Next.js 16
**Source:** Codebase & Web
Animations must use the `@gsap/react` `useGSAP` hook for proper cleanup in React 18/19 strict mode. Heavy animations must be localized to specific client islands (`"use client"` `*-client.tsx`) to preserve the RSC architecture of the rest of the page (Cahier §8.3/8.4). Tension with Lighthouse ≥ 90 (NFR-003: hydrated JS ≤ 180KB gzip) — mitigate via `will-change` discipline, no layout-thrashing properties, deferred non-critical animation.

### Webhook-driven ISR (FR-024)
**Source:** Pre-dev ADR-001, Data-flow Flow 4, Next.js Docs
The App Router handles on-demand revalidation via `revalidatePath`/`revalidateTag`. WooCommerce webhooks (`product.updated/created/deleted`) hit a Next.js Route Handler (`POST /api/revalidate`), protected by `REVALIDATE_SECRET` (SR-RATE-003: 60/min per secret). Bad secret → 401. Storefront reflects change ≤ 60s. Read-path caching uses `revalidate: 60` (Flow 1).

### Global Client State (Conflict — RESOLVED)
**Source:** Next.js 16 Best Practices
In RSC-first apps, Server Components handle data fetching; client state is small (cart UI, toggles). Redux Toolkit's global provider pushes logic to the client, bloating the bundle and risking Lighthouse ≥ 90 (NFR-001). **Resolution:** Zustand + React Context (cart store mirrors server state; server is source of truth — see Section 06).

### CMI 3DS-secure HMAC flow (added — highest risk)
**Source:** Pre-dev FR-074, threat model §3, Data-flow Flow 3, charter §8
CMI (Moroccan interbank) uses a hosted 3DS page + a signed callback. The adapter builds a form payload signed with HMAC + `CMI_STORE_KEY`; the callback carries a `HASH` field that the webhook handler recomputes and compares. **Non-negotiable:** verify signature BEFORE any order state change (NFR-033). Replay protection via `ecom_webhook_delivery_log` dedup on `oid + TransId`. Amount is set server-side from order total and signed; callback amount mismatch → reject. **Risk:** poorly documented, needs a real merchant account for E2E (charter R-03) — start credential outreach now (Cahier §13 Q1).

### next-intl vs Next.js built-in i18n (added)
**Source:** Next.js 16 docs, next-intl docs
`next-intl` is the mature App-Router-native choice for locale routing + message dictionaries + ICU formatting. Confirm Next.js 16 compatibility before committing (Section 08). Detection order per FR-062: URL prefix → cookie → `Accept-Language` → `DEFAULT_LOCALE`. Unknown locale → 404 (SR-VAL-003).

### Tailwind v4 RTL (added)
**Source:** Tailwind v4 docs, FR-063
RTL must be structural: `dir="rtl"` on `<html>` for Arabic + replace all directional CSS with **logical properties** (`margin-inline-start`, `text-start`, `inset-inline-start`). Tailwind v4 supports logical utilities natively. A `dir` flip alone leaves left-anchored UI broken — Section 08 audits + refactors all directional CSS across `features/*`.

### Vendure plugin-only model (added — Sprint D, research-ready)
**Source:** ADR-002, Vendure docs
Vendure core is GPLv3; the plugin license exception permits closed-source client customizations **as plugins only** — core must never be modified (CI rule `check-vendure-pristine.sh`). EPIOSO customizations (i18n editor, payment handlers) ship as TypeScript Vendure plugins. Execution is Sprint D (Steps 23–28), out of this plan's scope, but the contract (Section 01 interface) is written to support it.

## Conflicts Detected
**Conflict 1: Global State Management** — User's early choice (Redux Toolkit) vs RSC/Lighthouse constraint → **resolved to Zustand + React Context.**

**Conflict 2: Testing stack (detected in audit)** — Original UltraPlan PLAN.md said Jest + Cypress; Cahier §2 + `.gemini/CLAUDE.md` pin **Vitest + Playwright**. **Resolved to Vitest + Playwright** (authoritative dev handbook wins). PLAN.md corrected.

**Conflict 3: UI primitives (detected in audit)** — Original PLAN.md said "Radix UI Primitives"; Cahier §2 pins **shadcn/ui** (on Radix, copy-in). **Resolved to shadcn/ui.** PLAN.md corrected.

## User Review
- Status: Approved
- Additional research requested: CMI merchant credentials (charter R-03) — operational, not research
- Concerns raised: none
