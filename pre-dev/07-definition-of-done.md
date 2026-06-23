# Definition of Done — Ecom OS v1

"Done" is defined at three layers: **a single step**, **a milestone**, and **the v1 release**. A thing is not done until its checklist passes — no exceptions, no "we'll fix it later."

---

## 1. A single step is DONE when…

(Use for every step in `07-blueprint.md`.)

- [ ] All FR / NFR / SR requirements named in the step's "Acceptance" line pass
- [ ] Code is TypeScript strict (no implicit `any`, no `@ts-ignore` without `ponytail:` comment justifying it)
- [ ] All new logic ships with at least one test:
  - Trivial one-liners: no test needed
  - Non-trivial logic (branch, loop, parser, money/security path): minimum one `assert`-based check or `test_*.spec.ts`
- [ ] ESLint clean (`pnpm lint` exit 0)
- [ ] Type-check clean (`pnpm typecheck` exit 0)
- [ ] If the step touches public-facing UI: rendered manually in the browser at desktop + mobile + AR locale
- [ ] If the step touches an addon: addon `register()` / `disable()` exports are present
- [ ] If the step touches the engine adapter contract: both `WooCommerceEngine` AND `VendureEngine` implement the change (skip Vendure until Sprint D for net-new methods)
- [ ] Commit message is meaningful (Conventional Commits style: `feat:`, `fix:`, `chore:`, etc.)
- [ ] Step's row in `pre-dev/PROGRESS.md` updated to ✅

---

## 2. A milestone is DONE when…

(Use for every milestone in `07-milestones.md`.)

All of the per-step criteria above, PLUS:

- [ ] All steps in the milestone marked complete in the tracker
- [ ] Smoke E2E (Home → PDP → Cart → Checkout → Confirmation) passes against staging
- [ ] No known **critical** or **high** severity bug open
- [ ] Documentation for any new public-facing concept (env var, command, file location) added to `docs/`
- [ ] Milestone result reproduced from a clean clone (proves no "works on my machine")
- [ ] Self-review of milestone diff using `/simplify` skill — reuse, quality, efficiency check passed
- [ ] If the milestone is a gate (M5, M8): explicit gate decision recorded in `PROGRESS.md` notes

---

## 3. v1 release is DONE when…

(Use once before tagging `v1.0.0`.)

### Feature completeness
- [ ] All v1 features from `02-PRD.md` §3 implemented and tested
- [ ] All 81 numbered requirements from `02-SRS.md` satisfied
- [ ] All 15 user stories from `02-user-stories.md` pass with their acceptance criteria
- [ ] All 52 screens from `04-screen-inventory.md` implemented with their required states
- [ ] All 7 ADRs from `03-ADRs/` reflected accurately in the code

### Engines & adapters
- [ ] `WooCommerceEngine` passes the full integration suite against a real WC instance
- [ ] `VendureEngine` passes the same suite against a real Vendure instance
- [ ] Engine swap (`ECOM_ENGINE=woocommerce` → `vendure`) on a staging deployment succeeds with zero UI code changes
- [ ] Visual regression suite shows no engine-dependent diffs > tolerance

### Addons
- [ ] i18n addon: fr/ar/en locales, RTL on ar, merchant-editable strings, missing-key fallback verified
- [ ] Multi-payment addon: COD + Stripe + CMI all complete a real test transaction end-to-end
- [ ] Disabling an addon via env var produces a build with that addon's code tree-shaken (verified by bundle analyzer ≤ baseline + 5%)

### Tooling
- [ ] `npx create-ecom-os <name> --engine=woocommerce|vendure` produces a working dev environment in < 5 minutes from clean machine
- [ ] `pnpm deploy:hostinger` deploys to Hostinger atomically with rollback
- [ ] CI green on main: lint, typecheck, unit tests, integration tests, E2E smoke

### Security
- [ ] Full `06-security-requirements.md` §10 deployment acceptance checklist passes
- [ ] SSL Labs A grade on at least one live deployment
- [ ] Gitleaks scan clean across history
- [ ] Trivy dependency scan: zero critical findings
- [ ] All webhook handlers tested with valid + invalid + missing signatures
- [ ] Logger PII redaction verified

### Privacy
- [ ] Cookie consent banner present and functional
- [ ] Privacy policy + terms + cookies + returns placeholder pages render in all default locales
- [ ] Data export procedure documented in `deploy-runbook.md`
- [ ] Data deletion procedure documented in `deploy-runbook.md`

### Documentation
- [ ] `docs/setup.md` — junior dev can boot the project unsupervised
- [ ] `docs/addon-authoring.md` — third-party dev can add a new addon following the guide
- [ ] `docs/deploy-runbook.md` — covers both engines, both hosting baselines
- [ ] `docs/security.md` — references SR-* requirements + acceptance checklist
- [ ] Per-package `README.md` in every `packages/*` and `plugins/*`
- [ ] OpenAPI spec (`pre-dev/05-api-contracts/openapi.yaml`) matches the implemented routes

### Performance
- [ ] Lighthouse Performance ≥ 90 on the default theme `/` (mobile simulated 3G)
- [ ] LCP ≤ 2.0s on emulated 3G + mid-tier mobile (NFR-002)
- [ ] Hydrated JS on catalog page ≤ 180 KB gzipped (NFR-003)

### Operations
- [ ] Health check endpoint `/api/health` returns engine + version
- [ ] One live deployment running for ≥ 7 days without unscheduled downtime
- [ ] At least one real or representative order placed end-to-end through that deployment
- [ ] Deployment monitored (PM2 + stdout logs reviewed)

### Acceptance
- [ ] Self-review pass: would I trust this on a paying client tomorrow? (Yes / No — if No, fix before tag)
- [ ] If a paying client deployment exists: client sign-off on `08-sign-off-checklist.md`
- [ ] Git tag `v1.0.0` created; `CHANGELOG.md` written; release announced internally

---

## What "DONE" is NOT

- It is **not** "the code compiles."
- It is **not** "it works on my machine."
- It is **not** "I'll add the test later."
- It is **not** "the docs are 80% there."
- It is **not** "we know about the bug; it's tracked."

A thing is done when somebody else — or future-you in 6 months — can pick it up cold and trust it.

---

## Done-by-deletion principle

Whenever a feature is cut from v1 (per `00-project-charter.md` §5 or via slippage), it is **removed from the codebase**, not stub-shipped with a TODO. v1 ships with only what's done. Whatever isn't done by v1.0.0 starts the v1.1 backlog explicitly.
