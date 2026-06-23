# Client Sign-Off Checklist — Ecom OS Deployment

> **Reusable template.** Fields in `[BRACKETS]` are filled per deal.
> This checklist is used at **two points**: (1) at proposal sign-off to lock scope; (2) at production deployment to accept delivery.

---

## Project Identification

**Project Name:** Ecom OS deployment for [CLIENT NAME]
**SOW Reference:** ECOM-OS-[YYYY]-[NNN]
**Client:** [CLIENT LEGAL NAME]
**Client Contact:** [NAME] · [EMAIL] · [PHONE]
**Service Provider:** EPIOSO (Oussama Zaki)
**Project Start Date (Day 0):** [YYYY-MM-DD]
**Target Go-Live Date:** [YYYY-MM-DD]
**Actual Go-Live Date:** _______________

---

## Part A — Pre-Project Sign-Off (lock scope before work begins)

Sign this part **before** EPIOSO begins work, to confirm scope alignment.

By initialing each line below, I, [CLIENT CONTACT NAME], acting on behalf of [CLIENT NAME], confirm that I have **read and approved** the following:

| # | Item | Initials | Date |
|---|---|---|---|
| 1 | Problem statement and business objective — agreed | ______ | ______ |
| 2 | Feature scope (Project Proposal §2.1, Services delivered §1 of SOW) — agreed | ______ | ______ |
| 3 | Out-of-scope items (Project Proposal §2.3) — agreed | ______ | ______ |
| 4 | Optional add-ons selected: **[LIST OR NONE]** | ______ | ______ |
| 5 | Technology choices: Engine = **[WooCommerce | Vendure]**; Hosting = **[Hostinger | VPS]** | ______ | ______ |
| 6 | Languages enabled: **[FR, AR, EN, ...]** | ______ | ______ |
| 7 | Payment providers enabled: **[COD, CMI, Stripe, ...]** | ______ | ______ |
| 8 | Timeline: **[N weeks]** from kickoff to go-live | ______ | ______ |
| 9 | Total investment: **MAD [AMOUNT]** | ______ | ______ |
| 10 | Payment milestones: **40% on signature, 30% on staging, 30% on go-live** | ______ | ______ |
| 11 | Security and compliance baseline (per `06-security-requirements.md` and `06-privacy-compliance.md`) — reviewed | ______ | ______ |
| 12 | Intellectual property terms (SOW §5) — agreed | ______ | ______ |
| 13 | Data Processing Agreement: **[Attached | Not required]** | ______ | ______ |
| 14 | Definition of Done (`07-definition-of-done.md`) — reviewed | ______ | ______ |

**Client signature (Part A):** _______________________  **Date:** ___________
**Provider signature (Part A):** _______________________  **Date:** ___________

---

## Part B — Production Acceptance (sign at go-live)

Complete this part **at production deployment** to formally accept the delivery and trigger the final invoice.

### B.1 Functional acceptance

| # | Acceptance item | ✅ / ❌ | Verified by |
|---|---|---|---|
| 1 | Live URL is accessible at **[CLIENT DOMAIN]** over HTTPS | ☐ | _______ |
| 2 | Home page renders with the agreed brand (logo, colors, fonts, hero) | ☐ | _______ |
| 3 | Catalog displays the agreed products in the agreed categories | ☐ | _______ |
| 4 | Product detail pages render with images, prices, variants, stock | ☐ | _______ |
| 5 | Add-to-cart, cart, and checkout flows work end-to-end | ☐ | _______ |
| 6 | A real or test order has been placed using **every enabled payment provider** | ☐ | _______ |
| 7 | Order confirmation email is received by the customer | ☐ | _______ |
| 8 | Order notification is received by the merchant | ☐ | _______ |
| 9 | All enabled languages render correctly (including RTL for Arabic if enabled) | ☐ | _______ |
| 10 | Account creation, login, password reset, profile, orders, addresses all work | ☐ | _______ |
| 11 | Cookie consent banner appears on first visit and respects choice | ☐ | _______ |
| 12 | Privacy, Terms, Cookies, Returns pages are present in all enabled languages | ☐ | _______ |
| 13 | 404 and 500 pages render with the agreed branding | ☐ | _______ |
| 14 | Lighthouse Performance ≥ 90 on the home page (simulated mobile 3G) | ☐ | _______ |
| 15 | Storefront tested on at least 3 real mobile devices the client cares about | ☐ | _______ |

### B.2 Technical acceptance

| # | Acceptance item | ✅ / ❌ | Verified by |
|---|---|---|---|
| 16 | SSL Labs grade A on the live URL | ☐ | _______ |
| 17 | All security headers present (CSP, HSTS, X-Content-Type-Options, etc.) | ☐ | _______ |
| 18 | `06-security-requirements.md` §10 deployment acceptance checklist passed | ☐ | _______ |
| 19 | Webhook signature verification tested for every enabled payment provider | ☐ | _______ |
| 20 | Rate limits enabled on auth, checkout, revalidate endpoints | ☐ | _______ |
| 21 | All secrets stored in environment variables, not in code or DB | ☐ | _______ |
| 22 | Backup procedure documented and verified for the engine's database | ☐ | _______ |

### B.3 Handover artifacts

| # | Acceptance item | ✅ / ❌ | Verified by |
|---|---|---|---|
| 23 | Source code repository transferred to Client-controlled account | ☐ | _______ |
| 24 | `docs/setup.md` accessible and complete | ☐ | _______ |
| 25 | `docs/deploy-runbook.md` accessible, includes hosting-specific steps | ☐ | _______ |
| 26 | `docs/security.md` accessible | ☐ | _______ |
| 27 | Per-deployment README with env vars, secrets schema, operational notes | ☐ | _______ |
| 28 | Admin credentials (WP / Vendure) delivered to Client via secure channel | ☐ | _______ |
| 29 | List of installed plugins / addons and their versions documented | ☐ | _______ |
| 30 | List of Client's sub-processors documented (per `06-privacy-compliance.md` §5) | ☐ | _______ |

### B.4 Defects

| Defect | Severity (Critical / High / Med / Low) | Resolution plan | Resolution date |
|---|---|---|---|
| | | | |

Items marked **Critical** or **High** must be resolved before sign-off. Medium and Low items may be accepted with a written remediation plan.

---

## Final Sign-Off

By signing below, I, [CLIENT CONTACT NAME], on behalf of [CLIENT NAME], confirm that:

1. The deliverables listed in §B.1, §B.2, and §B.3 have been verified;
2. Any defects listed in §B.4 are accepted as documented;
3. The deployment is **accepted as delivered**;
4. The final invoice (30% of total) may be issued by EPIOSO.

**Client final acceptance:**

Name: _______________________________
Title: ______________________________
Signature: __________________________  Date: ______________

**Provider final acceptance:**

Name: Oussama Zaki
Title: Founder & Lead Engineer, EPIOSO
Signature: __________________________  Date: ______________

---

## After Sign-Off

- The 30-day post-launch support window starts on the final sign-off date above.
- Optional monthly retainer (if engaged): begins on the 1st of the month following sign-off.
- Any items NOT included in this acceptance become a fresh quote, not warranty work.
- Client retains full ownership of the source code and the right to engage any future developer.

**Thank you for trusting EPIOSO with [CLIENT NAME]'s storefront. We're proud of what we built together.**
