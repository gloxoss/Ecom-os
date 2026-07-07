# Security Guidelines

Ecom-os enforces strict security principles based on the SR-* laws.

## Implemented Mitigations

- **SR-HEAD-001**: Response headers (`Strict-Transport-Security`, `Content-Security-Policy`, etc.) are injected globally via `apps/storefront/src/middleware.ts`.
- **SR-LOG-001/002**: PII-redacting JSON structured logging runs via `apps/storefront/src/lib/logger.ts`. Sensitive fields (`email`, `card`, `password`, `token`) are recursively redacted from log output before reaching stdout.
- **SR-CRYPT-002**: AES-256-GCM encryption helper is available via `apps/storefront/src/lib/crypto.ts` for encrypting payment keys at rest.
- **SR-RATE-003**: In-memory rate limiting guards endpoints against brute force, including the `apps/storefront/src/app/api/revalidate/route.ts` Webhook.
- **Engine Security**: Imports from engine core packages to UI components are blocked by CI engine-import guards to maintain safe module boundaries.
