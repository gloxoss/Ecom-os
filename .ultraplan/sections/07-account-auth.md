# Section 07 — Account & Auth

> **Batch 5 · Risk: yellow · Deps: 01 · Tasks: 4 · Blueprint: Step 11 · Screens: S-30..S-38**

## Why this section exists
Discovery Q + ADR-006: full account flow (login, register, profile, password reset, orders, order detail, address book). Auth is **delegated to the engine** (ADR-006) — Ecom OS owns no user table. This is the customer-facing surface of SR-AUTH-001..004.

## Requirements covered
- **ADR-006 / SR-AUTH-001** shopper auth delegated to engine (WC customer accounts); session token in HttpOnly cookie
- **SR-AUTH-003** session cookies hardened
- **SR-AUTHZ-001** server-side ownership check on every protected action (orders = own only)
- **SR-RATE-001** auth endpoints rate-limited (10/min per IP)

## Tasks
1. **Auth verbs on WC adapter** — `engine` customer auth: `login(email,password)`, `register(input)`, `requestPasswordReset(email)`, `confirmPasswordReset(token,password)`, `getCustomer(token)`, `listCustomerOrders(customerId)`. Forward via WC REST; store session token in HttpOnly cookie.
2. **Account routes (S-30..S-38)** — `features/account/*`: hub (S-30, redirect-to-login when logged out), login (S-31), register (S-32), password reset request (S-33) + confirm (S-34), profile (S-35), orders list (S-36), order detail (S-37), address book (S-38). Client islands for forms (React Hook Form + Zod); server actions for mutations.
3. **Middleware auth guard** — `apps/storefront/src/middleware.ts`: redirect unauthenticated `/account/*` (except login/register/reset) to `/account/login`. Rate-limit auth endpoints (10/min per IP, SR-RATE-001) → 429 + `Retry-After`.
4. **Ownership enforcement + tests** — every order/profile read checks `resource.customerId === session.customerId` server-side; return **404 (not 403)** on mismatch to prevent enumeration (threat model §1-E). Test: customer A cannot read customer B's order detail.

## Inputs
- Section 01 (interface `getCustomer`, `listCustomerOrders`, `getOrder(orderId, customerId)`), ADR-006, screen inventory §4

## Outputs
- `apps/storefront/src/features/account/{login,register,profile,orders,address-book,...}`
- `apps/storefront/src/app/(marketing)/account/...`
- `packages/engine-woocommerce/src/auth.ts` + customer/order verbs
- `apps/storefront/src/middleware.ts` (auth guard + rate limit; security headers added in §10)

## Acceptance Criteria
- [ ] New account can be created; login persists via HttpOnly cookie
- [ ] Customer sees only their own orders; reading another customer's order → 404
- [ ] Password reset request + confirm flow works end-to-end
- [ ] Auth endpoints rate-limited: 11th request/min → 429 + `Retry-After`
- [ ] Logout clears session cookie (POST only, CSRF-safe via server action)
- [ ] Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, max-age ≤ 30d

## Skills to load
`next-best-practices` (middleware, server actions, cookies), `woocommerce` (WC customer auth REST), `nextjs-shadcn` (forms), `api-security-best-practices` (rate limiting, authz), `owasp-top-10`

## Risks / notes
- WC customer auth via REST can be finicky (nonce handling, JWT vs cookie session). Confirm the WC sandbox supports the chosen auth method before building the UI — this is a known WC friction point.
- i18n of account screens is §08's concern; use translation keys (not hardcoded strings) from the start to avoid rework, even before §08 lands.
- "Magic-link option" (S-31) is **optional** per screen inventory — skip for v1 unless trivial.
