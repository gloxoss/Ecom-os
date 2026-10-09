# ECO-004: payment isolation and webhook containment report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `1800a11a137c2db86cd9d55999e11310693cfd68`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `packages/addons-multi-payment/src/registry.ts`, `packages/addons-multi-payment/src/providers/cmi/callback.ts`, `packages/addons-multi-payment/src/providers/cmi/provider.ts`, `packages/addons-multi-payment/src/providers/stripe/provider.ts`, `packages/addons-multi-payment/src/providers/stripe/webhook.ts`, `packages/addons-multi-payment/src/__tests__/stripe-webhook.test.ts`, `apps/storefront/src/app/api/webhooks/cmi/route.ts`, `apps/storefront/src/app/api/webhooks/stripe/route.ts`, `apps/storefront/src/app/[locale]/(checkout)/checkout/stripe/page.tsx`, `apps/storefront/src/app/[locale]/(checkout)/checkout/success/page.tsx`, `docs/ecomos/evidence/ECO-004`.
- Resources: `git-index`.
- Date: 2026-10-09.

## Verified containment

1. **Payment registry quarantine:**
   - In `packages/addons-multi-payment/src/registry.ts`, `registerGateway()` throws an explicit error for any gateway other than `cod`.
   - `getGateway()` returns `undefined` for any provider ID other than `cod`.
   - `getEnabledGateways()` filters out non-COD providers regardless of `PAYMENT_PROVIDERS` environment configuration.

2. **Webhook & callback rejection:**
   - Both `/api/webhooks/cmi` and `/api/webhooks/stripe` route handlers return 404 with `Cache-Control: no-store`.
   - `handleStripeWebhook()` returns status 503 and never invokes `engine.markOrderPaid()`.
   - `processCmiCallback()` returns `{ ok: false, reason: 'CMI is unavailable pending certified integration.' }` even for correctly signed parameters or replay attempts.

3. **No cosmetic success states:**
   - `/checkout/stripe` and `/checkout/success` invoke `notFound()` (404), preventing query-string or client-side manipulation from displaying fabricated success screens.
   - Core checkout displays an explicit unavailable notice until live WooCommerce Store API checkout integration is complete.
   - COD remains the only configured and tested payment path in local staging (order #15 verified in `store-api-smoke.json`).

## Executed checks

- `pnpm exec vitest run packages/addons-multi-payment/src/__tests__/stripe-webhook.test.ts` -> PASS (5/5 tests).
- `pnpm --filter @ecom-os/addons-multi-payment typecheck` -> PASS (exit 0).
- `pnpm --filter storefront typecheck` -> PASS (exit 0).
- `git diff --check` -> PASS (exit 0).
