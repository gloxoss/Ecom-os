# EcomOS contract map

This is a design/review map, not generated API documentation. Existing exports in `packages/ecom-engine/src/types.ts`, `interface.ts`, and `addons.ts` govern callers today. Proposed operations below require a typed implementation, migration notes and contract tests before use.

## Cross-cutting contract rules

- Separate public query, guest-session command, verified guest-private query and staff command boundaries. Accepting an ID is not authorization.
- Validate input on the server; use explicit not-found, validation, unavailable, forbidden, conflict and upstream-failure outcomes. Do not catch errors into success-shaped empty arrays.
- Public projections contain only eligible product/content data. Private responses are not shared-cacheable. Secrets and backend cart tokens never enter browser DTOs or hub files.
- Canonical amounts carry explicit currency and safe integer minor units. Do not add floating-point money, locale-formatted strings or guessed currency to command payloads.
- Version breaking contract changes, identify affected callers and preserve useful adapters. Additive fields do not excuse inconsistent semantics.

## Catalog and money

**Current:** `Money { amount_minor: number; currency: string }`; `Product`, `ProductVariant`, `Category`; `listProducts(ProductListQuery)`, `getProduct(slug, locale?)`, `listCategories(locale?)`. Query supports category/search/limit/offset/price/sort at the interface, but the Woo adapter currently forwards only some price/category arguments and its GraphQL query takes first 20. `total` is returned-array length, not full match count. Mapper categories are empty; variation/gallery/stock/brand projection is incomplete. Fetch helpers swallow service errors. `parseRawMoney` already validates backend canonical decimals and currency precision.

**Required evolution:** exact product/parent/variation identity, SKU, product type, purchase eligibility, inventory/backorder semantics, attribute choices, gallery, taxonomy hierarchy, brand, public optional documents and explicit tax-display metadata. Model a product price range independently from variation `Money`. Optional technical/medical metadata must not become mandatory generic fields.

`listProducts` needs a tested pagination contract with real count/page/cursor metadata and query normalization. Decide one pagination strategy per provider and translate at the adapter. Price filter units must be explicit; existing `minPrice`/`maxPrice: number` do not establish whether they are minor units. Include locale/filter/sort in public cache keys. `getProduct` distinguishes genuine absence from upstream outage.

**Proof:** at least 100 mixed simple/variable fixture products; page beyond 20; combined category/brand/availability filters; deterministic sorting; exact variation/SKU; empty/deleted/malformed data; multiple currency precisions. Fixture generation must be isolated and reversible.

## Guest cart and checkout

**Current:** `getCart(cartId)`, `addToCart(cartId, AddToCartInput)`, `initCheckout`, `placeOrder` exist but Woo methods reject. `Cart` exposes items/subtotal/total without shipping/tax/discount breakdown. `CheckoutInput` has a single string address; `CheckoutSession` has only `PENDING | COMPLETED`. `Order` requires a `Customer` shape, and `OrderLine` lacks explicit variation identity. These types are insufficient for the target guest flow. The backend smoke script is a harness, not the storefront integration.

**Required evolution:** server-owned guest session context, normalized line/variation identity, update/remove, coupon apply/remove, destination update, shipping selection and canonical totals breakdown. Browser commands contain IDs/quantity/codes/validated destination, not authoritative prices. Require a no-token public session DTO and private server transport for Store API tokens.

Checkout takes validated billing/shipping/contact, selected eligible payment/rate, cart revision and attempt identity. Return typed confirmed, validation, conflict, recoverable-failure and unknown-outcome responses. Define retry/concurrency handling before enabling submission. A guest order must not require a customer account record; preserve variation SKU/attributes and authoritative status/breakdown.

`listShippingMethods(countryCode?)` currently rejects. Replace its insufficient country-only shape with destination/package-aware Woo rate quoting, not a zone-0 list. Legacy `applyCoupon(cartId, code, cartTotal)` cannot establish authoritative coupon calculation, and `removeCoupon` currently returns `true` without backend mutation. Do not advertise these as verified commerce operations.

**Proof:** independent guest isolation, missing/forged session rejection, exact variation lines, stock limits, ignored forged prices, coupon errors, address/rate changes, totals consistency, navigation persistence, sequential and concurrent retry cases, unknown-outcome recovery and real COD order confirmation. Guest ownership-safe order reads are a separate requirement.

## Payments and order access

**Current:** COD is the only eligible registry provider; Stripe/CMI initiation and callbacks are disabled. Woo `markOrderPaid` rejects and `getOrder` returns null. No safe guest tracking contract is implemented. Backend COD order 15 confirms only the recorded local Store API path and sequential retry behavior.

**Required:** provider capability/eligibility, initiation, verified event normalization, durable event claim/reconciliation and state update through Woo. Normalize provider environment, event/transaction/order identity, approval state, amount/currency and stable deduplication identity. Unsupported capability returns unavailable. Do not expose arbitrary payment-state commands to callers without authorization.

Introduce an ownership-scoped guest order query instead of passing arbitrary `customerId`. Choose verified grant/email/native mechanism, expiration, rate limits and privacy-safe errors. Staff order commands use staff context and operation-specific capabilities. Payment approval is distinct from COD acceptance and fulfillment.

**Proof:** signed declined event, wrong amount/currency/order/environment, replay, out-of-order event, concurrent delivery, crash/retry, disabled provider direct calls and invalid/cross-guest order grants. Real provider certification/sandbox evidence precedes enablement.

## Search and CMS

**Current:** no complete reusable `SearchProvider` or index synchronization is evidenced. Existing catalog fetch cannot substitute for real search. CMS bridge source exists, but optional PHP plugins have not been activated or permission-tested.

**Required search:** `suggest` and paginated `search` with query/filter/sort/locale/context (`store | quote`), safe result IDs, facets and metadata. Staff/internal-only health, incremental sync, deletion, reindex and reconciliation operations. Native Woo can be an explicit tested fallback; provider selection remains open.

**Required CMS/brands:** sanitized published content, locale-aware page/navigation/brand projections, draft/private preview authorization, media/document policy and source-derived SEO metadata. Native brand taxonomy support must be verified on the actual installed stack. Owned brand metadata changes presentation, not commerce identity.

**Proof:** exact SKU priority, French accents/controlled typos, facet intersection, distinct pages, update/delete propagation, measured latency/load profile; CMS edits visible without source edits and private drafts/documents inaccessible publicly. Never fabricate a latency/SLA target as a pass.

## Features, client configuration and administration

**Current:** `EcomAddon` has only `register(ctx)` and `disable()`; `StoreCapabilities` has a small legacy boolean shape. Woo capability fallback may advertise defaults when its endpoint is absent. These do not form the future secure manifest or prove optional backend availability.

**Required:** versioned manifest with ID/version/API compatibility/dependencies, schema/env requirements, server capabilities, UI/routes/admin slots, PHP module and migration/deactivation policy. Schema-validated `ClientProfile` separates safe presentation config from server secrets and integration URLs. Derive usable capabilities from explicit configuration, backend support and verification; reject unknown or incompatible optional features.

WP roles/capabilities must authorize actual read/write commands. `platform_admin`, `store_manager` and addon-only `sales_agent` are proposed responsibilities, not existing role guarantees. EcomOS Operations complements Woo admin; one evaluated admin shell is preferable to stacked competing plugins.

**Proof:** on/off route/API/admin/permission tests, missing dependency/config rejection, deactivation without core corruption, role-denial tests, two different client profiles using one commerce implementation. A generated addon list alone proves no backend off-state.

## RFQ/devis

**Current:** RFQ domain/service/backend lifecycle is not implemented or verified. No current core `Cart` type may be relabeled as an RFQ.

**Required:** separate `QuoteBasket`, exact `QuoteLine`, durable `RFQ`, immutable `OfferRevision`, append-only event history, scoped `QuoteAccessGrant` and optional linked order conversion. Operations: validated/idempotent submission, verified private read, staff review/offer, protected PDF/notification, current-revision accept/reject/request-revision, expiration and optional idempotent conversion through Woo CRUD.

The state guards in `BUSINESS_RULES.md` are target invariants. Decide plugin versus custom isolated backend only after full headless lifecycle proof. Contact, consent, retention and access-grant policies must be explicit. Preserve rejected/expired revision history; do not mutate old offers to look accepted.

**Proof:** at least three items from product-page and builder entry paths, exact variations, quantity changes, one guest submission after retries, authorized staff offer, verified guest response, stale/expired rejection, protected PDF, exactly one converted order, normal cart unchanged and addon-off denial everywhere.

## Change review checklist

Every contract task identifies current exported signatures, target delta, authority/auth boundary, affected consumers, backward compatibility, migration/rollback, unsupported outcomes and tests. Hub ownership locks coordinate files; they do not authorize application business transitions or production changes.
