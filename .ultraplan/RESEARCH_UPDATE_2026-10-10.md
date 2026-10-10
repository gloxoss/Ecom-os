# Current research appendix, 2026-10-10

Three read-only reviewers examined journal/evidence, contracts/catalog source and owner scope/primary documentation. Findings below are research constraints and proposed implementation choices, not newly certified local capabilities. Audit commit: `cb80332`; the concurrent uncommitted ECO-102 diff is excluded from accepted source claims.

## Existing repository and scope

All ten requested generic types exist. Acceptance as typed specification is distinct from runtime adapter invariants. Baseline catalog has swallowed errors, incomplete mapping and a first-20 limit; current dirty ECO-102 work implements portions but needs its own committed verification. Exact variation does not yet survive the entire browser cart/checkout path.

The current handoff chooses guest-first Woo, isolated client installations, optional accounts, separate RFQ and native/hybrid staff admin. Historical UltraPlan mandatory accounts, Vendure sprint, Angelina pilot and unsupported delivery/performance/payment promises are superseded. Existing source architecture and UI are retained.

## Primary-source constraints

**Headless session:** Woo returns Cart-Token in `/cart` response headers; it identifies the cart and can replace a nonce for cart/checkout. BFF-held tokens with isolated private sessions, secure cookies and an origin/CSRF policy are our proposed architecture, not a promise that Woo implements the whole BFF. [Woo Cart Tokens](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/).

**Nonce policy:** cart POST and checkout require valid Store API nonce unless Cart-Token is used. Never disable nonce validation globally to fix headless access. [Woo Nonce Tokens](https://developer.woocommerce.com/docs/apis/store-api/nonce-tokens/).

**Checkout truth/retries:** GET checkout can return/create a draft order. An ID alone is not confirmed purchase. Current documentation describes `expected_total` as a minor-unit string and a 409 mismatch with refreshed cart; verify support on installed Woo before adoption. No universal upstream Idempotency-Key guarantee was established, so durable BFF/backend concurrency and unknown-outcome recovery remain acceptance requirements. [Woo Checkout API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/checkout/).

**Exact line identity:** actual product/variation IDs and chosen attributes are used for adds; updates/removals use Woo line key. [Woo Cart Items API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/cart-items/).

**Private guest order access:** native order access requires an order key and guest billing email, not merely a numeric ID. A BFF grant additionally needs safe expiry/rate/privacy handling. [Woo Order API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/order/).

**Catalog alternatives:** Store product collection excludes variations by default and offers explicit variation queries. Existing GraphQL adapter is retained incrementally, with Store API only a capability-tested alternative behind the same contract. [Woo Products API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/products/).

**Full taxonomy:** Store category data includes parent/count/image and defaults hide_empty to true. A promised full tree must specify empty ancestors/categories and pagination behavior. [Woo Product Categories API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/product-categories/).

**Connections and RAW money:** WPGraphQL connections use first/after and pageInfo. Top-level pagination does not prove nested variation/category/gallery completeness. WooGraphQL examples use RAW prices and variation fields, but installed schema inspection is required. [WPGraphQL queries](https://www.wpgraphql.com/docs/graphql-queries), [WooGraphQL product data](https://woographql.com/fr/docs/wp-graphql-woocommerce/using-product-data).

**Native brands:** a native brands API exists; local taxonomy/schema support must be demonstrated and multiple-term cardinality cannot be silently discarded. [Woo Product Brands API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/product-brands/).

**Real CSP evidence:** nonce-based CSP requires dynamic page rendering. Ordinary ISR/PPR/shared HTML caching assumptions conflict with per-request nonce handling; public catalog data cache is a separate concern. Actual built-server HTML/hydration/browser evidence is required. [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy).

**Rate limits:** native checkout rate limiting is optional and its checkout setting is not a universal API/session protection policy. Assess configured installed behavior and BFF boundaries separately. [Woo Store API rate limiting](https://developer.woocommerce.com/docs/apis/store-api/rate-limiting/).

**HPOS:** companion order extensions and quote conversion must use Woo CRUD rather than direct post/postmeta writes, with supported HPOS/version tests. [Woo HPOS recipe book](https://developer.woocommerce.com/docs/features/orders/high-performance-order-storage/recipe-book/).

**Dependency risk:** the primary GHSA lists braces <=3.0.3 as affected and no patched version; a read-only registry result also reported latest 3.0.3. Do not invent a successful 3.0.4 override. Keep a dated exposure/mitigation/release decision rather than saying patched. [GitHub advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [npm registry](https://registry.npmjs.org/braces/latest).

## Proposed fixture/verification design

At least 100 mixed products, proposed 80 simple + 20 variable with two or more variations each, namespaced and reversible. Add stress fixtures above current fixed connection limits when full traversal is promised. Compare backend ground-truth ID sets, money, stock, galleries and taxonomy; include empty/removed/unavailable/upstream errors. Phase 2 separately proves actual browser guest sessions, rates/tax, confirmed orders, concurrency and uncertain outcome recovery. These are planned proofs, not already executed results.

Search choice, merchant policy, gateway certification, admin shell, mail delivery, RFQ backend/privacy, approved medical/legal content and production cutover remain scoped decisions. Existing guest-first, optional account, separate quote and independent client requirements need no repeated discovery approval.
