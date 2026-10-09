# EcomOS execution log

Started 2026-10-09 from the owner handoff in `../00_START_HERE.md`.

## Baseline before source changes

- Repository: `Ecom-os`; HEAD `981347f41e820fd711e2c8dc0c3f6b217e37f910`, same as historical audit.
- Initial branch `main`; repair branch `fix/ecomos-phase-0`.
- Preexisting changes: dirty `plugins/wordpress-mcp` submodule, preserved.
- Node 24.19.0; pnpm 11.7.0; storefront Next 16.2.9 / React 19.2.4. PHP executable unavailable.
- Frozen install in progress. Initial lint/typecheck/test attempts triggered pnpm dependency reconciliation before running; these attempts were stopped to avoid concurrent installers. Build not yet verified. All four checks currently BLOCKED on completing installation.
- Active storefront is `apps/storefront`. Preserve the engine interface, Woo adapter, theme/brand and addon packages. `angelina-ui` is a separate design sandbox.
- Local storefront env has theme/encryption configuration only. No WooCommerce staging URLs or REST credentials configured. Historical development host `cms-ecom-os.local` returns ENOTFOUND on a read-only probe. Installed WP/Woo/plugin versions unknown.

## Revalidated findings and repair queue

| ID | Current evidence | Small repair slice / verification |
|---|---|---|
| ECO-001 | Baseline inspected; staging unavailable | Record environment and redacted evidence |
| ECO-002 | Broken addon relative imports/export guard, mismatched CI pnpm, invalid esbuild build policy | Restore deterministic tooling; run install/guard/lint/typecheck/test/build |
| ECO-003 | `engine-woocommerce/src/auth.ts` decodes unsigned/unverified JWT before privileged REST; server actions and account pages exposed | Remove unsafe identity implementation; disable account routes/actions and adapter account operations; forged/expired/unsigned/wrong-issuer fixtures |
| ECO-004 | CMI callback lacks approval checks; Stripe marks seen before updating; callbacks bypass configured provider list | Disable uncertified Stripe/CMI at registry/provider/callback/route boundaries; prove zero order updates |
| ECO-005 | `mappers.ts` destructively parses localized strings and hardcodes USD | Require raw canonical amounts and explicit currency; numeric/locale rejection fixtures |
| ECO-006 | REST checkout posts zero shipping; client cart is not authoritative; fake engine defaults and blank revalidation secret accepted | Disable unsafe legacy checkout/payment mutation; require production configuration; no fabricated order success |
| ECO-007 | Response-only CSP nonce; dependency audit required | Forward nonce/CSP into rendering, force dynamic pages, patch confirmed advisories |
| ECO-008 | Store API absent; staging settings absent; development host unresolved | Live product/cart/order proof BLOCKED; continue local contract tests |

## Scope and rollback

Phase 0 security containment first, then reproducibility and pricing. No production changes, external plugin installations, paid services or database migrations. Disabled customer accounts and unverified online payments remain unavailable until independent integration/security acceptance. Local changes can be reverted by commit. No customer data used in fixtures.

## External blockers

1. Accessible isolated WordPress staging plus local environment configuration required for real catalog/cart/COD proof.
2. WP/WooCommerce/GraphQL/plugin versions and installed API capabilities remain unverified.
3. PHP runtime needed for PHP checks.
4. Merchant sandbox gateway, shipping zones and tax configuration required before enabling checkout or online payment.

## First repair checkpoint

- ECO-001: DONE for local inspection; deployed backend verification BLOCKED.
- ECO-002: DONE for current workspace install, guard, lint, typecheck, unit tests and production build; clean second checkout not separately tested.
- ECO-003: DONE by disabling unsafe accounts; authentication addon not implemented.
- ECO-004: DONE by disabling uncertified online payment paths; gateways not certified.
- ECO-005: PARTIAL, canonical catalog parsing/currency and fixtures complete; variations/cart totals still incomplete.
- ECO-006: PARTIAL, unsafe checkout/shipping/payment mutations disabled and production configuration enforced; real guest checkout still absent.
- ECO-007: PARTIAL, nonce forwarding/dynamic build repaired, critical advisories removed; one high dev advisory unresolved, browser smoke blocked by automatic approval review.
- ECO-008: BLOCKED, isolated staging configuration absent.

`PHASE_0_REPORT.md` contains evidence, compatibility/rollback implications and remaining acceptance gates. No production-ready claim.

Owner confirmed they will create the isolated staging site. Credentials should be configured locally, not sent through chat.

Next: isolated staging configuration and a Store API guest cart/COD proof; keep accounts and online payments disabled.

## Local staging supplied, 2026-10-09

Owner supplied `paraloca.local`. WordPress REST is reachable and WP-CLI confirms WordPress 7.1.3 with no plugins. WooCommerce/GraphQL endpoints are absent. Local's PHP 8.2.29 runtime was found; all six project-owned PHP files pass syntax checks. Site database and configuration/content backups are complete outside the repository. Plugin setup approval is pending under the handoff's installation rule. Details and rollback proposal: `STAGING_SETUP.md`.

Owner approved the three proposed free plugins. WooCommerce 11.2.1, WPGraphQL 2.23.1 and commerce bridge 1.0.3 are active. Local HTTPS, server-only read-only connector and synthetic MAD fixtures are configured. Existing adapter catalog retrieval and backend Store API cart/guest COD smoke PASS. Order 15 totals 202.84 MAD with a variation, destination shipping and synthetic tax; independent CRUD confirms customer ID 0 and one order after sequential retry. Mailpit captured the local notification. ECO-008 now PARTIAL, backend strategy proved; frontend cart/checkout integration, browser proof and concurrent duplicate handling remain. Evidence: `store-api-smoke.json` and `STAGING_SETUP.md`.

## Handoff alignment check

The owner's 13 listed paths exist and contain nine distinct documents. Numbered integration/admin copies are identical to their canonical files; the canonical product vision, modular architecture, integration catalog and admin strategy match the references already read. The master prompt and phased plan govern execution, with current source/tests governing implementation claims.

Sequence clarification: finish or explicitly record remaining Phase 0 gates, then Phase 1 catalog contracts/mapping, pagination, filtering and variation identity (ECO-101 through ECO-105). Full storefront cart/checkout integration belongs to Phase 2. The backend COD smoke is Phase 0 integration evidence, not a completed Phase 2 feature. Preserve existing engine/theme/addon seams; ParaLoca remains a client profile and RFQ remains optional.
