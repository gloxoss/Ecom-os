# Ecom OS — Security Context

> Security requirements, threat model summary, and implementation checklist for all agents.

---

## Threat Model Summary (STRIDE)

Full details: `pre-dev/06-threat-model.md`

| Component | Top Threats | Mitigation |
|-----------|------------|------------|
| Storefront | XSS, CSRF, session hijack | CSP headers, server actions (CSRF-safe), HttpOnly cookies |
| Engine adapter | Credential leakage, injection | Server-only credentials, parameterized queries |
| CMI provider | Hash tampering, replay | HMAC verification, `ecom_webhook_delivery_log` dedup |
| Stripe provider | Signature bypass, replay | `stripe.webhooks.constructEvent()`, idempotency keys |
| COD provider | Fake order spam | Rate limiting (5/min checkout), email verification |
| i18n addon | Locale injection, XSS via translations | Validate locale against whitelist, sanitize translation values |
| Admin endpoints | Privilege escalation | Server-side role check on every request, default-deny |

---

## Security Requirements Checklist (SR-*)

### Authentication
- [ ] SR-AUTH-001 — Shopper auth delegated to engine
- [ ] SR-AUTH-002 — Admin auth delegated to engine
- [ ] SR-AUTH-003 — Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, max-age ≤ 30 days
- [ ] SR-AUTH-004 — No API tokens in client-side bundles

### Authorization
- [ ] SR-AUTHZ-001 — Server-side check on every protected action
- [ ] SR-AUTHZ-002 — Default-deny on all new endpoints

### Encryption
- [ ] SR-CRYPT-001 — TLS 1.2+, HSTS, HTTP→HTTPS redirect
- [ ] SR-CRYPT-002 — AES-256-GCM for `ecom_payment_gateway_config`
- [ ] SR-CRYPT-003 — No passwords in Ecom OS tables
- [ ] SR-CRYPT-004 — No card data on our servers

### Input Validation
- [ ] SR-VAL-001 — Zod at every server-side boundary
- [ ] SR-VAL-002 — Server recomputes prices (ignores client-supplied)
- [ ] SR-VAL-003 — Locale validated against configured list
- [ ] SR-VAL-004 — No public file upload in v1
- [ ] SR-VAL-005 — Webhook signature mandatory before any side effect

### Rate Limiting
- [ ] SR-RATE-001 — Auth endpoints: 10 req/min per IP
- [ ] SR-RATE-002 — Checkout: 5/min per IP, 20/hr per customer
- [ ] SR-RATE-003 — Revalidate: 60/min per secret
- [ ] SR-RATE-004 — Search: queries ≤ 64 chars, 10/sec per IP

### Session Management
- [ ] SR-SESS-001 — Engine-managed sessions
- [ ] SR-SESS-002 — Cart cookie valid 30 days, re-validated on read
- [ ] SR-SESS-003 — Logout clears all cookies, POST only

### Logging
- [ ] SR-LOG-001 — Structured JSON logs: timestamp, level, requestId, event
- [ ] SR-LOG-002 — PII redaction in logger
- [ ] SR-LOG-003 — Webhook audit log in `ecom_webhook_delivery_log`
- [ ] SR-LOG-004 — Security events logged at `warn` level

### Headers
- [ ] SR-HEAD-001 — All security headers applied via Next.js middleware

### Supply Chain
- [ ] SR-SUP-001 — Lockfile committed, builds fail on drift
- [ ] SR-SUP-002 — Trivy scans on every PR
- [ ] SR-SUP-003 — Gitleaks pre-commit + CI
- [ ] SR-SUP-004 — Vendure core integrity check in CI

---

## Required Security Headers

```typescript
// Next.js middleware — apply to all HTML responses
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "img-src 'self' data: https://*",
    "script-src 'self' 'strict-dynamic'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://api.stripe.com https://js.stripe.com",
    "frame-src https://js.stripe.com",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Frame-Options': 'DENY',
};
```

---

## Authorization Matrix

| Action | Guest | Customer | Admin | Engineer | Webhook |
|--------|:-----:|:--------:|:-----:|:--------:|:-------:|
| Read storefront | ✅ | ✅ | ✅ | ✅ | — |
| Read own cart | ✅ | ✅ | ✅ | ✅ | — |
| Place order | ✅ | ✅ | ✅ | ✅ | — |
| Read own orders | ❌ | ✅ | ✅ | ✅ | — |
| Edit translations | ❌ | ❌ | ✅ | ✅ | — |
| Trigger ISR | ❌ | ❌ | ❌ | ✅ | — |
| Mark order paid | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Deployment Security Checklist

Before any deployment goes live:
- [ ] HTTPS enforced; SSL Labs A grade
- [ ] All security headers present
- [ ] `.env` contains only secrets, not committed
- [ ] `ECOM_OS_ENCRYPTION_KEY` set (32+ bytes random)
- [ ] `REVALIDATE_SECRET` set (32+ bytes random)
- [ ] All payment webhooks verified end-to-end
- [ ] Rate limits enabled
- [ ] Smoke-test E2E green
- [ ] Webhook audit log table created
- [ ] Admin URLs not in robots.txt sitemap
