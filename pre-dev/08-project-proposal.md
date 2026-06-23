# Project Proposal — Ecom OS Deployment for [CLIENT NAME]

> **Reusable template.** Fields in `[BRACKETS]` are filled per deal. Sections marked *(strike if not applicable)* are removed when not relevant.

**Prepared by:** EPIOSO · contact@epioso.com
**Prepared for:** [CLIENT NAME] · [CLIENT EMAIL]
**Date:** [YYYY-MM-DD]
**Proposal validity:** 30 days from date above

---

## 1. Executive Summary

[CLIENT NAME] needs [SHORT PROBLEM STATEMENT — e.g., "to replace their current Instagram-DM-based ordering with a real e-commerce store that supports French + Arabic, accepts CMI cards, and handles delivery to multiple cities"]. EPIOSO will deliver this by deploying **Ecom OS**, our pre-built e-commerce platform, customized to [CLIENT NAME]'s brand and operational needs. Estimated timeline: **[N] weeks**. Estimated investment: **MAD [AMOUNT]**.

---

## 2. Scope of Work

### 2.1 Deliverables — In scope

- A fully branded, production-deployed e-commerce storefront accessible at **[CLIENT DOMAIN]**
- Backend engine: **[WooCommerce | Vendure]** based on the requirements assessment
- Universal Next.js 16 storefront with the following pages:
  - Home, Catalog, Category, Product Detail, Cart, Checkout (3-step), Confirmation
  - Account hub: Login, Register, Profile, Orders, Order Detail, Addresses
  - Static: About, Contact, Privacy, Terms, Cookies, Returns
- **Languages:** [LIST — e.g., French, Arabic with RTL, English]
- **Payment providers enabled:** [LIST — e.g., Cash on Delivery, CMI, Stripe]
- Brand configuration (logo, colors, fonts, hero copy) applied across the storefront
- Source code delivery via git repository ([CLIENT] retains ownership)
- Deployment to **[Hostinger | VPS]** with documented deploy procedure
- 30 days of post-launch support (bug fixes, content/translation updates, deployment troubleshooting)

### 2.2 Optional add-ons *(strike if not applicable)*

- Custom blog / lookbook section: **+MAD [X]**
- Multi-branch order routing (Ecom OS v1.1 addon): **+MAD [X]**
- WhatsApp order notifications: **+MAD [X]**
- Email automation (transactional templates beyond defaults): **+MAD [X]**
- Bulk product import from existing platform: **+MAD [X]**
- Custom analytics integration: **+MAD [X]**
- Logo or full brand identity (delivered by EPIOSO brand track): **+MAD [X]**

### 2.3 Out of scope (v1)

- Native iOS / Android apps (PWA is included)
- Marketplace / multi-vendor functionality
- Subscriptions or recurring billing
- B2B quoting and net-terms invoicing
- POS or in-store integrations
- Marketing automation (email flows, abandoned-cart) beyond the included defaults
- Data migration from a non-WooCommerce / non-Vendure source (quoted separately if needed)

---

## 3. Timeline & Milestones

| Week | Milestone | Output |
|---|---|---|
| W1 | Kickoff + brand assets received | `brand.config.ts` filled; engine instance connected |
| W1 | Storefront scaffolded | Staging URL with placeholder content but real architecture |
| W2 | Catalog + PDP live with [CLIENT]'s products | Sample order placeable on staging |
| W2 | Languages + payment providers configured | All enabled providers verified with test transactions |
| W[N-1] | Client review on staging | Iteration on copy, layout, brand details |
| W[N] | Production deployment | Live URL serving real customers |
| W[N+4] | End of included support window | Handoff complete; optional retainer begins |

Concrete dates are anchored when the proposal is signed.

---

## 4. Team & Roles

| Person | Role | Allocation |
|---|---|---|
| **Oussama Zaki (zakio)** | Lead engineer, project lead, technical decision-maker | Primary |
| EPIOSO support engineers *(if engaged)* | Hands-on execution as needed | As needed |
| **[CLIENT CONTACT]** | Single point of contact on [CLIENT NAME] side, content/brand approval | Required |
| [CLIENT TECH CONTACT, if applicable] | Server access, domain config, technical questions | If applicable |

EPIOSO communicates in **French, English, and Arabic (Darija)** as needed. All technical documentation is delivered in **English**.

---

## 5. Investment Breakdown

| Item | Amount (MAD) |
|---|---|
| Ecom OS deployment (Tier [1|2|3] base) | **[AMOUNT]** |
| Optional add-ons selected from §2.2 | **[AMOUNT]** |
| Brand identity work *(strike if not applicable)* | **[AMOUNT]** |
| **Total project investment** | **[TOTAL]** |
| Monthly retainer *(optional, post-launch)* | **MAD [X] / month** |

### Payment schedule

| Trigger | Percentage | Amount (MAD) |
|---|---|---|
| On signature of this proposal | 40% | [40% of total] |
| On staging URL delivery (milestone M5-equivalent) | 30% | [30% of total] |
| On production deployment (go-live) | 30% | [30% of total] |

Invoices issued by **EPIOSO**, payable in MAD by [bank transfer / CMI / agreed method] within **15 days** of issue.

---

## 6. Terms & Conditions

### 6.1 Intellectual property

- **Ecom OS platform** (the underlying engine adapters, addons, and shared packages) remains the property of EPIOSO. [CLIENT NAME] receives a perpetual, non-exclusive license to use, modify, and host the deployed instance.
- **[CLIENT NAME] custom code** (brand-specific addons, custom sections, custom logic written specifically for this project) is owned by [CLIENT NAME].
- **Content** (text, images, products) is owned by [CLIENT NAME].
- **Third-party components** (WordPress, WooCommerce, Vendure, etc.) retain their original licenses (GPL, MIT, BSD as applicable). Vendure's plugin license exception (see ADR-002) ensures [CLIENT NAME]'s deployment is unconstrained.

### 6.2 Confidentiality

EPIOSO and [CLIENT NAME] both treat business-sensitive information shared during the project as confidential. A separate NDA is signed if either party requests it.

### 6.3 Change requests

Changes to scope after sign-off are handled via a written change request. Small changes (≤ 4 hours of work) are absorbed in the included buffer when reasonable. Larger changes are quoted separately and added to the project as a supplemental SOW.

### 6.4 Warranty

EPIOSO warrants that the delivered platform meets the acceptance criteria in `08-sign-off-checklist.md` at the time of go-live. Bug fixes for issues introduced by EPIOSO's work are covered free for **30 days** post-launch.

### 6.5 Termination

Either party may terminate this engagement with 14 days written notice. Work completed up to the termination date is invoiced pro-rata. Source code completed is delivered to [CLIENT NAME] regardless of termination reason.

### 6.6 Data protection

EPIOSO acts as a **data processor** for [CLIENT NAME]'s customer data during the project. A Data Processing Agreement (DPA) is signed alongside this proposal if [CLIENT NAME] requires it. Default privacy and security posture is documented in `06-privacy-compliance.md` and `06-security-requirements.md`.

---

## 7. Why EPIOSO + Ecom OS

- **Productized, not improvised.** Most of what your store needs is already built, tested, and deployed elsewhere. You're not the first deployment.
- **MENA-native by default.** CMI, COD, Arabic with RTL, multi-branch routing — built in. Not "we'll figure that out."
- **You own the code.** No SaaS lock-in. Move to any hosting provider, hire any developer, change agency — your storefront comes with you.
- **Casablanca-based, world-class delivery.** Same time zone for European clients, French + Arabic + English fluent, with shipped systems serving real users at scale.

---

## 8. What happens after you sign

1. We send a kickoff document with the asset checklist (logo files, brand colors, product CSV format, payment account credentials)
2. We schedule a 30-min kickoff call to align on the first week's deliverables
3. First commit + staging URL within **7 days** of sign-off
4. Weekly progress note to [CLIENT CONTACT] every Friday

---

## 9. Acceptance

To proceed, sign the attached `08-statement-of-work.md` and `08-sign-off-checklist.md`. The first invoice (40% deposit) will follow.

**Questions before signing?** Reply to this proposal or contact us at **contact@epioso.com**.

---

*Proposal prepared by Oussama Zaki, EPIOSO. © [YEAR] EPIOSO. This proposal is confidential and intended only for [CLIENT NAME].*
