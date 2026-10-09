# EcomOS business rules

These invariants are review requirements. Unless identified as implemented in `PROJECT_CONTEXT.md`, they describe required behavior, not an available runtime. Change a settled rule only through an explicit owner decision recorded in `DECISIONS.md`.

## Commercial authority

WooCommerce owns products, variation identity, SKU, purchasability, stock/backorders, prices, discounts, tax, shipping, orders and payment/order state. Next.js presents data and validated commands through the engine/server boundary. Search indexes, browser state, themes and the agent hub are projections or coordination tools.

Do not implement parallel inventory, tax or order ledgers. Use public Woo APIs/CRUD and HPOS-compatible integrations. Confirm the upstream result before presenting success. A backend error is neither an empty catalog nor a zero-price product.

## Catalog, identity and money

- Preserve stable backend product and variation IDs as strings in engine projections. SKU, slug and translated names are not substitutes for identity. A variable product requires an exact eligible variation before purchase or quote selection.
- Different variations of a parent must produce distinct cart/quote line identities. Preserve selected attributes and SKU in order/quote snapshots. Product deletion, price/stock changes and stale variations cause explicit refresh or rejection.
- Unsupported product types must show an honest unsupported/unavailable state. Do not route external/grouped/bundle/subscription products through a simple-product purchase contract without verified adapter support.
- Canonical `Money` is integer `amount_minor` plus explicit currency. Parse machine-readable backend decimals with currency precision and safe integer checks. Reject malformed/formatted/range amounts; never guess separators or strip text into a price.
- Format display values separately using locale and currency precision. Never divide every currency by 100. Never silently default to USD or force MAD in generic packages. All operands in a monetary calculation must share currency; conversion needs a separate verified contract.
- A variable product's price range is display metadata, not the amount for a selected variation. Tax inclusion/display policy must be explicit. Empty/missing price cannot imply free.
- Query filters, sort and pagination must reach the backend/search provider and be reflected in accurate metadata. Reset pagination when filters change. Real empty results, not-found and service failure are distinct outcomes.

## Guest cart and session

Buying is guest-first. Guest browser state may cache intent and optimistic UI; the Woo cart owns accepted lines and totals. Quantity is a validated integer subject to Woo purchase limits and stock rules. Price, discounts, tax and shipping submitted by a browser are untrusted.

Required session boundary: an opaque secure HTTP-only storefront session binds one guest to its backend cart. Store API tokens remain server-side and must not be shared between guests, logged or placed in URLs. Select and test SameSite, expiration, CSRF/origin checks and rotation against actual navigation/checkout behavior. HTTPS is mandatory outside explicitly isolated local development.

Add/update/remove/coupon/destination/rate changes return a refreshed backend snapshot. Mutations handle stale state and optimistic rollback. Two requests must not overwrite newer state silently. Private cart/order responses are `no-store`; public CDN or shared caches must not hold them.

Cart states for presentation: `uninitialized -> loading -> ready`; backend failure enters `error` with safe retry; expired session enters `expired` and requires an explicit replacement/recovery path. `ready` may contain zero items. These are projection states, not a replacement Woo session model.

Guest favorites may remain local product identifiers. Re-fetch current public details; stale favorite prices cannot affect checkout. Account synchronization is optional.

## Shipping, tax and checkout

Validate customer/contact/destination fields server-side with client country policy. Query Woo shipping packages/rates using the destination; preserve selected rate identity and recompute totals on address changes. No matching destination/rate yields an explicit unavailable/reselection state, never invented free shipping.

Woo applies coupon eligibility, fees, tax inclusion and rounding. Compare authoritative cart, checkout and order breakdowns in integration tests. Client rendering must explain shipping/tax availability and totals without calculating a separate final charge. Synthetic staging tax/shipping are never production defaults.

Required checkout attempt lifecycle:

1. `editing -> validating`: freeze the submitted cart identity/revision, contact/address and selected payment/rate into one validated attempt.
2. `validating -> submitting`: require an eligible nonempty cart and current Woo totals; scope a retry-safe attempt key to the guest/session and payload.
3. `submitting -> confirmed`: authoritative checkout response identifies one order; verify ownership-safe order projection before rendering confirmation.
4. Validation failure returns `editing` with actionable fields. Definitive backend failure enters `failed` with safe recovery. Timeout/connection loss enters `unknown`; reconcile the existing attempt before any new submission.
5. Replayed identical intent must not create another business action. Concurrent submissions require tested protection. Reusing the same key with a different payload is a conflict, not a fresh order.

These target states are not implemented by the current `CheckoutSession` union. Do not merely flip its `COMPLETED` flag. Do not clear the cart, show success, or mark payment complete based on a URL parameter, mock object or redirect alone.

COD order acceptance is not proof of payment received. The recorded local order is `processing`; preserve Woo status and the COD payment obligation. Do not invoke generic `markOrderPaid` to force success.

Guest order reads require an ownership grant, such as a verified short-lived opaque token or safe native/email verification. An order ID, sequential number or customer-supplied customer ID alone grants no access. Invalid, expired and cross-guest grants expose no PII or distinguishable private records.

## Payments and fulfillment

Expose only configured, server-eligible and verified gateways. Stripe/CMI remain unavailable until certification/integration checks pass. Environment flags or a PHP plugin's presence cannot bypass this gate.

Every provider update verifies authenticity, provider/environment, event/order/transaction identity, expected amount and currency, and successful approval state. A valid signature on a declined event is still declined. Browser redirects never authorize payment state mutation.

Required event lifecycle: `received -> authenticated -> processing -> applied`; malformed/untrusted events are rejected, unsuccessful approvals cannot pay an order, and recoverable processing errors remain retryable. A durable claim/deduplication mechanism must handle concurrency. Record completion only after the authoritative business update succeeds; reconcile crashes between update and completion recording.

Map transitions to Woo's supported order/payment lifecycle. Out-of-order or duplicate events must not resurrect cancelled/refunded orders or repeat fulfillment/refunds. Refunds require verified staff/provider authority and audited amounts; a paid flag does not grant refund permission.

## Identity, staff operations and addon gates

Customer Accounts remains off across routes, server actions, APIs, navigation and backend permissions. Never decode a JWT payload as authentication or use an unverified customer ID for privileged REST. Any future account adapter must verify signature, expiry, issuer/audience and record ownership before access.

Staff use WordPress authentication plus action-specific capabilities. Menu hiding is not authorization. Product/order/stock/content/quote changes enforce permissions at the write boundary; technical settings, secrets and plugins remain agency-admin responsibilities. Suggested role names are not implemented capabilities until verified.

EcomOS Operations reads the existing backend and performs authorized Woo/WordPress commands. It does not keep its own revenue, stock or order database. Installed optional PHP extensions require permission/privacy tests before activation.

An addon requires validated configuration, compatible versions, dependencies and backend capability. Off means no usable API, route, CTA, admin slot or residual permission. Deactivation must preserve core orders/catalog and apply a defined private-data retention policy. A public capability projection cannot authorize private operations.

## CMS, discovery and client boundaries

WordPress owns merchant-editable content. Sanitize rich content and validate media links. Preview/draft/private documents need authenticated access and private caching policy. Metadata, canonicals, structured data and sitemaps must reflect real published backend data.

One reusable public search contract serves `store` and optional `quote` contexts. Exact SKU/reference outranks fuzzy text; indexes include only eligible public fields. Updates/deletes, retries, full rebuild and reconciliation have measured behavior. Search never indexes customers, confidential offers or private documents.

Themes may change tokens, slots and presentation, not authoritative amounts, eligibility or permissions. Per-client locale, currency, contacts, country, gateways and features come from validated profile/backend config. Owned brands and third-party brands share one catalog, search and checkout. A second different client must pass the same core suite without core edits.

## RFQ is a separate addon

Quote selection has its own basket and endpoints. Product-page add-to-quote and `/devis` builder feed that basket, never overwrite the normal shopping cart. Exact product/variation/SKU and quantity are required; customer account creation is not.

Server submission validates items, contact/consent fields and idempotency, then creates a durable RFQ with immutable snapshots/events. Choose minimum contact and guest verification requirements in the implementation design; do not promise anonymous private tracking without a valid access mechanism.

Target transitions: `submitted -> under_review -> offered`. Only the current unexpired offer revision may become `accepted`, `rejected`, or `revision_requested`. A revision request returns to staff review and produces a new immutable offer. Expired offers cannot be accepted. Stale revisions cannot be accepted, and rejected/expired offers cannot convert. Server-side draft persistence is optional, not assumed.

Authorized staff prepare server-validated prices/tax/shipping and a protected PDF. Guest access verifies a scoped grant on each private read/response/download. Acceptance does not reserve stock unless explicitly configured. Conversion is optional: `accepted -> converted_to_order`, using Woo CRUD, revalidated commercial policy, a durable quote/order link and exactly-once business effect across retries.

Do not conflate quote acceptance, Woo order creation, payment approval and fulfillment. Notifications contain safe references and use a test sink in staging. Never include private PDFs or access grants in public search, caches or agent evidence.
