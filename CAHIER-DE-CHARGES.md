# Cahier de Charges — Ecom OS

> **Single-tab dev handbook.** Open this while coding. For *why*, go to `pre-dev/`. For *how*, stay here.

**Owner:** Oussama Zaki (zakio) — EPIOSO · **Version:** v1.0
**Last updated:** 2026-06-23

---

## 1. Le projet en 3 phrases

Ecom OS = **EPIOSO's pre-built modular e-commerce starter kit**. Universal Next.js 16 frontend + adapter layer + two interchangeable backends (WooCommerce or Vendure). Per-deployment, addon-driven (i18n + multi-payment in v1, multi-branch in v1.1), deployed to Hostinger or VPS — turns a new client engagement from 8–12 weeks down to 2–3.

📖 Full vision: `pre-dev/00-project-charter.md`

---

## 2. Stack technique — pinned

| Layer | Tool | Version | Why |
|---|---|---|---|
| Runtime | Node.js | **22 LTS** | Vendure requirement; EPIOSO standard |
| Package manager | **pnpm** | ≥ 9 | Workspaces, speed, lockfile determinism |
| Frontend | **Next.js** | **16** (App Router, RSC) | Server-first, ISR, RSC streaming |
| Language | TypeScript | **5.5+ strict** | No `any`, no implicit |
| Styling | Tailwind CSS | **v4** (CSS-first @theme) | Single styling system, brand tokens |
| UI primitives | shadcn/ui | latest (copy in) | Owned source, not a dep |
| Forms | React Hook Form + Zod | latest | Shared schemas w/ server actions |
| GraphQL client | `graphql-request` | latest | Tiny, RSC-friendly |
| WC engine | WordPress + WooCommerce + WPGraphQL | WP 6+, WC 9+, WPGraphQL 2+ | Engine 1 — see ADR-001 |
| Vendure engine | `@vendure/core` | **pinned, plugin-only** | Engine 2 — see ADR-002 |
| Vendure DB | PostgreSQL | **16** | Vendure default |
| Vendure cache/queue | Redis | **7** | Vendure default |
| Testing | Vitest + Playwright | latest | Unit + E2E smoke |
| Lint | ESLint v9 flat | `eslint-config-next` | Per nextjs-app-structure |
| Format | Prettier + Tailwind plugin | latest | Zero debate |
| Sec scans | Gitleaks + Trivy + Semgrep | latest | Free, CI-friendly |
| Deploy (WC) | SSH + rsync + PM2 | — | Hostinger native |
| Deploy (Vendure) | Docker Compose | — | Portable |
| CI | GitHub Actions | — | Free for our scale |

📖 Stack rationale + rejections: `pre-dev/03-tech-stack-decisions.md`

---

## 3. Architecture en 1 page

```
┌─ Universal Storefront (Next.js 16) ─────────────────────┐
│                                                          │
│  app/  features/  components/  packages/ecom-engine     │
│         │                              ▲                 │
│         │                              │ implements      │
│         ▼                              │                 │
│  packages/addons-i18n      packages/engine-woocommerce  │
│  packages/addons-multi-pay packages/engine-vendure      │
│         │                              │                 │
└─────────┼──────────────────────────────┼─────────────────┘
          │                              │
          ▼                              ▼
   CMI · Stripe · COD             WC backend  OR  Vendure
                                  (PHP+MySQL)     (NestJS+PG+Redis)
```

**Two non-negotiable laws:**
1. **No UI component imports an engine-specific module.** Everything goes through `EcomEngine` (ADR-004).
2. **Vendure core is never modified — plugins only.** GPLv3 sidestepped via plugin license exception (ADR-002).

📖 Diagrams: `pre-dev/03-C4-diagrams.md` · Overview: `pre-dev/03-architecture-overview.md` · ADRs: `pre-dev/03-ADRs/`

---

## 4. Structure du monorepo

```
ecom-os/
├── apps/
│   ├── storefront/                 # Universal Next.js 16 app
│   └── vendure/                    # Vendure server (only when engine 2 is built/deployed)
├── packages/
│   ├── ecom-engine/                # EcomEngine interface + types (zero runtime deps)
│   ├── engine-woocommerce/         # WC adapter (WPGraphQL + REST)
│   ├── engine-vendure/             # Vendure adapter (GraphQL Shop API)
│   ├── addons-i18n/                # i18n addon (JSON dicts, RTL, routing)
│   ├── addons-multi-payment/       # Payment adapter + providers (CMI, Stripe, COD)
│   ├── brand-config/               # Per-deployment brand schema
│   └── ui/                         # Shared UI primitives (shadcn-derived)
├── plugins/
│   ├── wp-epioso-i18n/             # WordPress companion plugin (PHP)
│   ├── wp-epioso-multi-payment/    # WC payment integration plugin (PHP)
│   ├── vendure-epioso-i18n/        # Vendure i18n plugin (TS)
│   └── vendure-epioso-multi-payment/  # Vendure payment plugin (TS)
├── scripts/
│   ├── create-ecom-os.ts           # `npx create-ecom-os` CLI
│   ├── deploy-hostinger.ts         # SSH/PM2 deploy script
│   └── generate-addons.ts          # Build-time addon loader
├── templates/
│   └── deployment/                 # Skeleton used by create-ecom-os
├── docs/
│   ├── setup.md
│   ├── addon-authoring.md
│   ├── deploy-runbook.md
│   └── security.md
├── pre-dev/                        # ✅ Already written — read-only spec
├── .github/workflows/              # CI
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
├── README.md
└── CAHIER-DE-CHARGES.md            # This file
```

### Naming conventions

- Packages: `engine-*`, `addons-*`, `ui`, `brand-config`, `ecom-engine`
- Plugins: `wp-epioso-*` (PHP) or `vendure-epioso-*` (TS)
- Files: kebab-case (`hero-section.tsx`); types/interfaces: PascalCase
- Server components: default; client islands: `*-client.tsx` (per nextjs-app-structure rule 4)

---

## 5. Variables d'environnement

`.env.example` to ship at the root of every deployment. Missing required values must fail startup with a clear error.

```bash
# === Core ===
NODE_ENV=production
ECOM_ENGINE=woocommerce            # woocommerce | vendure
SITE_URL=https://example.com

# === Locales & addons ===
DEFAULT_LOCALE=fr
LOCALES=fr,ar,en
ADDONS=i18n,multi-payment          # comma-separated; tree-shaken if disabled

# === Brand ===
BRAND_NAME="Example Store"

# === WooCommerce engine (if ECOM_ENGINE=woocommerce) ===
WC_GRAPHQL_URL=https://wp.example.com/graphql
WC_REST_URL=https://wp.example.com/wp-json/wc/v3
WC_REST_KEY=ck_xxxxxxxxxxxx
WC_REST_SECRET=cs_xxxxxxxxxxxx

# === Vendure engine (if ECOM_ENGINE=vendure) ===
VENDURE_SHOP_API_URL=https://vendure.example.com/shop-api
VENDURE_ADMIN_API_URL=https://vendure.example.com/admin-api

# === Security (REQUIRED) ===
ECOM_OS_ENCRYPTION_KEY=            # 32+ random bytes; encrypts ecom_payment_gateway_config
REVALIDATE_SECRET=                 # 32+ random bytes; protects /api/revalidate
SESSION_COOKIE_SECRET=             # for Next-side cookie signing if needed

# === Multi-payment addon ===
PAYMENT_PROVIDERS=cod,cmi,stripe   # subset of: cod, cmi, stripe

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# CMI (Morocco)
CMI_MERCHANT_ID=
CMI_STORE_KEY=
CMI_CALLBACK_URL=https://example.com/api/webhooks/cmi
CMI_ENVIRONMENT=test               # test | production

# COD
COD_MERCHANT_EMAIL=orders@example.com
WHATSAPP_WEBHOOK_URL=              # optional

# === Email (transactional) ===
EMAIL_PROVIDER=smtp                # smtp | sendgrid | mailgun | resend
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Example Store <no-reply@example.com>"

# === Optional ===
SENTRY_DSN=
```

📖 Security on env: `pre-dev/06-security-requirements.md` §3, §6

---

## 6. Setup local — zero à running

```bash
# 1. Clone & install
git clone <repo> ecom-os && cd ecom-os
pnpm install

# 2. Configure env (WC engine path — fastest to dev)
cp .env.example .env
# Fill in: WC_GRAPHQL_URL, WC_REST_KEY, WC_REST_SECRET, ECOM_OS_ENCRYPTION_KEY, REVALIDATE_SECRET
# Need a WC sandbox? Spin one up:
docker run -d -p 8080:80 wordpress:latest  # then install WC + WPGraphQL + sample data plugin

# 3. Run the storefront
pnpm --filter storefront dev          # http://localhost:3000

# 4. Run tests
pnpm test                              # Vitest unit tests
pnpm e2e                               # Playwright smoke (needs running storefront)
pnpm lint                              # ESLint
pnpm typecheck                         # tsc --noEmit

# 5. Build
pnpm --filter storefront build
pnpm --filter storefront start         # production server

# 6. Vendure engine (only when you reach Sprint D)
cd apps/vendure
docker compose up -d                   # Postgres + Redis + Vendure
pnpm migration:run
pnpm dev                               # Vendure admin at :3001
```

📖 Full setup: `docs/setup.md` (write during Step 21)

---

## 7. Workflow de développement

### Daily commands

```bash
pnpm dev                # Run storefront with hot reload
pnpm test --watch       # TDD loop
pnpm lint --fix         # Auto-fix lint
pnpm typecheck          # Type safety check
pnpm format             # Prettier write
```

### Before every commit

```bash
pnpm verify             # composite: lint + typecheck + test
git add . && git commit -m "feat: ..."   # Conventional Commits
```

### Before every PR

```bash
pnpm verify
pnpm e2e
pnpm build              # ensure prod build succeeds
```

### Deploy

```bash
# WC engine deployment
pnpm deploy:hostinger --client=<name>

# Vendure engine deployment
ssh <vps> "cd /opt/ecom-os && docker compose pull && docker compose up -d"
```

📖 Deploy runbook: `docs/deploy-runbook.md` (write during Step 15 + 21)

---

## 8. Standards de code — non-négociables

Inherited from `nextjs-app-structure` skill, with Ecom OS additions:

### Architecture
1. **Server Components by default.** `"use client"` only for hooks, events, GSAP, browser APIs.
2. **Feature-first.** `features/<feature>/{model,data,ui,hooks,lib,server,validation}`.
3. **No hardcoded business data in JSX.** Content from `features/*/data/` or engine.
4. **Server wrapper + client island pattern** for any animated/interactive section.
5. **One styling system: Tailwind v4.** No styled-components, no CSS megafiles.
6. **`next/image` always**, no raw `<img>` for rasters.
7. **`next/link` always**, no raw `<a>` for internal routes.
8. **Import order:** React/Next → 3rd-party → internal types → internal data/lib → internal components.
9. **Strict TS:** no `any`, no `@ts-ignore` without `// ponytail: <reason>` comment.

### Ecom OS specific
10. **Never import `engine-woocommerce` or `engine-vendure` outside `lib/engine.ts`.** UI uses `EcomEngine` only. *(CI rule will fail otherwise.)*
11. **Never modify `node_modules/@vendure/**`.** Plugin-only. *(CI rule.)*
12. **Never store card data.** Period.
13. **Always verify webhook signatures** before any state change.
14. **All money in minor units.** No floats anywhere.
15. **Every server action** validated through Zod before any side effect.
16. **No `console.log` in committed code** — use the structured logger.
17. **Every addon exports `register(ctx)` + `disable()`.** CI rejects otherwise.

### Comments
- Default to **no comments**. Code self-documents via names.
- Comment only the **why** of non-obvious decisions.
- `// ponytail: <intent or ceiling>` for deliberate simplifications.

---

## 9. Plan d'exécution — Sprint A (Semaines 1–4)

> Command-level execution for the first sprint. Subsequent sprints in `pre-dev/07-blueprint.md`.

### Week 1 — Foundation
```bash
# Step 1 — Init monorepo
mkdir ecom-os && cd ecom-os
git init
pnpm init
echo "packages:\n  - 'apps/*'\n  - 'packages/*'\n  - 'plugins/*'" > pnpm-workspace.yaml
# Create tsconfig.base.json with strict settings
# Create .gitignore, README.md, CAHIER-DE-CHARGES.md (this file)
git add . && git commit -m "chore: initial monorepo"

# Step 2 — Scaffold storefront
mkdir -p apps && cd apps
pnpm create next-app@latest storefront --typescript --tailwind --eslint --app --turbopack --no-src-dir
# Apply nextjs-app-structure skeleton: features/, components/, providers/, hooks/, libs/, styles/
# Configure Tailwind v4 @theme tokens in globals.css
# Verify: pnpm --filter storefront dev → http://localhost:3000

# Step 3 — Define EcomEngine interface
mkdir -p packages/ecom-engine/src
# Write src/{types.ts, interface.ts, factory.ts, index.ts}
# Zero runtime deps, type-only
```

### Week 2 — WC adapter
```bash
# Step 4 — Build WooCommerceEngine
mkdir -p packages/engine-woocommerce/src
pnpm --filter @ecom-os/engine-woocommerce add graphql-request graphql zod
# Write client.ts, mappers.ts, products.ts, cart.ts, orders.ts, auth.ts
# Write integration tests (Vitest) using a sandbox WC + sample data
pnpm --filter engine-woocommerce test
```

### Week 3 — Brand + addon loader + CLI
```bash
# Step 5 — Brand config
mkdir -p packages/brand-config/src
# Write schema + Tailwind @theme generator

# Step 6 — Addon loader
# Write scripts/generate-addons.ts; wire to predev/prebuild
# Create placeholder packages/addons-noop to verify loading

# Step 7 — create-ecom-os CLI
# Write scripts/create-ecom-os.ts; expose as bin in package.json
npm link
npx create-ecom-os test-deployment --engine=woocommerce
cd test-deployment && pnpm install && pnpm dev   # must work cold
```

### Week 4 — Baseline screens + tests
```bash
# Step 8 — Storefront screens S-01, S-10, S-11, S-12, S-20
# Build under apps/storefront/src/features/{home,catalog,pdp,cart}
# Each section = server wrapper + client island
# Real WC data via EcomEngine

# Step 9 — Test harness
pnpm add -Dw vitest @vitest/ui playwright @playwright/test
# Configure vitest.config.ts, playwright.config.ts
# Write tests/smoke/checkout.spec.ts (Home → PDP → Add to Cart)

# Lighthouse check
npx lighthouse http://localhost:3000 --view
# Must score ≥ 90 Performance
```

🎯 **Milestone M3** (end of Week 4): real WC data rendering on storefront, Lighthouse ≥ 90, smoke test passing.

📖 Full blueprint with Sprints B/C/D: `pre-dev/07-blueprint.md`
📖 Milestones + gates: `pre-dev/07-milestones.md`

---

## 10. Quality gates — CI

GitHub Actions workflow `.github/workflows/ci.yml` must enforce:

```yaml
# .github/workflows/ci.yml (high-level)
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test --coverage    # ≥70% on adapter+addon packages
      - run: pnpm build
      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
      - name: Trivy
        uses: aquasecurity/trivy-action@master
        with: { scan-type: 'fs', severity: 'CRITICAL,HIGH' }
      - name: Vendure core integrity
        run: ./scripts/check-vendure-pristine.sh
      - name: Engine import guard
        run: ./scripts/check-engine-imports.sh
```

**Critical CI rules:**
- ❌ Vendure core modified → fail (ADR-002)
- ❌ `engine-woocommerce`/`engine-vendure` imported outside `lib/engine.ts` → fail (ADR-004)
- ❌ Secret detected → fail
- ❌ Critical CVE → fail
- ❌ Type error → fail
- ❌ Coverage < 70% on packages → fail
- ❌ Build fails → fail

📖 Definition of Done: `pre-dev/07-definition-of-done.md`

---

## 11. Documentation map — où trouver quoi

Pre-dev pack already written. **Read these once. Reference them when stuck.**

### Strategic context (read first)
- `pre-dev/00-project-charter.md` — vision, KPIs, scope, open questions
- `pre-dev/01-market-opportunity.md` — TAM/SAM/SOM, why now
- `pre-dev/01-competitive-analysis.md` — competitors + gaps
- `pre-dev/01-user-personas.md` — 4 personas (Yasmine, Marc, Karim, Salma)
- `pre-dev/01-business-case.md` — investment, payback, GO decision

### Product spec
- `pre-dev/02-PRD.md` — 20 features RICE-scored, flows, non-goals
- `pre-dev/02-SRS.md` — **81 numbered requirements** (FR-001..076 + NFR-001..060)
- `pre-dev/02-user-stories.md` — 15 stories with Gherkin acceptance criteria

### Architecture (your daily reference)
- `pre-dev/03-architecture-overview.md` — components, data flow, topology
- `pre-dev/03-tech-stack-decisions.md` — stack table + rejections
- `pre-dev/03-C4-diagrams.md` — Mermaid diagrams
- `pre-dev/03-ADRs/` — **7 architecture decisions** (read all 7 before coding)

### UX
- `pre-dev/04-information-architecture.md` — sitemap, URL structure, nav
- `pre-dev/04-user-journey-maps.md` — 4 journey flowcharts
- `pre-dev/04-screen-inventory.md` — **52 screens with all states**

### Data & API
- `pre-dev/05-ERD.md` — entity model
- `pre-dev/05-database-schema.md` — Ecom OS-owned addon tables
- `pre-dev/05-data-flow.md` — 5 canonical flows
- `pre-dev/05-api-contracts/openapi.yaml` — 7 REST endpoints

### Security & compliance (read before writing any auth/payment code)
- `pre-dev/06-threat-model.md` — STRIDE per component
- `pre-dev/06-security-requirements.md` — **SR-* checklist + deployment gate**
- `pre-dev/06-privacy-compliance.md` — GDPR/Loi 09-08/CCPA

### Execution
- `pre-dev/07-blueprint.md` — **28 atomic build steps**
- `pre-dev/07-milestones.md` — 12 milestones + 2 decision gates
- `pre-dev/07-risk-register.md` — 20 risks with triggers
- `pre-dev/07-definition-of-done.md` — what "done" means

### Client-facing (when you sell)
- `pre-dev/08-executive-summary.md`
- `pre-dev/08-project-proposal.md`
- `pre-dev/08-statement-of-work.md`
- `pre-dev/08-sign-off-checklist.md`

---

## 12. Quick reference — cheat sheet

### Skills to invoke per task

| Working on… | Invoke `/skill` |
|---|---|
| Next.js structure | `/nextjs-app-structure` |
| Tailwind v4 patterns | `/tailwind-patterns` |
| shadcn components | `/nextjs-shadcn` |
| WooCommerce | `/woocommerce` |
| GSAP animations | `/gsap-react`, `/gsap-scrolltrigger` |
| Security audit | `/insecure-defaults`, `/api-security-best-practices` |
| Code quality | `/simplify`, `/code-quality-audit` |
| Hosting / deploy | `/epioso-hosting`, `/fes-tawsil-deployment` |
| E2E testing | `/webapp-testing` |
| n8n workflows (later) | `/n8n-workflow-patterns` |

### Repo-level scripts to wire up early

```json
// package.json (root)
{
  "scripts": {
    "dev": "pnpm --filter storefront dev",
    "build": "pnpm -r build",
    "test": "vitest",
    "e2e": "playwright test",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "verify": "pnpm lint && pnpm typecheck && pnpm test --run",
    "deploy:hostinger": "tsx scripts/deploy-hostinger.ts"
  }
}
```

### Branch / commit conventions

- `main` → production-ready
- `develop` → integration branch (optional; can skip if solo)
- Feature branches: `feat/<step-N>-<short-name>` e.g., `feat/step-4-wc-adapter`
- Commits: **Conventional Commits** — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`, `ci:`

### Decision gates — protect these

| Gate | When | Question | Action if NO |
|---|---|---|---|
| **Gate A** | End of Week 8 | Pilot client signed or warm pipeline (≥ 2 leads w/ budget)? | Pause Sprint D, redirect to lead-gen |
| **Gate B** | End of Week 12 | First deployment shipped + Vendure-engine client in pipeline? | Pause Sprint D, refine WC engine |

📖 Details: `pre-dev/07-milestones.md` §Gates

---

## 13. Open items to resolve before Week 1

Carried from charter:

- [ ] **Q1 — CMI sandbox/partner merchant** — start outreach now (Risk R-03)
- [ ] **Q2 — Pilot client** — soft pre-pitch to existing EPIOSO contacts before Day 0 (Risk R-02)
- [ ] **Q3 — White-label v1 vs v1.1** — decide before Phase 8 SOW goes to first client
- [ ] **Project Day 0 anchor date** — set the calendar before running `git init`

---

## 14. Pour démarrer maintenant

```bash
# 1. Anchor Day 0
echo "Day 0: $(date +%Y-%m-%d)" >> NOTES.md

# 2. Read the 7 ADRs end to end (45 min)
cat pre-dev/03-ADRs/*.md

# 3. Init the repo
mkdir -p apps packages plugins scripts templates docs .github/workflows
git init
pnpm init

# 4. Start Step 1 from pre-dev/07-blueprint.md
# Every line above this point is preamble. Below this line is code.
```

**Lazy law:** every commit closes one Definition-of-Done checkbox from `pre-dev/07-definition-of-done.md`. No commit = no closed box. Don't write code you haven't agreed to close.

---

*Cahier de Charges v1.0 — © 2026 EPIOSO. Living document — update as decisions evolve.*
