# Threat Model — Ecom OS

**Method:** STRIDE pass per component. Six major components covered. Each threat lists the mitigation EPIOSO ships in v1 and where it is enforced.

Components covered:
1. Universal Storefront (Next.js)
2. EcomEngine adapter layer
3. Multi-Payment addon (CMI / Stripe / COD)
4. i18n addon (admin write surface)
5. WooCommerce engine adapter
6. Vendure engine adapter

---

## 1. Universal Storefront (Next.js)

**Trust boundary:** Internet ↔ Next.js process. All shopper traffic enters here.

| STRIDE | Threat | Mitigation |
|---|---|---|
| **S — Spoofing** | Attacker forges shopper session by stealing/replaying session cookie | Session cookies set `HttpOnly`, `Secure`, `SameSite=Lax`; engine handles session rotation; HTTPS-only (NFR-030) |
| **S** | Attacker impersonates an EPIOSO engineer via stolen `REVALIDATE_SECRET` | Secret is per-deployment, rotated on every client; only accepted from same-origin proxy or known engine source IPs (when feasible); rate-limited |
| **T — Tampering** | Attacker modifies query params (price, qty, variant_id) at server action boundary | All server-action inputs validated via Zod (NFR-032); prices are NEVER taken from client — re-fetched from engine before order creation |
| **T** | Attacker tampers with cart cookie to inject fake items | Cart cookie stores only `cartId` (opaque); item state lives in engine; reconciliation on every cart fetch |
| **R — Repudiation** | Shopper claims they did not place an order | Engine persists order with timestamp + IP + user-agent; `ecom_webhook_delivery_log` cross-correlates payment events |
| **R** | Merchant claims they did not edit a translation | i18n `updated_by` + `updated_at` column on every write; admin login enforced by engine |
| **I — Information Disclosure** | Server-side error leaks stack trace, env, or DB content to client | Custom error boundary returns generic copy; full error logged server-side only (NFR-031) |
| **I** | API credentials end up in client bundle | Build-time check fails the build if `process.env.*_SECRET` appears in client chunks |
| **I** | Reflected XSS via product description / search query | RSC renders text via React (auto-escaped); CSP strict-dynamic + `'self'`; user-generated content sanitized server-side before persistence |
| **D — Denial of Service** | Botnet floods `/api/revalidate` or checkout | Rate limit per IP and per secret (e.g., 60 req/min) at the route handler; Hostinger / VPS firewall limits at infra layer |
| **D** | Attacker triggers expensive search queries | Search query length capped at 64 chars; throttled (10 qps per IP) |
| **E — Elevation of Privilege** | Shopper accesses another user's order detail by guessing order id | Order-detail route checks `order.customer_id === session.customer_id` before render; 404 (not 403) on mismatch to avoid enumeration |
| **E** | Shopper accesses account hub without login | Middleware redirects unauthenticated requests to `/account/login` |

---

## 2. EcomEngine adapter layer

**Trust boundary:** Storefront ↔ engine adapter ↔ backend API (over network).

| STRIDE | Threat | Mitigation |
|---|---|---|
| **S** | Attacker MITMs the storefront ↔ engine connection | TLS-only; cert pinning not required at v1 but documented as v1.1 hardening |
| **T** | Adapter forwards client-supplied data without type-checking | Every adapter return must conform to `EcomEngine` types; integration tests assert this on mock + real backends |
| **R** | Engine API failure is silently swallowed | All engine calls log structured error with `requestId` and surface a recoverable error in the UI |
| **I** | Engine API key leaked via logs | Logger redacts secret-shaped keys (`SECRET`, `KEY`, `TOKEN`, `PASSWORD`) before write; same env-var policy as NFR-031 |
| **I** | Engine returns more fields than UI needs (e.g., admin-only flags) | Adapter explicitly maps only allowlisted fields into `EcomEngine.Product` etc.; no `...spread` returns |
| **D** | A slow backend response stalls the request | Per-call timeout (5s default) + circuit-breaker (open after 3 consecutive failures in 30s); fall back to cached or empty state |
| **E** | Adapter granted admin scope by mistake | Two API keys per WC deployment: a read-only key for storefront, an order-write key only available in server actions |

---

## 3. Multi-Payment addon (CMI / Stripe / COD)

**Trust boundary:** Payment provider ↔ webhook receiver. **Highest-risk component.**

| STRIDE | Threat | Mitigation |
|---|---|---|
| **S** | Attacker POSTs forged CMI callback to mark unpaid order as paid | HMAC recomputed and compared with `HASH` field; mismatch → 400 + security event (`signature_status=invalid`) (NFR-033, FR-074) |
| **S** | Attacker forges Stripe webhook | `Stripe-Signature` header verified using webhook secret via official SDK (FR-075) |
| **T** | Attacker replays a valid callback to double-credit an order | Stripe events are idempotent by event id (deduped via `ecom_webhook_delivery_log`); CMI callbacks deduped by `oid + TransId` |
| **T** | Client tampers with amount sent to CMI to pay less than order total | Amount is set server-side from order total; CMI form payload signed; mismatch in callback amount → reject |
| **R** | Disputed payment with no record | `ecom_webhook_delivery_log` keeps full raw payload, signature status, and response for 12 months |
| **I** | Payment provider config leaked from DB | `ecom_payment_gateway_config.config_encrypted` encrypted at rest (AES-256-GCM); key from env, never in DB |
| **I** | Card data accidentally stored | Architecture guarantee: hosted/Elements only — card data never reaches our servers. CI rule: forbid imports of any "tokenize-here" libs |
| **D** | Payment provider down blocks all checkouts | Per-provider health check disables the provider's UI option if unreachable; checkout falls back to enabled alternatives (COD almost always available) |
| **E** | Webhook handler runs with broad app privileges | Webhook handlers run with minimal scope; can call only `Engine.markOrderPaid(orderId, ref)` and write to `ecom_webhook_delivery_log` |

---

## 4. i18n addon (admin write surface)

**Trust boundary:** Merchant admin ↔ `/api/admin/i18n/strings`.

| STRIDE | Threat | Mitigation |
|---|---|---|
| **S** | Attacker without merchant role calls the i18n write endpoint | Endpoint requires the engine's admin session token; verified via engine API before any DB write |
| **T** | Merchant injects HTML/JS into translation values | Stored as plain text; rendered via React (auto-escaped); rich-text NOT supported in v1 |
| **R** | Merchant denies overwriting a string | `updated_by` + `updated_at` columns; audit log retained 12 months |
| **I** | Endpoint leaks all strings to unauthenticated requests | GET requires the same admin session |
| **D** | Bulk-write floods invalidate cache constantly | Cache invalidations debounced (250ms); rate-limited at 100 writes/min per session |
| **E** | i18n endpoint accidentally exposes engine credentials | Endpoint scope is locked to `ecom_i18n_dictionary` only |

---

## 5. WooCommerce engine adapter

**Trust boundary:** Storefront ↔ WPGraphQL/WC REST.

| STRIDE | Threat | Mitigation |
|---|---|---|
| **S** | Stolen WC REST key used externally | Per-deployment key pair; least-privilege scopes (read for storefront, write for orders); rotation procedure documented |
| **T** | Outdated WC or WPGraphQL plugin introduces query injection | Pin versions in deploy runbook; monthly upgrade check; smoke-test on upgrade |
| **R** | WC plugin update silently changes API shape | Adapter integration tests catch contract drift before deploy |
| **I** | WC exposes too much in product GraphQL (e.g., admin-only meta) | Adapter requests an explicit field set; no `query { product { ... allMeta } }` |
| **I** | WP admin URL discoverable via robots.txt | Default robots.txt blocks `/wp-admin/`; deploy runbook checks |
| **D** | WC backend overwhelmed by spider traffic | ISR + cache layer in front; WP-level rate limiting (Wordfence or equivalent) |
| **E** | A plugin shipped with WC has known CVE | Monthly `wp-cli` plugin status check; security advisory list subscription |

---

## 6. Vendure engine adapter

**Trust boundary:** Storefront ↔ Vendure Shop API.

| STRIDE | Threat | Mitigation |
|---|---|---|
| **S** | Forged session token on Vendure Shop API | Vendure-issued tokens only; verified by Vendure itself |
| **T** | EPIOSO Vendure plugin introduces unsafe core override | ADR-002 enforced — CI rule rejects `node_modules/@vendure/**` modifications |
| **R** | Plugin migration runs in production without traceability | All migrations are signed git commits; deploy runbook captures migration name + timestamp |
| **I** | Admin API exposed to public network | Docker Compose binds Admin API to internal network only; reverse proxy exposes only Shop API publicly |
| **I** | PostgreSQL exposed publicly | Postgres bound to `127.0.0.1` / Docker network only; firewall blocks 5432 |
| **D** | Vendure worker process crashes silently | PM2 (or Docker `restart: always`) auto-restarts; health check endpoint pinged externally |
| **E** | Plugin given more DB privileges than needed | Plugin uses Vendure's request-scoped channels and permissions; no direct DB connection outside TypeORM |

---

## 7. Cross-cutting threats (apply to all components)

| Threat | Mitigation |
|---|---|
| Secrets in git | Gitleaks pre-commit hook; CI scan blocks merge on secret detection |
| Outdated dependencies (CVE) | Renovate / Dependabot weekly; Trivy scan in CI |
| Insecure defaults at deploy time | `npx create-ecom-os` ships a `.env.example` with all required keys; missing keys fail startup with a clear error |
| HTTPS not enforced | HSTS header set; reverse proxy redirects `http://` to `https://` |
| Logs leak PII | Logger redacts email, phone, address fields before write |
| Backup / restore not tested | Quarterly restore drill documented in deploy runbook (deferred to per-client engagement) |

---

## 8. Out of scope for v1 (accepted risk, documented for v1.1+)

- WAF (Web Application Firewall) layer — relying on Hostinger / Cloudflare defaults
- DDoS protection beyond basic rate limiting — same
- SIEM / centralized log aggregation — single-deployment scale doesn't justify it yet
- Penetration test — recommended before first paying mid-market client (Karim)
- Bug bounty program — premature
- Hardware-token MFA for merchant admin — engine's MFA is sufficient

These items go to the **v1.1 backlog** with explicit "accepted risk" notes for any client deployment.
