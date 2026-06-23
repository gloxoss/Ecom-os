# Privacy & Compliance — Ecom OS

Ecom OS is built as a privacy-respecting starter kit. Per-deployment specifics (chosen analytics, marketing tools, legal jurisdiction) are filled in by the client and EPIOSO together at kickoff. This document covers what the **platform** guarantees by default.

---

## 1. Data Collected & Legal Basis

| Data category | Specific fields | Where stored | Purpose | Legal basis (GDPR Art. 6) | Retention |
|---|---|---|---|---|---|
| **Identification** | Name, email, phone | Engine native (`wp_users` / `customer`) | Account, order delivery, support | **Contract** (Art. 6(1)(b)) for orders; **Consent** for marketing | Until account deletion, then 7 years for billing/legal (tax law) |
| **Authentication** | Password hash (engine), session token | Engine native | Sign in | Contract | Until password change / session expiry |
| **Address** | Country, city, street, postal, ZIP | Engine native | Shipping, billing | Contract | Same as identification |
| **Order** | Items, totals, payment method, currency, locale | Engine native + `ecom_payment_gateway_config` (config only, not orders) | Fulfilment, accounting, support | Contract + **Legal obligation** (Art. 6(1)(c)) for invoices | 10 years (Morocco commercial code) for invoices |
| **Cart** | cartId (opaque), items list | Engine session + cookie | Persistence between visits | **Legitimate interest** (Art. 6(1)(f)) | 30 days |
| **Locale preference** | Selected locale | Cookie | UX persistence | Legitimate interest | 1 year |
| **Webhook audit log** | Provider event payload (raw), signature status, response | `ecom_webhook_delivery_log` | Fraud investigation, dispute resolution | Legitimate interest + Legal obligation | 12 months, then archive or delete |
| **Server logs** | IP, user-agent, request path, status, latency | Hostinger / VPS log files | Diagnostics, abuse detection | Legitimate interest | 90 days |
| **Marketing analytics** | Page views, events | **NOT collected by Ecom OS in v1** — only if the client enables an optional analytics addon (out of v1) | — | — | — |
| **Payment card data** | **NEVER STORED** | n/a — CMI hosted page / Stripe Elements | — | — | n/a |
| **Translation edit history** | `updated_by` (engine user id), `updated_at` | `ecom_i18n_dictionary` | Audit, accountability | Legitimate interest | Lifetime of the row |

### Special categories (Art. 9 GDPR)
None collected by default. If a client deployment introduces them (e.g., health data for a medical-supply storefront), additional safeguards apply — out of scope for v1.

---

## 2. Cookies

### Cookie inventory

| Cookie | Purpose | Category | Lifetime | First/Third party |
|---|---|---|---|---|
| `ecom_session` (engine-native name varies) | Login session | **Strictly necessary** | Engine-managed | First |
| `ecom_cart_id` | Cart persistence between visits | **Strictly necessary** | 30 days | First |
| `ecom_locale` | Persist locale choice | **Functional** | 1 year | First |
| `ecom_consent` | Records the visitor's cookie consent decision | **Strictly necessary** | 12 months | First |
| Stripe cookies (`__stripe_mid`, `__stripe_sid`) | Stripe fraud detection on checkout | **Strictly necessary** (only set during checkout) | Up to 1 year | Third (Stripe) |
| (Analytics / marketing cookies) | Optional — only if a future addon enables them | **Statistics** / **Marketing** | per addon | per addon |

### Cookie consent

- v1 ships a **strictly-necessary-only** default. A consent banner is shown on first visit asking the visitor to accept / customize / reject **non-essential** cookies.
- If only strictly-necessary cookies are in use, the banner is reduced to a single-line notice (allowed under most EU regulator guidance).
- Visitor can revisit consent via a footer link (`/{locale}/legal/cookies`).
- Consent record stored in `ecom_consent` cookie; no separate server-side ledger in v1.

---

## 3. GDPR Checklist (rights of the data subject)

| Right | How Ecom OS supports it | Owner |
|---|---|---|
| **Right of access** (Art. 15) | Customer downloads their data via the engine admin's data export tool (WP: `wp-cli user export`, Vendure: customer export plugin) | Merchant + engine native |
| **Right to rectification** (Art. 16) | Customer edits profile + addresses via `/account/profile` and `/account/addresses` (Stories 2.x / S-35 / S-38) | Storefront |
| **Right to erasure** (Art. 17) | "Delete my account" action in `/account/profile` triggers engine native deletion; orders retained under legal-obligation basis with PII pseudonymized | Storefront + engine |
| **Right to restrict processing** (Art. 18) | Account-level "pause processing" flag not in v1; documented as v1.1 addon if a client needs it | v1.1 |
| **Right to data portability** (Art. 20) | Same export mechanism as right of access; format is JSON | Engine native |
| **Right to object** (Art. 21) | Marketing opt-out via account preferences; no marketing in v1 default | v1.1 |
| **Right not to be subject to automated decision-making** (Art. 22) | No automated decisions made on customer data in v1 | n/a |

### SR-PRIV-001 — Data export and deletion endpoints
Each deployment SHALL have documented procedures (in the deploy runbook) for a merchant or engineer to fulfill data subject requests within 30 days of receipt.

---

## 4. Other Jurisdictions

| Jurisdiction | Applies when | What Ecom OS provides |
|---|---|---|
| **GDPR (EU/EEA)** | Any visitor from EU/EEA | Default — see above |
| **UK GDPR + DPA 2018** | UK visitors | Same controls; documentation references UK ICO |
| **CCPA / CPRA (California)** | California residents | "Do Not Sell or Share My Personal Information" link added to footer if `CCPA_ENABLED=true`; opt-out routed to engine native flag |
| **Loi 09-08 (Morocco)** | Morocco — applies to any deployment with Moroccan customers | Privacy policy template references CNDP (Commission Nationale de contrôle de la Protection des Données à caractère Personnel); declaration to CNDP is the merchant's responsibility — documented as a kickoff item |
| **PCI DSS** | Anything touching card data | Out-of-scope: card data never reaches our servers. CMI and Stripe are PCI-compliant intermediaries. Each deployment retains PCI SAQ-A scope (smallest) |

---

## 5. Data Processor / Sub-processor Posture

For each Ecom OS deployment, EPIOSO acts as **processor** (the merchant is the controller). A Data Processing Agreement (DPA) template ships with the client onboarding package (Phase 8).

### Default sub-processors per deployment

| Sub-processor | Purpose | Region | DPA available |
|---|---|---|---|
| Hostinger | Hosting (WC engine) | EU / global | Yes (Hostinger DPA) |
| VPS provider (per client — Hetzner / Contabo / Hostinger VPS) | Hosting (Vendure engine) | EU | Yes |
| Stripe | Payments | Global | Yes (Stripe DPA) |
| CMI | Payments (Morocco) | Morocco | DPA per merchant agreement |
| Email provider (SMTP / SendGrid / Mailgun / Resend) | Transactional email | Per provider | Per provider |
| Sentry (optional) | Error tracking | EU region available | Yes |

Sub-processor changes per deployment SHALL be added to the deployment's DPA and the merchant notified.

---

## 6. Data Retention Policy (Ecom OS-owned data)

| Data | Retention | Action at end |
|---|---|---|
| `ecom_i18n_dictionary` rows | Lifetime of the deployment | Deleted on uninstall |
| `ecom_payment_gateway_config` rows | Lifetime of the deployment | Deleted on uninstall |
| `ecom_webhook_delivery_log` | 12 months | Archived (cold) or deleted; PII inside payloads pseudonymized before archive |
| `ecom_branch` + mappings (v1.1) | Lifetime of the deployment | Deleted on uninstall |
| Storefront server logs | 90 days | Rotated by infra |

Engine-native data retention follows the engine's defaults plus any client-specific policy.

---

## 7. Privacy by Design Decisions

Decisions made at design time that reduce privacy risk:

1. **Auth delegated to engine** (ADR-006) → no secondary user database, no sync risk
2. **No card data on our servers** → drops PCI scope to the lowest tier
3. **Webhook log payloads redact PII before storage** → fraud research is possible without keeping raw addresses in plaintext audit
4. **Analytics not bundled in v1** → no default tracking; clients opt-in explicitly
5. **One-app-per-client (ADR-003)** → no cross-client data exposure risk
6. **Encrypted payment config at rest** → DB compromise alone does not yield gateway credentials
7. **Locale on every persisted user-facing string** → enables localized data export for GDPR rights requests

---

## 8. Open Items for Per-Deployment Onboarding

These are filled in at client kickoff (Phase 8 SOW), not by Ecom OS itself:

- Controller name + contact (the merchant)
- DPO contact (if applicable — required for larger merchants in EU)
- List of countries the merchant ships to (determines applicable laws)
- CNDP declaration status (Moroccan merchants)
- Privacy policy + cookies policy + terms text (per-merchant)
- Data retention exceptions specific to the merchant's industry
- Approved sub-processor list (mandatory if merchant requires DPA)
