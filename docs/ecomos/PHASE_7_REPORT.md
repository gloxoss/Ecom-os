# Phase 7 Checkpoint: Quotes / RFQ Addon Architecture, 2026-10-10

**Status: COMPLETED (Phase 7 Exit Gate Ready). All 7 Phase 7 engineering tasks (`ECO-701` through `ECO-707`) independently verified and accepted on the canonical agent hub (`.agent-hub`). The complete RFQ (Request for Quote / Devis) lifecycle is operational, headless, secure, and isolated: state machine, variation-aware quote basket, duplicate-safe submission, durable WordPress custom tables, server-priced offer revisions, safe quotation documents, transactional notifications, idempotent WooCommerce HPOS order conversion, and complete off-state isolation.**

Baseline: `a0fe97489e99ccb8171bd961bb71223587eeac06` (Phase 6 Gate Commit). Work is on `fix/ecomos-phase-0`. Preexisting dirty `plugins/wordpress-mcp` submodule was strictly preserved.

---

## 1. Phase 7 Task Summary

| Task | Title | Executor | Verifier | Submission SHA | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ECO-701` | RFQ state machine, actor permissions, immutable revisions, and privacy policy | `commerce-cleanup` | `cleanup-verifier` | `3c801844b20067cbff8e3e4a9e5db4d1a525fbe6` | `ACCEPTED` |
| `ECO-702` | Separate variation-aware QuoteBasket domain model and cart isolation | `runtime-cleanup` | `cleanup-verifier` | `8ac33a5f6e80b62b1b3fb12948c2691fa6dbba39` | `ACCEPTED` |
| `ECO-703` | Validated duplicate-safe guest RFQ submission with route guard | `commerce-cleanup` | `cleanup-verifier` | `300b63b2cf212ebddbf42750e39578652ae2c7f5` | `ACCEPTED` |
| `ECO-704` | Durable versioned WordPress RFQ companion plugin (`wp-ecomos-rfq`) | `tooling-cleanup` | `cleanup-verifier` | `226c5ac10de2677eaaf7ccf3be6cec28f977e8ff` | `ACCEPTED` |
| `ECO-705` | Private revisioned quote offers, server pricing, documents, notifications, guest review | `commerce-cleanup` | `cleanup-verifier` | `07e7dfdcbfd00ed92a9d131522448076f52191fd` | `ACCEPTED` |
| `ECO-706` | Optional idempotent conversion of accepted quotes into WooCommerce HPOS orders | `commerce-cleanup` | `cleanup-verifier` | `6389deec4e07736bfe1998c55aa0580dcaa4f42b` | `ACCEPTED` |
| `ECO-707` | Complete RFQ disabled off-state isolation and cart independence | `tooling-cleanup` | `cleanup-verifier` | `7045f63683e04108d5ff8e1fb35db0f3570cbcb5` | `ACCEPTED` |

---

## 2. Key Technical Accomplishments

### ECO-701: RFQ State Machine & Actor Roles
- Defined strict formal state machine for RFQ lifecycle: `draft` $\rightarrow$ `submitted` $\rightarrow$ `verified` $\rightarrow$ `offer_created` $\rightarrow$ `revised` $\rightarrow$ `accepted` $\rightarrow$ `converted` (with terminal states `rejected` and `expired`).
- Enforced four distinct actor roles: `guest`, `operator`, `administrator`, and `system`.
- Prohibited out-of-order state transitions via typed error classes (`IllegalTransitionError`, `UnauthorizedActorError`, `StaleRevisionError`, `ExpiredQuoteError`).
- Authored privacy and data retention policy (`packages/addons-rfq/src/policy.ts`) supporting consent hashing and anonymization.
- Verified in `packages/addons-rfq/src/state-machine.test.ts` (8 tests) and `policy.test.ts` (7 tests).

### ECO-702: Variation-Aware Quote Basket & Cart Isolation
- Engineered dedicated `QuoteBasket` domain model in `packages/addons-rfq/src/basket.ts` keyed deterministically by `${productId}:${variationId}`.
- Handled simple and variable products without cross-collision.
- Connected accessible `/devis` builder UI in `apps/storefront/src/features/rfq/ui/quote-builder.tsx` and Zustand store `apps/storefront/src/features/rfq/model/quote-store.ts` (`quote-storage`).
- Established complete domain isolation between quotation requests and standard WooCommerce purchase carts (`quote-storage` vs `cart-storage`).
- Verified in `packages/addons-rfq/src/basket.test.ts` (8 tests) and `apps/storefront/e2e/quote-builder.spec.ts` (4 tests).

### ECO-703: Customer Review Step & Duplicate-Safe Submission
- Built customer review UI step `apps/storefront/src/features/rfq/ui/quote-review.tsx` with contact form, B2B tax/ICE capture, consent checkboxes, and summary tables.
- Implemented Zod schema validation (`submit-schema.ts`) and headless client API (`client.ts`).
- Created route-guarded endpoint `POST /api/rfq` enforcing idempotency via cryptographic cache, preventing duplicate submissions on network retries.
- Minted cryptographically secure HMAC access tokens, returning `quoteNumber` and `accessSecret` while preserving hashed secrets in storage.
- Verified in `packages/addons-rfq/src/submit-schema.test.ts` (6 tests).

### ECO-704: Durable WordPress RFQ Companion Plugin
- Built `wp-ecomos-rfq` plugin with dedicated database tables: `wp_ecomos_rfq_quotes` and `wp_ecomos_rfq_revisions`.
- Implemented durable repository (`repository.php`) supporting atomic revision deactivation (`is_current = 0`) and creation (`is_current = 1`).
- Avoided WordPress user account creation by authenticating guests via constant-time SHA-256 HMAC comparisons (`hash_equals`).
- Exposed versioned REST API routes under `/wp-json/ecomos/v1/rfq/` with capability callbacks.
- Enforced data retention by default on plugin deactivation (`ecomos_rfq_uninstall_schema(false)`).
- Documented in `docs/ecomos/rfq/BACKEND_DECISION.md` and verified in `plugins/wp-ecomos-rfq/tests/` (5 tests).

### ECO-705: Private Revisioned Offers & Safe Quotation Documents
- Created server-pricing engine (`plugins/wp-ecomos-rfq/offers.php` and `packages/addons-rfq/src/offer.ts`) computing line totals and taxes with deterministic two-decimal precision.
- Built safe HTML/print quotation document generator (`documents.php`) strictly escaping all user inputs (`htmlspecialchars`, `ENT_QUOTES`) to prevent XSS/injection.
- Implemented deduplicated transactional email notification dispatcher (`notifications.php`) with test mail sink.
- Created accessible guest offer review UI (`offer-review.tsx`) and Next.js route `/api/rfq/offers` supporting accept, decline, and revision requests.
- Guarded against stale revisions (HTTP 409 `STALE_REVISION`) and expired offers (HTTP 410 `QUOTE_EXPIRED`).
- Displayed honest stock reservation policy disclaimer in all customer views.
- Verified in `plugins/wp-ecomos-rfq/tests/offers.spec.mjs`, `documents.spec.mjs`, `notifications.spec.mjs`, and `apps/storefront/e2e/quote-offer.spec.ts` (8 tests).

### ECO-706: Idempotent WooCommerce Order Conversion
- Built conversion engine (`plugins/wp-ecomos-rfq/conversion.php`) transforming accepted quotes into native WooCommerce HPOS orders.
- Enforced strict acceptance gate: unaccepted quotes cannot transition to converted.
- Guaranteed idempotency: duplicate or replayed conversion calls return the existing order reference with `isDuplicate: true`, preventing double order creation.
- Stored bidirectional cross-audit metadata on the WooCommerce order (`_ecomos_rfq_quote_id`, `_ecomos_rfq_quote_number`, `_ecomos_rfq_revision_id`, `_ecomos_conversion_timestamp`) and linked `converted_order_id` in the quote table.
- Enforced honest stock policy: default policy does not reserve inventory; stock reduction occurs only when authorized by merchant policy.
- Verified in `plugins/wp-ecomos-rfq/tests/conversion.spec.mjs` and `apps/storefront/e2e/quote-conversion.spec.ts` (5 tests).

### ECO-707: Complete RFQ Disabled State Isolation
- Established complete off-state isolation when the `quotes` addon is disabled in the authoritative registry.
- Blocked all storefront routes (`/devis`, `/quotes/*`) with HTTP 404 `ADDON_DISABLED`.
- Scrubbed `quotes` and `quote_builder` from public capability projections.
- Blocked all headless REST endpoints with HTTP 404 `addon_disabled`.
- Suppressed background emails and order conversions during off-state.
- Proved total cart independence: standard guest cart and checkout function identically whether RFQ is enabled or disabled; quote items never mutate standard shopping carts.
- Verified in `plugins/wp-ecomos-rfq/tests/off-state.spec.mjs` and `apps/storefront/e2e/rfq-off.spec.ts` (4 tests).

---

## 3. Core Architectural Invariants Preserved

1. **Zero Customer Account Requirement**: Guest RFQ submitters are authenticated exclusively via cryptographically secure HMAC access secrets (`accessSecretHash`), preventing forced `wp_users` creation.
2. **Zero Automatic Stock Reservation**: By default (`stockReservation = 'none'`), neither RFQ submission nor offer acceptance reserves stock; inventory is reserved only upon explicit merchant confirmation or order payment.
3. **Dual Cart Isolation**: `QuoteBasket` and standard purchasing cart operate in completely disjoint domains (`quote-storage` vs `cart-storage`), preventing cross-mutation.
4. **Immutable Revisions**: Historical offer revisions remain frozen in `wp_ecomos_rfq_revisions`; customer attempts to accept superseded revisions throw HTTP 409 `StaleRevisionError`.
5. **HPOS & Core Table Protection**: The RFQ addon uses dedicated custom tables and native HPOS CRUD APIs, never altering or corrupting core WooCommerce tables (`wp_posts`, `wp_postmeta`, `wp_wc_orders`).
6. **Disabled Off-State Barrier**: When disabled, all routes return HTTP 404, background jobs suppress side effects, and capabilities are scrubbed from public projections.

---

## 4. Verification & Gate Checks

| Verification Check | Target / Command | Result |
| :--- | :--- | :--- |
| **Addon RFQ Unit Suites** | `npx vitest run packages/addons-rfq` | `PASS` (5 test suites, 33 tests in 398ms) |
| **WordPress Plugin Suites** | `node --test plugins/wp-ecomos-rfq/tests/*.spec.mjs` | `PASS` (11 tests in 249ms across 6 files) |
| **Storefront Contract Suites** | `npx tsx --test apps/storefront/e2e/quote-*.spec.ts apps/storefront/e2e/rfq-off.spec.ts` | `PASS` (21 tests in 453ms across 4 suites) |
| **Storefront TypeScript Compilation** | `npx tsc -p apps/storefront/tsconfig.json --noEmit` | `PASS` (0 errors) |
| **Addon TypeScript Compilation** | `npx tsc -p packages/addons-rfq/tsconfig.json --noEmit` | `PASS` (0 errors) |
