# Statement of Work — Ecom OS Deployment for [CLIENT NAME]

> **Reusable template.** Fields in `[BRACKETS]` are filled per deal.

**SOW Number:** ECOM-OS-[YYYY]-[NNN]
**Effective Date:** [YYYY-MM-DD]
**Project Name:** Ecom OS deployment for [CLIENT NAME]
**Service Provider:** EPIOSO — Oussama Zaki, sole proprietor
**Provider Address:** Casablanca, Morocco
**Provider Contact:** contact@epioso.com
**Client:** [CLIENT LEGAL NAME]
**Client Address:** [ADDRESS]
**Client Contact:** [NAME, EMAIL, PHONE]
**Companion Documents:** `08-project-proposal.md`, `08-sign-off-checklist.md`, NDA (if separate), DPA (if separate)

---

## 1. Services to be Delivered

EPIOSO ("Provider") shall deliver the following to [CLIENT NAME] ("Client"):

### 1.1 Platform deployment

A fully configured deployment of **Ecom OS** as defined in this SOW and `08-project-proposal.md` §2 ("Scope of Work"), including:

a. Universal Next.js 16 storefront (per `04-screen-inventory.md`)
b. Backend engine: **[WooCommerce | Vendure]**
c. Active addons: **[i18n, multi-payment, ...]**
d. Brand configuration: logo, colors, fonts, hero content, contact info
e. Live deployment at the URL: **[CLIENT DOMAIN]**

### 1.2 Source code & documentation

a. Source code repository delivered to Client (private GitHub repo, Client-owned account, or transfer)
b. `docs/setup.md`, `docs/deploy-runbook.md`, `docs/security.md`
c. Per-deployment README with environment variables, secrets schema, and operational notes

### 1.3 Post-launch support

a. 30 days of bug fixes for any defect introduced by Provider's work
b. 30 days of light content/translation updates (≤ 4h cumulative effort)
c. Email response within 2 business days during the support window

---

## 2. Acceptance Criteria

The Services are deemed delivered when Client signs `08-sign-off-checklist.md`. The checklist references concrete, verifiable items including:

- The live URL serves the storefront with Client's brand applied
- A test order can be placed end-to-end using every configured payment provider
- Both default locales (and any additional configured locales) render correctly
- The deployment passes the security acceptance checklist (`06-security-requirements.md` §10)
- Source code is delivered to a Client-controlled repository
- Documentation is accessible and complete

Client has **10 business days** from the production deployment date to review and either sign the checklist or list specific defects in writing. Items not raised within this window are deemed accepted.

---

## 3. Change Request Process

Any modification to the scope defined in §1 (Services) or §1 of `08-project-proposal.md` (Scope of Work, In scope) must be documented as a **Change Request (CR)** before work begins on the change.

A CR includes:
- Description of the requested change
- Estimated additional time and cost
- Impact on the project timeline
- Whether the change adds, modifies, or removes deliverables

Provider absorbs CRs estimated at ≤ 4 hours of work into the project buffer when reasonable. Larger CRs are quoted, signed, and invoiced separately. Work on the CR begins only after written approval.

---

## 4. Payment Milestones

Aligned with `08-project-proposal.md` §5:

| Trigger | % | Amount (MAD) | Invoice issued |
|---|:-:|:-:|---|
| Signature of this SOW | 40% | [40%] | Within 3 business days of signature |
| Staging URL delivery | 30% | [30%] | Within 3 business days of staging URL |
| Production deployment | 30% | [30%] | Within 3 business days of go-live |

Invoices payable within **15 calendar days** of issue, in MAD, by [bank transfer / agreed method]. Late payments accrue **1.5% per month** simple interest from day 16.

Optional monthly retainer (if engaged): invoiced on the 1st of each month, payable within 15 days.

---

## 5. Intellectual Property

Per `08-project-proposal.md` §6.1:

| Component | Owner | License granted to Client |
|---|---|---|
| Ecom OS platform (engine adapters, core addons, shared packages) | **EPIOSO** | Perpetual, non-exclusive, worldwide license to use, modify, and host the deployed instance for Client's own commercial operations |
| Client custom code (brand-specific addons, custom sections written exclusively for this project) | **[CLIENT NAME]** | Full ownership; Provider retains no rights |
| Content (text, images, products, translations created by Client) | **[CLIENT NAME]** | Full ownership |
| Third-party components (WordPress, WooCommerce, Vendure, libraries) | Respective owners | Per their respective licenses; Provider has verified license compatibility (see `03-ADRs/ADR-002-vendure-plugin-only-customization.md` for Vendure specifics) |

EPIOSO may reference the project in a portfolio, case study, or marketing context unless explicitly excluded in writing.

---

## 6. Confidentiality

Both parties shall treat as confidential any business, technical, or operational information disclosed in connection with this SOW that is marked confidential or reasonably understood to be so. Obligations survive for **3 years** after termination.

Excluded from confidentiality:
- Information already public
- Information already known to the receiving party
- Information independently developed
- Information disclosed by a third party without breach

A separate NDA may supersede or supplement this clause if signed.

---

## 7. Warranties

- Provider warrants that the Services will be performed in a professional and workmanlike manner.
- Provider warrants that the delivered platform will meet the acceptance criteria at the time of acceptance.
- Provider does NOT warrant: third-party services (Hostinger, Stripe, CMI, etc.), Client-introduced changes after handoff, performance under traffic volumes exceeding what was specified in the proposal.
- Bug-fix warranty: 30 days from go-live (as in §1.3).

EXCEPT AS STATED ABOVE, ALL OTHER WARRANTIES ARE DISCLAIMED TO THE EXTENT PERMITTED BY APPLICABLE LAW.

---

## 8. Limitation of Liability

Provider's total cumulative liability arising from this SOW shall not exceed the total amount paid by Client to Provider under this SOW. Neither party shall be liable for indirect, incidental, consequential, or punitive damages.

This limitation does not apply to: gross negligence, willful misconduct, indemnification obligations, or breach of confidentiality.

---

## 9. Termination

Either party may terminate this SOW with **14 calendar days** written notice for any reason. Either party may terminate immediately for material breach not cured within 7 days of notice.

On termination:
- Provider invoices for work completed up to the termination date (pro-rata against milestones)
- Provider delivers all completed source code, documentation, and deliverables to Client within 5 business days
- Mutual confidentiality survives

---

## 10. Data Protection

For any personal data processed during the project, Provider acts as a **data processor** and Client as **data controller** within the meaning of GDPR / UK GDPR / Loi 09-08 (Morocco) where applicable.

Default privacy and security posture is documented in `06-privacy-compliance.md` and `06-security-requirements.md`. A separate **Data Processing Agreement (DPA)** is signed if Client requires one.

Provider's default sub-processors are listed in `06-privacy-compliance.md` §5. Material changes to the sub-processor list will be notified in writing.

---

## 11. Governing Law & Disputes

This SOW is governed by the laws of the Kingdom of Morocco. Disputes will first be addressed by good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to the competent courts of **Casablanca, Morocco**, unless both parties agree to arbitration.

---

## 12. Entire Agreement

This SOW, together with `08-project-proposal.md`, `08-sign-off-checklist.md`, and any separately signed NDA/DPA, constitutes the entire agreement between the parties for this engagement. Prior communications are superseded.

Amendments require a signed Change Request or written addendum.

---

## 13. Signatures

By signing below, both parties confirm they have read, understood, and agreed to the terms of this Statement of Work.

**For the Service Provider (EPIOSO):**

Name: Oussama Zaki
Title: Founder & Lead Engineer
Signature: __________________________  Date: ______________

**For the Client ([CLIENT NAME]):**

Name: ______________________________
Title: _____________________________
Signature: __________________________  Date: ______________
