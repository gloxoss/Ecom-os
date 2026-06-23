# ADR-006: Auth strategy — delegate to the active engine

**Status:** Accepted
**Date:** 2026-06-23

---

## Context

The Universal Storefront needs to authenticate end shoppers (account creation, login, password reset, order history). Both WooCommerce and Vendure already have full customer authentication systems. We must decide whether Ecom OS owns auth or delegates it.

## Decision

**Auth is delegated to the active engine.** The storefront does NOT operate its own user table.

- **WooCommerce engine:** auth via WooCommerce's customer accounts. The storefront forwards login/register/logout requests via the WC REST API and stores the resulting session token in an HTTP-only cookie.
- **Vendure engine:** auth via Vendure Shop API's native auth mutations. Session cookie used as Vendure expects.

The storefront's `useCustomer()` hook returns a normalized `Customer` type defined in `packages/ecom-engine`. No SDK leakage.

## Rationale

- **Engines already do this well.** Both WC and Vendure have years of hardening on auth. Reimplementing it is risk for zero gain.
- **Single source of truth per deployment.** Customer data lives in the engine's DB, where orders also live. No sync, no drift.
- **Required for the migration story.** A customer who started on WC and moves to Vendure (Karim's Story 4.1) gets their account because the engine moves with their data.

## Alternatives considered

- **Build our own auth (NextAuth.js / Better Auth backed by Postgres).** Rejected: forces a second user DB to sync with the engine. Doubles attack surface. Solves no actual v1 problem.
- **OAuth provider in front of both engines.** Rejected: complexity for zero v1 benefit. Reconsider if Ecom OS ever becomes multi-tenant SaaS (v2+).
- **Magic-link-only, custom-built.** Rejected: clients want classic email/password as an option; engines already provide it.

## Consequences

- **Easier:** Less code, less attack surface, faster to ship.
- **Harder:** Each adapter must implement the same auth verbs the storefront expects. Acceptable — that's the contract.
- **Hard constraint:** Session cookies are always set with `HttpOnly`, `Secure`, `SameSite=Lax`. Verified in security testing (Phase 6).
- **NFR alignment:** Meets NFR-031 (no secrets in bundle), NFR-034 (OWASP basics).
