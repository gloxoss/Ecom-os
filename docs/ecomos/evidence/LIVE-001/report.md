# Item 1 Bring-Up Evidence Report

- **Date:** 2026-10-12
- **Agent:** agent-4 (executor/commerce)
- **Status:** PASS
- **Command Executed:** 
  - `npm --prefix apps/storefront run build` (Next.js 16.3.8 production build with webpack)
  - `$env:NODE_EXTRA_CA_CERTS = "...\paraloca.local.crt"; next start -p 3000`
- **Result:**
  - Build: 15 routes compiled cleanly, exit code 0.
  - Runtime: Production server active on port 3000 (`http://localhost:3000`).
  - Route verification:
    - `/` -> HTTP 200
    - `/catalog` -> HTTP 200
    - `/product/ecomos-test-simple` -> HTTP 200
    - `/product/ecomos-test-variable` -> HTTP 200
    - `/cart` -> HTTP 200
    - `/checkout` -> HTTP 200
    - `/api/health` -> HTTP 200
  - Security headers & CSP: Verified nonce-based CSP (`script-src 'self' 'nonce-...' 'strict-dynamic' ...`), HSTS (`max-age=15552000; includeSubDomains`), X-Frame-Options DENY, X-Content-Type-Options nosniff.
  - Environment defects noted: No fatal defects. Next-intl routing uses `localePrefix: never` when `ADDONS` does not include `i18n`, meaning routes reside at the root (`/catalog`, `/cart`, etc.) rather than `/fr/*`.

