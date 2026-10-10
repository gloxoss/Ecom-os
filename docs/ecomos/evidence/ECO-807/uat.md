# ECO-807 Mobile & Desktop French Client Staging Acceptance (UAT)

- **Task**: `ECO-807`
- **Phase**: 8 (French-Moroccan ParaLoca Profile & Storefront Customization)
- **Client**: ParaLoca SARL (`paraloca.ma`)
- **Staging Environment**: `staging.paraloca.ma`
- **Date**: 2026-10-10
- **Auditor**: `runtime-cleanup`

---

## 1. Executive Summary

All French mobile and desktop customer and healthcare professional journeys were staged and verified on the isolated staging environment. The testing verified visual fidelity, responsive ergonomics, catalog discovery, owned brand showcase, discreet RFQ basket integration, and single B2C cash-on-delivery (COD) guest purchasing.

Crucially, **the independent Coming Soon page remains actively serving on production** (`paraloca.ma`) until separate, explicit production launch authorization is executed.

---

## 2. Test Execution Matrix

| Test Scenario | Viewport / Environment | Scope & Flow | Acceptance Criteria | Result |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-01: Desktop Navigation & Shell** | Desktop (1440 × 900) | Top utility bar, main header, search bar, language toggle (`FR`/`AR`) | Accessible skip link, high-contrast brand tokens, discreet `/devis` RFQ CTA visible | **PASS** |
| **UAT-02: Mobile Ergonomics & Drawer** | Mobile (375 × 812) | Hamburger sheet drawer, touch targets ≥ 44px, sticky bottom action bar | No horizontal scroll, drawer closes on escape/backdrop click, smooth category drilldown | **PASS** |
| **UAT-03: Medical Catalog & Taxonomy** | Desktop & Mobile | Mobility, Home-care, Diagnostics, Orthopaedics categories | Factual medical descriptions, equipment guides with physician disclaimers | **PASS** |
| **UAT-04: Single B2C Catalog Brand Matrix** | Desktop & Mobile | `/brands/paraloca` vs `/brands/rossmax` | Factual origin tags ('Maroc' vs 'Suisse'), owned brand badge displayed | **PASS** |
| **UAT-05: Guest-First COD Purchasing** | Desktop & Mobile | Multi-item cart -> Guest address (Casablanca) -> COD payment | Zero mandatory user account prompt, zero `wp_users` creation, order created with `customerId=0` | **PASS** |
| **UAT-06: Discreet Healthcare RFQ Flow** | Desktop & Mobile | Subdued "Ajouter au devis" CTA -> Quote basket -> Draft RFQ submission | Complete domain isolation: quote basket additions do not alter consumer shopping cart | **PASS** |
| **UAT-07: Locale & Currency Fidelity** | Desktop & Mobile | Price display across catalog & checkout | Strict Moroccan Dirham (`MAD`), French number formatting (`1 850 MAD`) | **PASS** |
| **UAT-08: Staging Isolation & Coming Soon Invariant** | Production Edge | `paraloca.ma` DNS & routing | Coming Soon landing page remains unmodified and active; no premature cutover | **PASS** |

---

## 3. Client Sign-Off & Verification Verdict

The staging acceptance suite satisfies all Phase 8 design, regulatory, accessibility, and functional contracts. Staging is approved for Phase Gate 8.
