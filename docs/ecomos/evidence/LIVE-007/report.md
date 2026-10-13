# Item 7 Production Runtime Security, CSP Nonces & Cookie Controls Evidence Report

- **Date:** 2026-10-13
- **Agent:** agent-4 (executor/commerce)
- **Status:** PASS
- **Target Environments:**
  1. Live Production-Mode Storefront (`http://localhost:3000`, `next start -p 3000`)
  2. Production Security Test Harness (`scripts/verify-production-runtime.mjs`) — PASS (exit 0)
  3. Security Unit & Contract Test Suite (`apps/storefront/src/__tests__/security`) — 76/76 PASS across 12 files

## Verified Acceptance Criteria

1. **Content Security Policy (CSP) & Strict Nonce Isolation:**
   - Evaluated live response headers from production server:
     - Header: `content-security-policy`
     - Directives: `default-src 'self'; script-src 'self' 'nonce-...' 'strict-dynamic' https://js.stripe.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`.
   - Verified nonce isolation across sequential requests:
     - Request 1 Nonce: `MjRiMGM3OTctNTcxYy00YmE5LTlmZGItNDI1ZDk0NjNkNDBm`
     - Request 2 Nonce: `NWU2MWZmNzAtMDM2YS00ZmNlLTkzODMtN2RiNjE0Yzc4ZDQ3`
     - Cryptographically distinct base64-encoded random nonces generated per HTTP transaction; zero reuse.

2. **Standard Production Security Headers:**
   - Live HTTP responses from port 3000 verified with:
     - `Strict-Transport-Security: max-age=15552000; includeSubDomains` (HSTS enabled).
     - `X-Content-Type-Options: nosniff` (MIME-sniffing prevention).
     - `X-Frame-Options: DENY` (anti-clickjacking).
     - `Referrer-Policy: strict-origin-when-cross-origin`.
     - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
     - `X-Request-Id: <uuid>` (traceable per-request identifier).

3. **HTTP Cookie Attributes & Session Security:**
   - Cart-Token cookie (`ecom_cart_token`) options verified in `apps/storefront/src/features/cart/server/cart-actions.ts`:
     - `httpOnly: true` (inaccessible to client JavaScript).
     - `secure: true` in production mode.
     - `sameSite: 'lax'` (CSRF mitigation).
     - `path: '/'`.

4. **Account Route Strict Containment:**
   - Account and authentication paths remain strictly disabled for guest commerce MVP.
   - Tested `/account`, `/fr/account`, `/account.html`, `/en/account.html`, `/account.json`.
   - All variants return HTTP 404 with `Cache-Control: no-store`, even when presented with forged cookies.

5. **Fail-Closed Runtime Configuration Validation:**
   - Verified in `apps/storefront/src/lib/runtime-config.ts`:
     - Disallows mock/fake engines in production mode.
     - Requires HTTPS for all external API endpoints (`WC_REST_URL`).
     - Revalidate webhook rejects missing or invalid HMAC secrets with HTTP 401/503 and `Cache-Control: no-store, private`.
