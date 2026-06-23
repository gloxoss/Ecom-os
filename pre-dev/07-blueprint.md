# Execution Blueprint — Ecom OS v1

Atomic, agent-executable build steps. Each step is self-contained — a fresh developer (or AGY executor) should be able to start it cold from the context provided.

**Timeline:** 16 weeks part-time, broken into four 4-week sprints.

| Sprint | Weeks | Output |
|---|---|---|
| **Sprint A — Foundation** | 1–4 | Monorepo, engine adapter, WC adapter, brand config, starter template |
| **Sprint B — WC engine v1 + i18n** | 5–8 | Full WC-engine storefront, i18n addon, first internal deployment **(GATE: charter Q2 — pilot client signal)** |
| **Sprint C — Multi-payment + WC engine ship** | 9–12 | Multi-payment addon (CMI + Stripe + COD), security hardening, first paying-client deployment |
| **Sprint D — Vendure engine** | 13–16 | Vendure fork, Vendure adapter, plugin scaffold, second engine production-ready |

v1.1 (post-launch): multi-branch routing, PayPal, shipping calculator, abandoned-cart.

---

## Sprint A — Foundation (Weeks 1–4)

### Step 1 — Initialize the monorepo
**Context:** No code exists. Decisions: pnpm workspaces (ADR/§Stack), TypeScript strict.
**Objective:** A working monorepo with the directory tree from `03-architecture-overview.md` §5.
**Inputs:** None.
**Outputs:** Initial commit containing `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `README.md`, `package.json` per package shell.
**Acceptance:** `pnpm install` succeeds at root; `pnpm -r build` is a no-op pass.
**Dependencies:** None.
**Sub-skills:** `/nextjs-app-structure`

### Step 2 — Scaffold `apps/storefront` (Next.js 16)
**Context:** Apply the `nextjs-app-structure` 9 architecture rules from day one.
**Objective:** A Next.js 16 App Router app with Tailwind v4, ESLint, the directory tree from the skill, and a working "Hello Ecom OS" home page.
**Inputs:** Step 1 monorepo.
**Outputs:** `apps/storefront/` with `app/(marketing)/page.tsx`, root layout with fonts + providers, globals.css with @theme tokens.
**Acceptance:** `pnpm --filter storefront dev` serves `/` with Tailwind styles; ESLint passes.
**Dependencies:** 1.
**Sub-skills:** `/nextjs-app-structure`, `/tailwind-patterns`

### Step 3 — Define the `EcomEngine` interface
**Context:** ADR-004. This is the contract every UI component will depend on.
**Objective:** `packages/ecom-engine` exports an interface, types (`Product`, `Cart`, `Order`, etc.), and a `getEngine()` factory that reads `ECOM_ENGINE` env var.
**Inputs:** `02-SRS.md` §1 (FR-010..014), `05-ERD.md` §1.
**Outputs:** `packages/ecom-engine/src/{types.ts,interface.ts,factory.ts,index.ts}`.
**Acceptance:** Type-only package; no runtime deps; consumed cleanly from `apps/storefront`.
**Dependencies:** 1.
**Sub-skills:** `/api-design-principles`

### Step 4 — Build the `WooCommerceEngine` adapter
**Context:** ADR-001 — WPGraphQL for reads, WC REST for writes.
**Objective:** A working implementation of every `EcomEngine` method against a real WC instance.
**Inputs:** EcomEngine interface (Step 3), a sandbox WC store with sample data, WPGraphQL + WC plugin installed in sandbox.
**Outputs:** `packages/engine-woocommerce/` with `client.ts`, `mappers.ts`, `products.ts`, `cart.ts`, `orders.ts`, `auth.ts`.
**Acceptance:** Integration tests pass against sandbox: list/get product, add to cart, checkout, place COD order (mock).
**Dependencies:** 3.
**Sub-skills:** `/woocommerce`

### Step 5 — Brand config + theme tokens
**Context:** FR-040/041 — per-client brand in `brand.config.ts`.
**Objective:** Typed `brand.config.ts` schema + Tailwind v4 @theme tokens read from it at build time.
**Inputs:** Step 2 storefront.
**Outputs:** `packages/brand-config/`, `apps/storefront/src/styles/brand.tokens.css` generator, `apps/storefront/brand.config.ts` (default placeholders).
**Acceptance:** Changing one color in `brand.config.ts` and rebuilding shifts the home page color; ≤ 4-hour brand-swap target documented in dev README.
**Dependencies:** 2.
**Sub-skills:** `/tailwind-design-system`

### Step 6 — Addon loader + flag generation
**Context:** ADR-007 — env-driven, tree-shaken.
**Objective:** Build-time script that reads `ADDONS` env var, emits `addons.generated.ts` importing each enabled addon's `register()`.
**Inputs:** Step 2 storefront.
**Outputs:** `scripts/generate-addons.ts`, `apps/storefront/src/addons.generated.ts` (committed empty), hook into `predev`/`prebuild`.
**Acceptance:** `ADDONS=` empty → 0 addons. `ADDONS=fake` → script fails with helpful error. Adding a placeholder addon under `packages/addons-noop` + setting `ADDONS=noop` → it registers on app start.
**Dependencies:** 2.
**Sub-skills:** `/nextjs-app-structure`

### Step 7 — `create-ecom-os` CLI
**Context:** FR-080/081 — < 5 min from `npx` to working dev.
**Objective:** A Node CLI that scaffolds a new deployment from the monorepo template.
**Inputs:** Existing monorepo.
**Outputs:** `scripts/create-ecom-os.ts` published as a bin in `package.json`; `templates/deployment/` skeleton.
**Acceptance:** `npx create-ecom-os test-client --engine=woocommerce && cd test-client && pnpm install && pnpm dev` succeeds without errors.
**Dependencies:** 4, 5, 6.

### Step 8 — Storefront baseline screens (S-01, S-10, S-11, S-12, S-20)
**Context:** `04-screen-inventory.md` — must hit Lighthouse perf ≥ 90.
**Objective:** Server-component renderings of Home, Catalog, Category, PDP, Cart driven by the WC adapter.
**Inputs:** Steps 4 + 5.
**Outputs:** `apps/storefront/src/app/(marketing)/...`, `features/catalog`, `features/pdp`, `features/cart` per the `nextjs-app-structure` feature-first rule.
**Acceptance:** All 5 screens render real data from the sandbox WC; Lighthouse ≥ 90 on `/`; LCP < 2.0s on simulated 3G.
**Dependencies:** 4, 5.
**Sub-skills:** `/frontend-design-claude`, `/nextjs-app-structure`

### Step 9 — Test harness baseline
**Context:** NFR-041 — ≥ 70% coverage on addon + adapter packages.
**Objective:** Vitest configured at root; Playwright configured for `apps/storefront`; one E2E smoke test (Home → PDP → Add to Cart).
**Inputs:** Step 8.
**Outputs:** `vitest.config.ts`, `playwright.config.ts`, `tests/smoke/checkout.spec.ts`.
**Acceptance:** `pnpm test` runs unit tests; `pnpm e2e` runs smoke spec; CI green.
**Dependencies:** 8.
**Sub-skills:** `/webapp-testing`

---

## Sprint B — WC engine v1 + i18n (Weeks 5–8)

### Step 10 — Checkout screens (S-22, S-23, S-24)
**Context:** Flow 2 + Flow 5 from `05-data-flow.md`. Server actions only; no client-side price logic.
**Objective:** Address → Payment (COD-only at this step) → Confirmation, end to end.
**Inputs:** Step 8.
**Outputs:** `features/checkout/{address,payment,confirmation}/`, server actions `placeOrder()`, `initCheckout()`.
**Acceptance:** A real COD order is created in WC sandbox from the storefront UI; Playwright E2E extended to cover it.
**Dependencies:** 4, 8.

### Step 11 — Account screens (S-30..S-38)
**Context:** ADR-006 — auth delegated to WC; engine session cookie.
**Objective:** Login, register, password reset, profile, orders list, order detail, address book — all working against WC.
**Inputs:** Step 4 (auth methods on WC adapter).
**Outputs:** `features/account/*`.
**Acceptance:** A new account can be created, login persists, customer sees their own orders only.
**Dependencies:** 4.

### Step 12 — i18n addon
**Context:** FR-060..065. Default locales fr/ar/en; ar must flip RTL.
**Objective:** Working i18n addon as a real `packages/addons-i18n/` package; `next-intl` (or built-in i18n routing); locale routing; RTL on `<html>`.
**Inputs:** Step 6 (addon loader), Step 8 (storefront).
**Outputs:** `packages/addons-i18n/{register.ts,locales/{fr,ar,en}.json,middleware.ts,components/}`.
**Acceptance:** Switching locale in UI re-renders in the chosen language; `/ar` adds `dir="rtl"`; missing key falls back to default + dev warning.
**Dependencies:** 6, 8.
**Sub-skills:** `/web-localizer`

### Step 13 — i18n WP companion plugin
**Context:** FR-065. Merchant edits strings in WP admin without redeploy.
**Objective:** A PHP plugin under `plugins/wp-epioso-i18n/` that exposes a translation admin page + calls the storefront's `PUT /api/admin/i18n/strings`.
**Inputs:** Step 12, OpenAPI from Phase 5.
**Outputs:** `plugins/wp-epioso-i18n/{plugin.php,admin-page.php,api-client.php,migrations/}`.
**Acceptance:** Editing a string in WP admin updates the storefront within 60s; activation runs DB migration; deactivation does not drop data.
**Dependencies:** 12.

### Step 14 — i18n RTL polish
**Context:** FR-063. Layouts must visually mirror, not just flip text direction.
**Objective:** Replace all directional CSS with logical properties; visual review of every screen in `ar` locale.
**Inputs:** Step 12.
**Outputs:** Updates across `features/*` and `components/*`.
**Acceptance:** No left-anchored UI in AR; Playwright RTL screenshot tests pass; manual review of S-01, S-12, S-22 in AR confirms no broken alignment.
**Dependencies:** 12.

### Step 15 — Internal deployment to staging on Hostinger
**Context:** ADR-005. First end-to-end deploy.
**Objective:** Working staging URL with WC engine + i18n addon enabled.
**Inputs:** Everything up to Step 14.
**Outputs:** `scripts/deploy-hostinger.ts`, deploy runbook `docs/deploy-runbook.md`.
**Acceptance:** Staging URL serves the full flow including AR locale and COD checkout.
**Dependencies:** 11, 13, 14.
**Sub-skills:** `/epioso-hosting`, `/fes-tawsil-deployment`

### Gate A — End of Sprint B (Week 8)
**Check:** Per `01-business-case.md` §5 — is there a paying client signed or warm pipeline?
- **Yes** → proceed to Sprint C (multi-payment + ship)
- **No** → pause the Vendure engine work (Sprint D); spend Week 9 on lead-gen / pilot pitching using staging URL as the demo

---

## Sprint C — Multi-payment + WC engine ship (Weeks 9–12)

### Step 16 — Multi-payment addon scaffold
**Context:** FR-070..073. `PaymentGateway` interface + provider registration.
**Objective:** `packages/addons-multi-payment/` with the interface, the `PAYMENT_PROVIDERS` env-var reader, the checkout UI for selecting an enabled provider.
**Inputs:** Step 10 (checkout screens).
**Outputs:** `packages/addons-multi-payment/{register.ts,interface.ts,registry.ts,ui/PaymentProviderList.tsx}`.
**Acceptance:** Checkout UI lists only enabled providers; selecting one routes to its `initiate()`.
**Dependencies:** 6, 10.

### Step 17 — COD provider
**Context:** FR-076. Highest-RICE feature.
**Objective:** Working COD provider that marks order `pending_confirmation` and notifies merchant.
**Inputs:** Step 16.
**Outputs:** `packages/addons-multi-payment/providers/cod/{provider.ts,notifications.ts}`.
**Acceptance:** A COD order from staging creates order + sends merchant email; optional WhatsApp webhook fires when configured.
**Dependencies:** 16.

### Step 18 — Stripe provider
**Context:** FR-075. Lowest-effort high-impact.
**Objective:** Stripe Elements + Payment Intents + signed webhook handler `/api/webhooks/stripe`.
**Inputs:** Step 16, Stripe test account.
**Outputs:** `providers/stripe/{provider.ts,intent.ts,webhook.ts}`, route `apps/storefront/src/app/api/webhooks/stripe/route.ts`.
**Acceptance:** Test card succeeds end-to-end; invalid webhook signature returns 400 + logs `signature_status=invalid`.
**Dependencies:** 16.

### Step 19 — CMI provider
**Context:** FR-074, security `06-threat-model.md` §3. Highest risk component.
**Objective:** Working CMI hosted-page redirect + signed callback verification.
**Inputs:** Step 16, CMI merchant credentials (test environment).
**Outputs:** `providers/cmi/{provider.ts,hash.ts,callback.ts}`, route `apps/storefront/src/app/api/webhooks/cmi/route.ts`.
**Acceptance:** Test transaction succeeds end-to-end; tampered HASH → 400 + `signature_status=invalid` + order NOT marked paid; replay → deduped via `ecom_webhook_delivery_log`.
**Dependencies:** 16.
**Sub-skills:** `/api-security-best-practices`

### Step 20 — Security hardening pass
**Context:** `06-security-requirements.md` full checklist.
**Objective:** All SR-* requirements implemented and verified.
**Inputs:** Everything to Step 19.
**Outputs:** Middleware with rate limits + security headers; logger with PII redaction; encryption helper for `ecom_payment_gateway_config`; CI rules for Vendure-core integrity (deferred to Sprint D), secret scanning, dep scan.
**Acceptance:** Deployment acceptance checklist (SR §10) passes for staging.
**Dependencies:** 17, 18, 19.
**Sub-skills:** `/insecure-defaults`, `/api-security-best-practices`

### Step 21 — Documentation pass for v1 WC engine
**Context:** FR-007. Required before any client deployment.
**Objective:** `docs/setup.md`, `docs/addon-authoring.md`, `docs/deploy-runbook.md`, `docs/security.md`.
**Inputs:** All prior work.
**Outputs:** Above docs, plus a `README.md` per package.
**Acceptance:** A junior dev can follow `setup.md` + `deploy-runbook.md` to deploy a fresh WC-engine instance unsupervised.
**Dependencies:** 20.
**Sub-skills:** `/api-documentation`

### Step 22 — First paying-client deployment (or polished demo if no client yet)
**Context:** Charter Gate at week 12.
**Objective:** Ship a real deployment using the starter template.
**Inputs:** Everything.
**Outputs:** A live `client-name.example.com` (or branded demo).
**Acceptance:** Live; order placed end-to-end; security checklist passed; client (or EPIOSO internal sign-off) on the deployment.
**Dependencies:** 21.

---

## Sprint D — Vendure engine (Weeks 13–16)

### Step 23 — Vendure server scaffold
**Context:** ADR-002 — plugin-only. Never modify core.
**Objective:** `apps/vendure/` with a Docker-Composable Vendure server + Postgres + Redis.
**Inputs:** None (parallel-safe with prior sprints).
**Outputs:** `apps/vendure/{docker-compose.yml,vendure-config.ts,Dockerfile,migrations/}`.
**Acceptance:** `docker compose up` brings up a working Vendure admin at `:3001`; CI rule rejects any `node_modules/@vendure/**` modification.
**Dependencies:** Optional Step 1; Sprint A onwards safe.
**Sub-skills:** `/architecture-patterns`

### Step 24 — `VendureEngine` adapter
**Context:** Mirror of Step 4 against Vendure Shop API.
**Objective:** Full `EcomEngine` implementation backed by Vendure GraphQL.
**Inputs:** Step 3 (interface), Step 23 (server).
**Outputs:** `packages/engine-vendure/` with client, mappers, integration tests.
**Acceptance:** Same integration test suite that passes against WC adapter passes against Vendure adapter; ECOM_ENGINE=vendure swap in staging swaps backends.
**Dependencies:** 23.

### Step 25 — i18n Vendure plugin
**Context:** Mirror of Step 13.
**Objective:** `plugins/vendure-epioso-i18n/` exposing the same admin write surface to Vendure admin.
**Inputs:** Step 12, Step 24.
**Outputs:** TypeScript Vendure plugin + admin UI extension.
**Acceptance:** Editing a translation in Vendure admin updates the storefront within 60s.
**Dependencies:** 24.

### Step 26 — Multi-payment Vendure plugin
**Context:** Reuse `packages/addons-multi-payment` providers; expose them via Vendure's PaymentMethodHandler.
**Objective:** `plugins/vendure-epioso-multi-payment/` registers CMI/Stripe/COD as Vendure payment handlers.
**Inputs:** Step 17–19 (providers), Step 24.
**Outputs:** TypeScript Vendure plugin.
**Acceptance:** All three providers work end-to-end on a Vendure-engine deployment; same SR-* security pass green.
**Dependencies:** 17, 18, 19, 24.

### Step 27 — Vendure-engine docs + smoke deploy
**Context:** Mirror of Step 21–22 for Vendure.
**Objective:** Deploy a Vendure-engine staging instance (VPS); confirm storefront works identically.
**Inputs:** Step 26.
**Outputs:** Extended `deploy-runbook.md` (Vendure section); staging URL.
**Acceptance:** Visual regression suite shows zero engine-dependent diffs.
**Dependencies:** 26.

### Step 28 — v1 release
**Context:** Both engines production-ready.
**Objective:** Tag `v1.0.0`; write release notes; update marketing material.
**Outputs:** Git tag, `CHANGELOG.md`, EPIOSO portfolio update.
**Acceptance:** A client kickoff can proceed from `npx create-ecom-os ...` to production using only Ecom OS documentation.
**Dependencies:** 22, 27.

---

## Quick reference — Step ↔ FR/NFR coverage

| Phase 2 requirement | Implemented in step |
|---|---|
| FR-001..005 (storefront) | 2, 8 |
| FR-010..014 (engine adapter) | 3 |
| FR-020..024 (WC adapter) | 4 |
| FR-030..033 (Vendure adapter) | 23, 24, 25, 26 |
| FR-040..041 (brand) | 5 |
| FR-050..053 (addon flags) | 6 |
| FR-060..065 (i18n) | 12, 13, 14, 25 |
| FR-070..076 (multi-payment) | 16, 17, 18, 19, 26 |
| FR-080..082 (tooling) | 7, 15 |
| NFR Security (SR-*) | 20 (plus continuous discipline across all steps) |

Every FR has at least one implementing step. Every step has at least one FR.
