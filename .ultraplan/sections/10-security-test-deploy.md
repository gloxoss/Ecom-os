# Section 10 — Security Hardening · Tests · Deploy

> **Batch 6 · Risk: green · Deps: all previous · Tasks: 5 · Blueprint: Steps 9, 15, 20, 21**

## Why this section exists
This is the cross-cutting section that makes the WC-engine v1 **deployable and defensible**: the SR-* security checklist, the CI gates, the test harness, the staging deploy, and the v1 docs. It runs last because it verifies everything, but several pieces (security headers middleware, CI workflow) should be drafted early and matured throughout.

## Requirements covered
- All **NFR-030..034** (security), **NFR-040..042** (maintainability, coverage), the full **SR-*** checklist
- **FR-024** webhook-driven ISR within 60s
- **FR-082** one-command deploy target

## Tasks
1. **Security middleware + headers** — `apps/storefront/src/middleware.ts` applies all SR-HEAD-001 headers (HSTS, CSP with `strict-dynamic`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`). Rate limits consolidated here (auth 10/min from §07, checkout 5/min from §06, revalidate 60/min, search 10/sec — SR-RATE-001..004). Structured JSON logger with PII redaction (SR-LOG-001/002) — redacts email, phone, address, card*, *token*, *secret*, *password*, authorization.
2. **ISR revalidation receiver + engine import guard CI** — `apps/storefront/src/app/api/revalidate/route.ts` verifies `REVALIDATE_SECRET` (Flow 4) → `revalidatePath`/`revalidateTag` for product/category paths; 401 on bad secret. Wire WC webhook (product.updated/created/deleted) to hit this. **CI rules** (`.github/workflows/ci.yml`): engine-import guard (§01), `check-vendure-pristine.sh` (Sprint-D-ready), Gitleaks, Trivy (CRITICAL,HIGH), `pnpm verify` (lint+typecheck+test), coverage ≥ 70% on packages, build.
3. **Test harness** — `vitest.config.ts` (root, unit/integration), `playwright.config.ts` (storefront E2E). Smoke E2E extended through checkout (§06/§09 wrote the specs; this section finalizes config + CI wiring). RTL screenshot tests from §08. Build-time secret-in-client-bundle scan (SR-AUTH-004).
4. **Encryption helper + deployment checklist** — AES-256-GCM helper for `ecom_payment_gateway_config` (SR-CRYPT-002), key from `ECOM_OS_ENCRYPTION_KEY` (never in DB). Complete the deployment acceptance checklist (security §10): HTTPS, headers, secrets, webhook verification, rate limits, smoke E2E, audit log table, backups.
5. **Deploy script + v1 docs** — complete `scripts/deploy-hostinger.ts` (SSH + rsync + PM2, atomic with rollback — threat model §4). Docs: `docs/setup.md`, `docs/addon-authoring.md`, `docs/deploy-runbook.md`, `docs/security.md`, per-package READMEs. Internal staging deploy to Hostinger (M5).
6. **Dual-mode hosting (ADR-008)** — gate `next.config.ts` on `ECOM_DEPLOY_MODE`: when `static`, set `output: 'export'` and `images.unoptimized: true`. Update `scripts/deploy-hostinger.ts` to handle both modes: Mode A = `pm2 reload ecom-os --update-env`; Mode B = rsync `out/` to `public_html/` + write `.htaccess` for SPA fallback. Update Checkout page to use client-side `fetch` to WC REST when `ECOM_DEPLOY_MODE=static` (replaces Server Action). Add CORS setup step to `docs/deploy-runbook.md` (WordPress `STOREFRONT_URL` env + `Access-Control-Allow-Origin` headers). Update `create-ecom-os` CLI to prompt for deploy mode. Wire Mode B rebuild: WC `product.updated` webhook → GitHub Actions `pnpm build && rsync out/` (replaces ISR for static hosts).

## Inputs
- All prior sections; security requirements doc; threat model; Cahier §10 (CI), §6 (setup)

## Outputs
- `apps/storefront/src/middleware.ts` (security headers, rate limits — consolidates §06/§07 middleware)
- `apps/storefront/src/lib/logger.ts` (structured, PII-redacted)
- `apps/storefront/src/lib/crypto.ts` (AES-256-GCM)
- `apps/storefront/src/app/api/{revalidate,webhooks/*}/route.ts`
- `.github/workflows/ci.yml` + `scripts/check-*.sh`
- `vitest.config.ts`, `playwright.config.ts`
- `scripts/deploy-hostinger.ts` (complete, dual-mode: PM2 + static rsync)
- `docs/{setup,addon-authoring,deploy-runbook,security}.md` + per-package READMEs
- `apps/storefront/public/.htaccess` (Mode B SPA fallback)
- `.github/workflows/static-deploy.yml` (Mode B: WC webhook → build → rsync)

## Acceptance Criteria
- [ ] All SR-HEAD-001 headers present on a default HTML response (CI test asserts)
- [ ] Rate limits active: auth 10/min, checkout 5/min, revalidate 60/min, search 10/sec (429 + `Retry-After`)
- [ ] Logger redacts PII fields (unit test with sample payload passes)
- [ ] `REVALIDATE_SECRET`-protected revalidate endpoint: bad secret → 401
- [ ] Product change in WC → storefront reflects within 60s (FR-024)
- [ ] CI enforces: lint, typecheck, test ≥ 70% pkg coverage, build, Gitleaks, Trivy, engine-import guard, Vendure-integrity (ready)
- [ ] No `*_SECRET`/`*_KEY` appears in `apps/storefront/.next/static/**` (build-time scan)
- [ ] `pnpm deploy:hostinger` ships to staging; atomic deploy w/ rollback (Mode A)
- [ ] `ECOM_DEPLOY_MODE=static pnpm build` produces `out/` with all product/category/PDP routes pre-rendered (Mode B)
- [ ] Mode B checkout posts directly to WC REST from browser; no server action required
- [ ] Mode B `.htaccess` routes all unknown paths to `index.html` (SPA fallback)
- [ ] Junior dev can follow `setup.md` + `deploy-runbook.md` to deploy in either mode unsupervised
- [ ] Deployment security checklist (§10) passes for staging

## Skills to load
`insecure-defaults`, `api-security-best-practices`, `owasp-top-10`, `threat-modeling-expert`, `stride-analysis-patterns`, `webapp-testing`, `devops-cicd`, `gloxoss-cloud-manager` (SSH/PM2/Nginx), `api-documentation`, `documentation-templates`

## Risks / notes
- **Draft early, mature late:** the CI workflow + security middleware should be created in an early section (skeleton) and grown as each section lands, not built in one shot at the end. This section *finalizes* them.
- **CSP `strict-dynamic`:** ensure GSAP (§05) + Stripe.js (§09) work under the CSP. Stripe needs `connect-src`/`frame-src` exceptions (already in the CSP spec, security §8). Test both under the final CSP.
- **Staging deploy = Milestone M5 = Gate A trigger.** After this section, run the Gate A pilot-client check (charter, business.md).
- **Vendure (Sprint D) pointer:** the `check-vendure-pristine.sh` CI rule is added here so the repo is Sprint-D-ready, but Vendure server/adapter/plugins are out of this plan's scope — see `pre-dev/07-blueprint.md §Steps 23–28`.
