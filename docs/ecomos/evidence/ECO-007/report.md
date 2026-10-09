# ECO-007: CSP, header containment and private caching report

## Identity and scope

- Executor: `runtime-cleanup`, experience lane.
- Assignment base: `d8fee8c51f7c6b58460e81592b78b555ef61a2f1`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `apps/storefront/src/proxy.ts`, `apps/storefront/src/app/api/revalidate/route.ts`, `apps/storefront/src/__tests__/security/headers.test.ts`, `apps/storefront/src/__tests__/security/revalidate.test.ts`, `scripts/verify-production-runtime.mjs`, `docs/ecomos/evidence/ECO-007`.
- Resources: `git-index`, `workspace-build`, `storefront-dev`, `browser`.
- Date: 2026-10-09.

## Concrete repairs

1. **Dotted account containment in proxy:**
   - Previous regex `/(^|\/)account(\/|$)/` permitted dotted extensions (such as `/account.html`, `/fr/account.html`, `/account.json`) to bypass account containment.
   - Updated regex to `/(^|\/)account(\/|\.|$)/`, ensuring all dotted variations return 404 with `Cache-Control: no-store` and CSP headers.
   - Middleware matcher previously excluded any path containing a dot (`.*\\..*`). Restricted exclusion to explicit static asset extensions (`.(?:css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$`), ensuring dotted document paths are matched and processed by security proxy.

2. **Private revalidation headers:**
   - `apps/storefront/src/app/api/revalidate/route.ts` now explicitly returns `Cache-Control: no-store, private` across all responses (503 unavailable, 401 unauthorized, 429 rate-limited, and 200 revalidated).

3. **Automated verification script:**
   - `scripts/verify-production-runtime.mjs` executes direct runtime verification:
     - Matcher static extension filtering vs page route processing.
     - Production CSP generation, `strict-dynamic`, frame-ancestors none, and per-request nonce matching.
     - Account containment across 5 route variants.
     - Revalidate route private cache-control headers.
     - Fail-closed production configuration enforcement.

## Executed checks

- `pnpm exec tsx --tsconfig apps/storefront/tsconfig.json scripts/verify-production-runtime.mjs` -> PASS (exit 0).
- `pnpm run verify` -> PASS (exit 0; includes architecture guards, lint, typecheck, 109 Vitest tests, and 15 hub tests).
