# Risk Register — Ecom OS v1

Risks scored as **Probability × Impact (1-5 scale each) = Score (1-25)**. Owner is who watches it. Mitigation is what we do up front; trigger is what we do if it happens.

---

## High-priority risks (Score ≥ 12)

| ID | Risk | P | I | Score | Mitigation (pre) | Trigger response | Owner |
|---|---|:-:|:-:|:-:|---|---|---|
| R-01 | EPIOSO client load spikes and stalls Ecom OS build | 4 | 4 | **16** | Protect 1 day/week minimum; Sprint A scoped to fit part-time; sprints are 4 weeks with ~20% buffer | If a sprint slips > 1 week, escalate to Gate A/B early and re-scope (drop, not delay) | zakio |
| R-02 | No paying pilot client closes by Gate A (Week 8) | 3 | 4 | **12** | Pre-pitch existing EPIOSO contacts at Sprint A start; staging URL ready by Week 8 to use as live demo | Pause Sprint D, redirect Sprint C buffer into lead-gen + polish | zakio |
| R-03 | CMI integration is poorly documented + requires real merchant account for end-to-end testing | 4 | 3 | **12** | Acquire a CMI sandbox or partner merchant early (Week 5); document anything found because it's the moat | If sandbox is unavailable for Step 19, ship COD + Stripe in v1 and add CMI in v1.0.1 within 2 weeks | zakio |

---

## Medium-priority risks (Score 6–11)

| ID | Risk | P | I | Score | Mitigation | Trigger response | Owner |
|---|---|:-:|:-:|:-:|---|---|---|
| R-04 | WPGraphQL plugin update breaks the adapter | 3 | 3 | **9** | Pin plugin versions per deployment; integration tests; smoke-test on upgrade | Roll back plugin; patch adapter; emit release note | zakio |
| R-05 | Vendure ships a breaking change between Sprint A and Sprint D | 2 | 4 | **8** | Pin Vendure version in `apps/vendure/package.json`; monitor Vendure release notes | Stay on pinned version for v1; plan upgrade in v1.1 | zakio |
| R-06 | A regional competitor productizes the same wedge first | 3 | 3 | **9** | Ship and deploy publicly within 4 months (M5 by Week 8 is the public signal); first case study locks position | Differentiate on MENA addons depth (CMI, COD, RTL, multi-branch in v1.1) | zakio |
| R-07 | First deployment exposes a security flaw under real load | 2 | 5 | **10** | Sprint C security pass (Step 20); SR-* acceptance checklist; rate limiting + webhook signing | Patch within 24h; post-mortem; add regression test | zakio |
| R-08 | Vendure GPL interpretation challenged by a client's legal team | 1 | 5 | **5** | ADR-002 plugin-only discipline; document license posture in SOW (Phase 8) | Cite ADR-002 + Vendure license exception + Phase 1 research; offer commercial-license option if client insists | zakio |
| R-09 | Hostinger Node app slot limits crash a high-traffic WC deployment | 3 | 3 | **9** | Document upgrade path to VPS; load-test (NFR-020); cache aggressively (ISR) | Migrate that client to VPS; add to runbook as a known crossover scale | zakio |
| R-10 | A merchant edits translations to inject malicious content | 2 | 3 | **6** | i18n values stored as plain text; React auto-escapes; rich-text NOT supported in v1 | Re-render value; log incident; document for merchant training | zakio |
| R-11 | Build slips past 16 weeks → loss of competitive timing | 3 | 3 | **9** | Strict v1 scope discipline (charter Sec 5); already deferred multi-branch routing | Drop a v1 addon (Stripe before CMI) to hit the window; never extend timeline silently | zakio |
| R-12 | Email deliverability poor for transactional emails (SPF/DKIM not set per client) | 3 | 3 | **9** | Deploy runbook includes SPF/DKIM checklist; default to a managed provider for risky deployments | Add SendGrid/Resend per affected client; charge extra | zakio |
| R-13 | Hostinger SSH key rotation breaks deploy automation | 2 | 3 | **6** | Documented in deploy runbook; per-deployment SSH keys | Rotate manually; update runbook; consider GitHub Actions OIDC alternative for v1.1 | zakio |

---

## Low-priority risks (Score ≤ 5)

| ID | Risk | P | I | Score | Mitigation | Trigger response | Owner |
|---|---|:-:|:-:|:-:|---|---|---|
| R-14 | A WC plugin a client requires conflicts with the adapter | 2 | 2 | **4** | Document the supported WC plugin set in setup docs | Patch adapter or politely refuse that plugin | zakio |
| R-15 | Tailwind v4 stable release shifts behavior mid-build | 1 | 2 | **2** | Pin Tailwind version in lockfile | Upgrade in a dedicated PR after release notes review | zakio |
| R-16 | Next.js 16 mid-build patch breaks RSC behavior | 1 | 3 | **3** | Pin Next version per deployment | Defer upgrade; test in branch first | zakio |
| R-17 | Stripe webhook secret leaked via deploy script | 2 | 2 | **4** | Secrets only in env vars; gitleaks pre-commit; deploy script reads from env, never logs | Rotate immediately; review log retention | zakio |
| R-18 | Documentation incomplete by Step 21 → handoff friction | 2 | 2 | **4** | Docs are a step, not an afterthought; review against checklist in `02-PRD.md` §6 | Block M8 sign-off until docs pass review | zakio |
| R-19 | Visual regression suite (Step 27) flaky in CI | 2 | 2 | **4** | Use Playwright's stable mode; pin browser version; tolerate small antialiasing diffs | Increase tolerance; isolate flaky tests | zakio |
| R-20 | Client expects mobile app delivered as part of v1 | 1 | 3 | **3** | Charter Sec 5 explicitly excludes native mobile; PWA only | Hold the line; quote separately as a v1.1 addon | zakio |

---

## Risk-handling philosophy

- **No risk is "accepted and forgotten."** Every risk above has a named trigger response.
- **Slippage is dropped scope, not extended timeline.** Charter Sec 5 lists what's already cut; if the timeline slips, the next thing to cut is documented at trigger time, not negotiated under pressure.
- **Security risks (R-07, R-17) get patched first, always.** No "we'll do it next sprint."
- **Commercial risks (R-02, R-06, R-11) trigger Gate A/B re-evaluation, not denial.**

---

## Top-of-mind summary

If only one risk gets weekly attention, make it **R-01 (capacity)**.
If two — add **R-02 (no pilot client)**.
If three — add **R-03 (CMI integration)**.

These three together account for ~80% of the project's existential risk.
