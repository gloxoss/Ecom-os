# Ecom OS — Workspace Instructions

> Single-tab agent handbook. Open this while coding. For *why*, go to `pre-dev/`. For *how*, stay here.

**Owner:** Oussama Zaki (zakio) — EPIOSO
**Version:** v1.0 · **Last updated:** 2026-06-23

---

## Identity

This is **Ecom OS** — EPIOSO's pre-built modular e-commerce starter kit.
Universal Next.js 16 frontend + adapter layer + two interchangeable backends (WooCommerce or Vendure).
Per-deployment, addon-driven (i18n + multi-payment in v1), deployed to Hostinger or VPS.

---

## Architecture Laws — Non-Negotiable

1. **No UI component imports an engine-specific module.** Everything goes through `EcomEngine` interface (ADR-004). CI rule enforced.
2. **Vendure core is never modified — plugins only.** GPLv3 sidestepped via plugin license exception (ADR-002). CI rule enforced.
3. **Server Components by default.** `"use client"` only for hooks, events, GSAP, browser APIs.
4. **Feature-first organization.** `features/<feature>/{model,data,ui,hooks,lib,server,validation}`.
5. **One styling system: Tailwind v4.** No styled-components, no CSS megafiles.

---

## Stack — Pinned

| Layer | Tool | Version |
|---|---|---|
| Runtime | Node.js | 22 LTS |
| Package manager | pnpm | ≥ 9 |
| Frontend | Next.js | 16 (App Router, RSC) |
| Language | TypeScript | 5.5+ strict |
| Styling | Tailwind CSS | v4 (CSS-first @theme) |
| UI primitives | shadcn/ui | latest (copy in) |
| Forms | React Hook Form + Zod | latest |
| GraphQL client | graphql-request | latest |
| WC engine | WordPress + WooCommerce + WPGraphQL | WP 6+, WC 9+, WPGraphQL 2+ |
| Vendure engine | @vendure/core | pinned, plugin-only |
| Testing | Vitest + Playwright | latest |
| Lint | ESLint v9 flat | eslint-config-next |
| Format | Prettier + Tailwind plugin | latest |

---

## Monorepo Structure

```
ecom-os/
├── apps/
│   ├── storefront/          # Universal Next.js 16 app
│   └── vendure/             # Vendure server (engine 2 only)
├── packages/
│   ├── ecom-engine/         # EcomEngine interface + types (zero runtime deps)
│   ├── engine-woocommerce/  # WC adapter (WPGraphQL + REST)
│   ├── engine-vendure/      # Vendure adapter (GraphQL Shop API)
│   ├── addons-i18n/         # i18n addon
│   ├── addons-multi-payment/ # Payment adapter + providers
│   ├── brand-config/        # Per-deployment brand schema
│   └── ui/                  # Shared UI primitives (shadcn-derived)
├── plugins/
│   ├── wp-epioso-i18n/      # WordPress companion plugin (PHP)
│   └── vendure-epioso-*/    # Vendure plugins (TS)
├── scripts/
├── docs/
└── pre-dev/                 # Read-only spec (already written)
```

---

## Code Standards

### Architecture Rules
1. Server Components by default. `"use client"` only for hooks, events, GSAP, browser APIs.
2. Feature-first: `features/<feature>/{model,data,ui,hooks,lib,server,validation}`.
3. No hardcoded business data in JSX. Content from `features/*/data/` or engine.
4. Server wrapper + client island pattern for any animated/interactive section.
5. One styling system: Tailwind v4. No styled-components.
6. `next/image` always — no raw `<img>` for rasters.
7. `next/link` always — no raw `<a>` for internal routes.
8. Import order: React/Next → 3rd-party → internal types → internal data/lib → internal components.
9. Strict TS: no `any`, no `@ts-ignore` without `// ponytail: <reason>` comment.

### Ecom OS Specific
10. Never import `engine-woocommerce` or `engine-vendure` outside `lib/engine.ts`. UI uses `EcomEngine` only.
11. Never modify `node_modules/@vendure/**`. Plugin-only.
12. Never store card data. Period.
13. Always verify webhook signatures before any state change.
14. All money in minor units. No floats anywhere.
15. Every server action validated through Zod before any side effect.
16. No `console.log` in committed code — use the structured logger.
17. Every addon exports `register(ctx)` + `disable()`. CI rejects otherwise.

### Comments
- Default to no comments. Code self-documents via names.
- Comment only the **why** of non-obvious decisions.
- `// ponytail: <intent or ceiling>` for deliberate simplifications.

---

## Naming Conventions

- Packages: `engine-*`, `addons-*`, `ui`, `brand-config`, `ecom-engine`
- Plugins: `wp-epioso-*` (PHP) or `vendure-epioso-*` (TS)
- Files: kebab-case (`hero-section.tsx`); types/interfaces: PascalCase
- Server components: default; client islands: `*-client.tsx`
- Branches: `feat/<step-N>-<short-name>` e.g., `feat/step-4-wc-adapter`
- Commits: Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`

---

## Environment Variables

Required per deployment — see `CAHIER-DE-CHARGES.md` §5 for full list.

Core: `ECOM_ENGINE`, `SITE_URL`, `DEFAULT_LOCALE`, `LOCALES`, `ADDONS`
Security (REQUIRED): `ECOM_OS_ENCRYPTION_KEY`, `REVALIDATE_SECRET`, `SESSION_COOKIE_SECRET`
WC engine: `WC_GRAPHQL_URL`, `WC_REST_URL`, `WC_REST_KEY`, `WC_REST_SECRET`
Vendure engine: `VENDURE_SHOP_API_URL`, `VENDURE_ADMIN_API_URL`
Payment: `PAYMENT_PROVIDERS`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CMI_MERCHANT_ID`, `CMI_STORE_KEY`

---

## Skills — Invoke Per Task

| Working on… | Invoke skill |
|---|---|
| Next.js structure | `nextjs-app-structure` |
| Tailwind v4 patterns | `tailwind-patterns` |
| shadcn components | `nextjs-shadcn` |
| WooCommerce adapter | `woocommerce` |
| GSAP animations | `gsap-react`, `gsap-scrolltrigger` |
| Security audit | `insecure-defaults`, `api-security-best-practices` |
| Code quality | `karpathy-guidelines`, `software-architecture` |
| API design | `api-design-principles` |
| Threat modeling | `threat-modeling-expert`, `stride-analysis-patterns` |
| Testing | `webapp-testing` |
| CI/CD & deploy | `devops-cicd`, `gloxoss-cloud-manager` |
| Documentation | `api-documentation`, `documentation-templates` |
| OpenAPI specs | `openapi-spec-generation` |
| Agency proposals | `epioso-agency` |

---

## Agent Roles

See `.gemini/agents.md` for full agent definitions. Quick reference:

| Agent | Owns |
|---|---|
| 🏗️ Architect | Engine interface, monorepo, ADR compliance, addon loader |
| 🎨 Frontend | Storefront screens, components, animations, SEO |
| 🔌 WooCommerce | WC adapter, WPGraphQL, PHP plugins |
| ⚙️ Vendure | Vendure server, adapter, TS plugins, Docker |
| 🌍 i18n | Multi-language, RTL, locale routing |
| 💳 Payment | Stripe, CMI, COD, webhook verification |
| 🛡️ Security | STRIDE, headers, rate limiting, encryption, PII redaction |
| 🧪 Testing | Vitest, Playwright, E2E smoke, coverage |
| 🚀 DevOps | GitHub Actions CI, Hostinger deploy, Docker |
| 📝 Documentation | Setup docs, deploy runbook, addon authoring |

---

## Key References

- `CAHIER-DE-CHARGES.md` — single-tab dev handbook
- `pre-dev/07-blueprint.md` — 28 atomic build steps
- `pre-dev/02-SRS.md` — 81 numbered requirements
- `pre-dev/03-ADRs/` — 7 architecture decisions
- `pre-dev/06-security-requirements.md` — SR-* checklist
- `pre-dev/06-threat-model.md` — STRIDE per component
- `pre-dev/04-screen-inventory.md` — 52 screens with all states

---

## Sprint Progress

Current: **Sprint A — Foundation** (Steps 1–9)
- ✅ Step 1 — Init monorepo
- ✅ Step 2 — Scaffold storefront
- ✅ Step 3 — EcomEngine interface
- ✅ Step 4 — WooCommerceEngine adapter (stub)
- ✅ Step 5 — Brand config + theme tokens
- ⬜ Step 6 — Addon loader + flag generation
- ⬜ Step 7 — create-ecom-os CLI
- ⬜ Step 8 — Storefront baseline screens
- ⬜ Step 9 — Test harness baseline

Full blueprint: `pre-dev/07-blueprint.md`
