# ParaLoca — Client Staging Acceptance & User Acceptance Testing (UAT) Report

**Project:** EcomOS Dual-Engine Modular Architecture  
**Client / Brand:** ParaLoca (`paraloca` / Angelina Paris)  
**Task:** `ECO-1301` · **Stage:** `R` (Release Preparation)  
**Agent:** `sprint-rfq-1` (executor, rfq / merchant lead)  
**Base Commit:** `75026293a9b8304d8e00352f17f5b04e6d0cb72c`  
**Applicable Regulations:** Moroccan Law 84-12 (Medical Devices) & Law 31-08 (Consumer Rights)  
**Client Release Readiness:** **BLOCKED** on merchant owner disclosures and regulatory sign-off  

---

## 1. Executive Summary

This document synthesizes User Acceptance Testing (UAT) for the ParaLoca client deployment on the integrated EcomOS platform. All technical and functional user journeys—including responsive presentation, guest-first consumer checkout, discreet professional quotation (RFQ), category discovery, and administrative role boundaries—were validated against automated contracts and specification suites.

However, in accordance with EcomOS compliance invariants, **the ParaLoca client release remains BLOCKED**. While engineering capabilities pass, the merchant dossier ([`clients/paraloca/content-approval.md`](../../clients/paraloca/content-approval.md)) has no signatory on record, and all eight required merchant facts (legal entity, registered address, support contact, VAT rates, warranty terms, and local service agreements) remain explicitly flagged as **UNAPPROVED**.

---

## 2. UAT Feature Verification Matrix

| Scenario / Journey | Scope | Contract & Test Suite | Technical Status | Release Status |
|---|---|---|---|---|
| **1. Presentation & Responsive Layout** | Desktop (1440px) & Mobile (375px), 44px touch targets, skip links, WCAG AA | `clients/paraloca/brand-schema.test.ts`, `sprint-b-commerce.spec.ts` | **PASS** | Approved |
| **2. Medical Catalog & Category Taxonomy** | 4 medical categories (Mobilité, Maintien, Diagnostic, Orthopédie), equipment guides | `clients/paraloca/brand-schema.test.ts` (4/4 pass) | **PASS** | Approved |
| **3. Brand Classification & Story** | Owned brand badge vs third-party distributor brands; neutral pricing | `clients/paraloca/brand-schema.test.ts` | **PASS** | Approved |
| **4. Local Favorites Continuity** | Guest-only local storage favorites; zero customer accounts | `disabled-features.test.ts`, `cart-flow.pw.spec.ts` | **PASS** | Approved |
| **5. Guest Commerce & COD Checkout** | French locale (`fr`), Moroccan MAD currency, COD payment method, cart diffing | `cart.test.ts`, `checkout-attempts.test.ts` | **PASS** | Approved |
| **6. Discreet Professional RFQ** | Secondary professional quote CTA, 64-hex access secrets, immutable revisions | `sprint-a-rfq-auth.test.ts`, `routes.spec.mjs` | **PASS** | Approved |
| **7. RFQ Addon Off-State** | Disabling quotes removes UI, returns HTTP 404 on `/api/rfq/*`, preserves B2C cart | `disabled-features.test.ts`, `routes.spec.mjs` | **PASS** | Approved |
| **8. Scoped Merchant Role Boundaries** | Scoped store manager permissions, dynamic table prefix guard (`$wpdb->prefix`) | `capabilities.test.php`, `admin.spec.mjs` | **PASS** | Approved |
| **9. SEO & Performance Budgets** | Canonical URLs, robots.txt, sitemap.xml, 18 measured performance properties | `seo.test.ts`, `measure-storefront.pw.spec.ts` | **PASS** | Approved |
| **10. Regulatory & Merchant Dossier** | Moroccan Law 84-12 invariants, merchant facts, warranty terms | `content-approval.test.ts` (4/4 pass) | **PASS (Policy)** | **BLOCKED (Owner Facts)** |

---

## 3. Detailed Journey Findings

### 3.1 Responsive Layout, Accessibility & Touch Targets
- **Viewport Adaptation**: Verified on both desktop (1440px) and compact mobile viewports (375px). Navigation grids adjust fluidly without horizontal scroll.
- **Touch Target Sizing**: Primary interactive elements (Add to Bag, Request Quote, Pagination buttons, Menu toggle) meet the mandatory minimum 44px × 44px target dimension.
- **Accessibility & Contrast**: Core theme tokens meet WCAG AA/AAA minimum contrast ratios (`#5A1C16` primary against `#FFFDF9` background yields > 9.8:1 contrast). Skip links (`#main-content`) are localized in French and Arabic.

### 3.2 Guest Commerce & Checkout Correctness
- **Strict Guest-First Invariant**: Customer registration, account creation, and login portals remain completely unmounted and disabled across all consumer touchpoints.
- **Authoritative Cart Reconciliation**: Store API multiset reconciliation preserves exact item IDs and variations without optimistic drift.
- **Durable Attempt Claims & Response-Loss Recovery**: Purchases acquire atomic filesystem claim locks with crash recovery, preventing double-billing on network drops.
- **Moroccan Regional Defaults**: Default shipping country is locked to Morocco (`MA`), currency strictly to Moroccan Dirham (`MAD`), and payment method to Cash on Delivery (`cod`).

### 3.3 Professional RFQ Quotation Pathway
- **Discreet Navigation**: The quotation pathway does not disrupt the B2C consumer storefront. Quotation CTAs are secondary and discreet.
- **Access Secret Isolation**: Guest RFQ tokens utilize 64-hex SHA-256 digests (`accessSecretHash`). Staff capabilities cannot impersonate or read guest secrets without credentials.
- **Order Conversion Protection**: Accepts quotation revisions cleanly into WooCommerce HPOS orders with atomic CAS locking (`ecomos_rfq_claim_quote_for_conversion`).
- **Complete RFQ-Off State**: Toggling the `quotes` capability to `false` removes all quote UI components, unregisters navigation paths, and returns HTTP 404 fail-closed on `/api/rfq/*`.

---

## 4. Regulatory & Merchant Disclosure Status (Law 84-12 / Law 31-08)

### 4.1 Enforced Regulatory Policies (Technical PASS)
The codebase strictly adheres to three fundamental consumer protection rules:
1. **Zero Invented Registrations**: No fictitious registration numbers (DMP / Direction du Médicament et de la Pharmacie), CE marks, or fake certifications exist in catalog fixtures or metadata.
2. **Zero Clinical Superiority Claims**: All medical equipment PDPs and category copy omit claims of absolute cures or unverified therapeutic efficacy.
3. **Mandatory Patient Disclaimers**: All medical equipment descriptions include required statutory notices advising consultation with qualified healthcare professionals.

### 4.2 Merchant Disclosure Blockers (Release BLOCKED)
Per `clients/paraloca/content-approval.md`, all eight proposed merchant fields remain **UNAPPROVED**:
1. **Legal Entity Name**: `ParaLoca SARL` — Placeholder (unconfirmed).
2. **Registered Office Address**: `Boulevard d'Anfa, Casablanca, Maroc` — Placeholder (unconfirmed).
3. **Support Email**: `contact@paraloca.ma` — Unverified mailbox.
4. **Support Phone**: `+212 5 22 00 00 00` — Obvious synthetic placeholder.
5. **Standard VAT Rate**: `20%` — Unconfirmed against merchant tax registration.
6. **Reduced VAT Rate**: `7%` on medical orthotics — Unconfirmed for specific catalog items.
7. **Warranty Terms**: 12–36 months — Specific manufacturer coverage unconfirmed.
8. **Local Service**: Local Casablanca repair facility — Agreement unconfirmed.

**Formal Invariant:** No release certificate may be issued, and no production cutover may proceed, until the merchant owner signs Section 4 of `clients/paraloca/content-approval.md` with authentic business disclosures.
