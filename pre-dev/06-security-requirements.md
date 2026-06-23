# Security Requirements — Ecom OS

Concrete, testable security requirements derived from the threat model (`06-threat-model.md`) and the SRS (`02-SRS.md` §2 Security). Each is owned by a specific component and verified in a specific way.

---

## 1. Authentication

### SR-AUTH-001 — Shopper auth delegated to engine
Every shopper login/register/logout/password-reset SHALL be handled by the active engine (WooCommerce or Vendure). Ecom OS code SHALL NOT operate its own user table.
**Owner:** Engine adapter · **Verified by:** integration tests + ADR-006 compliance

### SR-AUTH-002 — Merchant admin auth delegated to engine
Translation editing, payment-config changes, and any other admin-write SHALL require a valid engine admin session, verified server-side on every request.
**Owner:** i18n addon · multi-payment addon · **Verified by:** unit test of admin-only route handlers

### SR-AUTH-003 — Session cookies hardened
All session and cart cookies SHALL be set with `HttpOnly`, `Secure`, `SameSite=Lax`, and a max-age ≤ 30 days.
**Owner:** Storefront set-cookie helper · **Verified by:** E2E test asserting cookie flags

### SR-AUTH-004 — No long-lived bearer tokens in client code
No API token, bearer key, or admin credential SHALL ever appear in client-side JS bundles.
**Owner:** Build pipeline · **Verified by:** build-time regex scan of `apps/storefront/.next/static/**`

---

## 2. Authorization Matrix

Roles in v1:

| Role | Definition |
|---|---|
| **Guest** | Unauthenticated visitor |
| **Customer** | Authenticated shopper (engine-managed) |
| **Merchant admin** | Authenticated engine admin user (WP admin / Vendure admin) |
| **EPIOSO engineer** | Operator with `REVALIDATE_SECRET` and SSH access |
| **Payment provider** | External webhook source (CMI, Stripe) — authenticated by signature, not identity |

Per-endpoint authorization:

| Endpoint / Action | Guest | Customer | Merchant admin | EPIOSO engineer | Payment provider |
|---|:---:|:---:|:---:|:---:|:---:|
| Read public storefront pages | ✅ | ✅ | ✅ | ✅ | — |
| Read own cart | ✅ (by cartId) | ✅ | ✅ | ✅ | — |
| Place order | ✅ (guest co) | ✅ | ✅ | ✅ | — |
| Read own orders | ❌ | ✅ (own only) | ✅ (all) | ✅ | — |
| Read another customer's order | ❌ | ❌ | ✅ | ✅ | — |
| Edit profile / address | ❌ | ✅ (own) | ✅ (any) | ✅ | — |
| Edit translations | ❌ | ❌ | ✅ | ✅ | — |
| Edit payment gateway config | ❌ | ❌ | ❌ (engine native admin only) | ✅ | — |
| Trigger ISR revalidation | ❌ | ❌ | ❌ | ✅ (via secret) | — (engine webhook only) |
| Mark order paid | ❌ | ❌ | ❌ | ❌ | ✅ (verified signature) |
| SSH / deploy | ❌ | ❌ | ❌ | ✅ | — |

### SR-AUTHZ-001 — Server-side check on every protected action
Authorization SHALL be checked server-side at every entry point (server actions, route handlers, middleware). Client-side checks are UX hints only.
**Verified by:** explicit `assertCustomerOwnsResource()` calls in tests

### SR-AUTHZ-002 — Default-deny
Any new endpoint or server action SHALL be default-deny: it must explicitly declare its allowed roles, or it returns 403.
**Owner:** middleware or per-action helper

---

## 3. Encryption

### SR-CRYPT-001 — TLS in transit
All HTTP traffic SHALL be served over TLS 1.2+. HTTP requests SHALL receive a 301 to the HTTPS equivalent. HSTS header SHALL be set with `max-age=15552000; includeSubDomains`.
**Owner:** Reverse proxy + Next.js headers · **Verified by:** SSL Labs A grade

### SR-CRYPT-002 — Secret encryption at rest
The `ecom_payment_gateway_config.config_encrypted` column SHALL be encrypted with AES-256-GCM using a key derived from the env var `ECOM_OS_ENCRYPTION_KEY`. The key SHALL NOT be stored in the database.
**Verified by:** unit test asserting ciphertext is unreadable without the env key

### SR-CRYPT-003 — No password storage in Ecom OS tables
No table created by Ecom OS SHALL contain a password, password hash, or password-equivalent secret.
**Verified by:** schema review checklist

### SR-CRYPT-004 — No card data on our servers
The architecture SHALL guarantee card numbers, CVV, and full expiry data never touch Ecom OS code. CMI uses its hosted page; Stripe uses Elements + Payment Intents.
**Verified by:** static analysis rule banning common card-handling libs

---

## 4. Input Validation

### SR-VAL-001 — Zod at every server-side boundary
Every server action and route handler accepting input SHALL parse its input through a Zod schema before any side effect.
**Owner:** All server-facing files · **Verified by:** lint rule requiring `z.object(...)` import in server-action files

### SR-VAL-002 — Server is the source of truth for prices and totals
Order totals, line item prices, and currency SHALL be recomputed server-side from the engine's authoritative product price at order-creation time. Client-supplied prices SHALL be ignored.
**Verified by:** integration test that tampers client price and asserts server overwrites

### SR-VAL-003 — Locale validation
The `locale` URL segment SHALL be validated against the deployment's configured locale list; unknown locales return 404 (not the default locale silently).
**Verified by:** route handler test

### SR-VAL-004 — File upload restrictions
No public-facing file upload endpoint in v1. Any admin upload (via engine native admin) inherits the engine's controls.
**Verified by:** absence of upload routes in OpenAPI

### SR-VAL-005 — Webhook signature mandatory
Every webhook endpoint SHALL verify the provider's signature before performing any side effect. Missing or invalid signatures SHALL return 400 and log `signature_status` accordingly.
**Verified by:** unit test per webhook handler with valid + invalid + missing signature cases

---

## 5. Rate Limiting

### SR-RATE-001 — Per-IP rate limiting on auth endpoints
Login, register, password-reset request, and password-reset confirm SHALL be limited to 10 requests/minute per IP. Excess SHALL return 429 with `Retry-After` header.
**Owner:** Middleware · **Verified by:** load test

### SR-RATE-002 — Per-IP rate limiting on checkout
Place-order SHALL be limited to 5 attempts/minute per IP and 20/hour per customer id (when authenticated).
**Verified by:** load test

### SR-RATE-003 — Per-secret rate limiting on revalidate
`/api/revalidate` SHALL be limited to 60 requests/minute per `REVALIDATE_SECRET`. Excess returns 429.
**Verified by:** integration test

### SR-RATE-004 — Search query throttling
`/{locale}/search` SHALL accept queries ≤ 64 chars; >64 returns 400. Per-IP limit 10/sec.
**Verified by:** integration test

### SR-RATE-005 — Sane defaults documented
Every deployment's `.env.example` SHALL include rate-limit values with comments explaining trade-offs.

---

## 6. Session Management

### SR-SESS-001 — Engine-managed sessions
Session lifetime, rotation, and revocation SHALL be handled by the active engine. Ecom OS SHALL forward but not modify session cookies.

### SR-SESS-002 — Cart session
Cart cookie SHALL be valid for 30 days. Cart contents SHALL be re-validated against the engine on every read (stock, price changes).

### SR-SESS-003 — Logout
Logout SHALL clear the session cookie, the cart cookie (if guest), and any locale preference cookie. Logout SHALL be a POST (CSRF-safe via Next.js server action token).

---

## 7. Logging & Audit

### SR-LOG-001 — Structured logs
All server-side logs SHALL be JSON with at minimum: `timestamp`, `level`, `requestId`, `event`, `details`. No raw error stacks in production logs.

### SR-LOG-002 — PII redaction
Logger SHALL redact fields matching: `email`, `phone`, `address`, `card*`, `*token*`, `*secret*`, `*password*`, `authorization`.
**Verified by:** unit test of logger redactor with sample payloads

### SR-LOG-003 — Webhook audit log
Every webhook receipt SHALL append a row to `ecom_webhook_delivery_log` (FR per `05-database-schema.md`).

### SR-LOG-004 — Security events
Signature failures, rate-limit triggers, and authz-denied requests SHALL log at `warn` level with the requestId.

---

## 8. Headers & Browser Hardening

The storefront SHALL ship with at minimum these response headers on all HTML responses:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=15552000; includeSubDomains` |
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data: https://*; script-src 'self' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.stripe.com https://js.stripe.com; frame-src https://js.stripe.com;` (CMI redirect doesn't need iframe) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `X-Frame-Options` | `DENY` (legacy; CSP `frame-ancestors 'none'` preferred) |

**SR-HEAD-001** — Above headers SHALL be applied via Next.js middleware. CI test asserts all are present on a default response.

---

## 9. Dependency & Supply Chain

### SR-SUP-001 — Lockfile committed
`pnpm-lock.yaml` SHALL be committed. Builds SHALL fail on lockfile drift.

### SR-SUP-002 — CI vulnerability scan
Trivy SHALL scan dependencies on every PR; critical-severity findings block merge.

### SR-SUP-003 — Secret scanning
Gitleaks SHALL run pre-commit and on CI; matches block commit / merge.

### SR-SUP-004 — Vendure core integrity
CI SHALL fail if any file under `node_modules/@vendure/**` differs from the registry version (ADR-002).

### SR-SUP-005 — WP plugin upgrade gate
Before any WordPress / WooCommerce / WPGraphQL upgrade in a deployment, the deploy runbook SHALL require the smoke-test E2E to pass.

---

## 10. Acceptance Checklist (per deployment)

A new client deployment SHALL pass this checklist before going live:

- [ ] HTTPS enforced; SSL Labs A grade
- [ ] All security headers present (SR-HEAD-001)
- [ ] `.env` contains only secrets, not committed
- [ ] `ECOM_OS_ENCRYPTION_KEY` set and 32+ bytes random
- [ ] `REVALIDATE_SECRET` set, 32+ bytes random
- [ ] All payment provider webhooks verified end-to-end (test transaction per enabled provider)
- [ ] Rate limits enabled (SR-RATE-001..005)
- [ ] Smoke-test E2E green for the active engine
- [ ] Webhook audit log table created
- [ ] Backup procedure documented for client's chosen RDBMS
- [ ] WAF / firewall rules at infra (Hostinger / VPS) reviewed
- [ ] Admin URLs (`/wp-admin` or Vendure admin) not in robots.txt sitemap

Pinned in deploy runbook (Phase 7).
