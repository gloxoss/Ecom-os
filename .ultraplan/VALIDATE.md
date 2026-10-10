# Bidirectional plan validation, 2026-10-10

This is requirement coverage and structural validation of a reviewable draft, not application acceptance. All 58 current owner ECO work units plus the run-audit requirement are active. Historical discovery/requirements inconsistent with the current handoff are preserved and explicitly superseded, rather than treated as new owner approvals.

## Requirements to tasks

### REQ-AUDIT

Qualify completion claims and repair runtime/exact-SHA evidence provenance without falsifying historical acceptance.

Source: User run-audit request; AUDIT_2026-10-10.md. PRD: dated operative requirements. Planned coverage: 13-01, 13-02, 13-03, 13-04, 13-05, 13-06, 13-07, 13-08, 14-01, 14-02, 14-03. Status: covered in plan, implementation not implied.

### REQ-ECO-001

read `AGENTS.md` and inspect repository, current git status, env templates, installed Node/pnpm/Next, dependencies, scripts, plugin manifests, WordPress staging endpoints; establish actual versions and tests. Make a matrix for PASS/FAIL/BLOCKED, log only redacted evidence.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-001. PRD: dated operative requirements. Planned coverage: 13-01. Status: covered in plan, implementation not implied.

### REQ-ECO-002

repair package manager/workspace dependency links, install deterministically, fix code generation paths and export guards, restore lint, typecheck, unit test and production build commands. Avoid global installs/mutations unless justified.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-002. PRD: dated operative requirements. Planned coverage: 13-02. Status: covered in plan, implementation not implied.

### REQ-ECO-003

disable or repair unsafe customer JWT code. Guest checkout is core; account-feature routes disabled by default. Verify forged, expired, unsigned and wrong-issuer tokens cannot read/update orders/addresses through any privileged REST path.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-003. PRD: dated operative requirements. Planned coverage: 13-03. Status: covered in plan, implementation not implied.

### REQ-ECO-004

examine Stripe and CMI integrations, callbacks and webhook idempotency. Fix approval-state verification and durable processing or disable gateway with explicit capability. No false payment-success UI. COD staging can be first proven path.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-004. PRD: dated operative requirements. Planned coverage: 13-04. Status: covered in plan, implementation not implied.

### REQ-ECO-005

centralize authoritative price parsing and money types; distinguish currency, decimal values and minor units. Eliminate `parseFloat(formattedPrice)` and default USD; add large/decimal/French-locale tests.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-005. PRD: dated operative requirements. Planned coverage: 13-05. Status: covered in plan, implementation not implied.

### REQ-ECO-006

audit shipping/tax/cart session and correct immediate high-risk paths; fail closed for missing engine configuration, API URLs, webhook secrets and revalidation secrets in production. Stop production fake-engine fallback.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-006. PRD: dated operative requirements. Planned coverage: 13-06. Status: covered in plan, implementation not implied.

### REQ-ECO-007

repair CSP / rendering headers, secret leakage and private caching. Patch supported dependencies with advisory-based priorities; test actual production mode.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-007. PRD: dated operative requirements. Planned coverage: 13-07. Status: covered in plan, implementation not implied.

### REQ-ECO-008

verify WordPress WooCommerce/GraphQL/REST/Store API staging operations and run a minimal real product and Store API cart/checkout sandbox proof. If blocked, document exactly which permission/configuration/API capability is missing and stop any unprovable claims.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-008. PRD: dated operative requirements. Planned coverage: 13-08. Status: covered in plan, implementation not implied.

### REQ-ECO-101

specify typed `Product`, `Variation`, `Category`, `Brand`, `InventoryAvailability`, `Money`, `Media`, `TaxVisibility`, `TechnicalAttribute`, `Document` (optional extension) without ParaLoca vocabulary in core.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-101. PRD: dated operative requirements. Planned coverage: 14-01, 14-02, 14-03. Status: covered in plan, implementation not implied.

### REQ-ECO-102

fix WooCommerce adapter for real category tree, parent/variation resolution, SKU, images/gallery, pricing, stock, slugs, related items and pagination. Explicit errors rather than silently empty data.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-102. PRD: dated operative requirements. Planned coverage: 15-01, 15-02, 15-03, 15-04, 15-05, 15-06, 15-07. Status: covered in plan, implementation not implied.

### REQ-ECO-103

product-query contract supports search/category/brand, sorting, cursors or page numbers, per-page limits, locale-aware fields and visible stock status. Avoid N+1 calls; distinguish cacheable public catalog from private operations.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-103. PRD: dated operative requirements. Planned coverage: 16-01, 16-02, 16-03. Status: covered in plan, implementation not implied.

### REQ-ECO-104

create reusable data-driven PLP/PDP/category components; exact variations with accessible selection; optimistic UI only with rollback; accurate unavailable state.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-104. PRD: dated operative requirements. Planned coverage: 17-01, 17-02, 17-03, 17-04. Status: covered in plan, implementation not implied.

### REQ-ECO-105

use WooCommerce native `product_brand` if supported by verified installed version; vendor-independent EcomOS `Brand` projection with owned/third-party metadata OPTIONAL and not hardwired to platform branding.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-105. PRD: dated operative requirements. Planned coverage: 18-01, 18-02, 18-03. Status: covered in plan, implementation not implied.

### REQ-ECO-201

evaluate Store API Cart-Token/headless session behavior with real gateway compatibility; implement server-side BFF/adapter and secure session handling. No separate authoritative browser-only cart.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-201. PRD: dated operative requirements. Planned coverage: 19-01, 19-02, 19-03. Status: covered in plan, implementation not implied.

### REQ-ECO-202

add/update/remove variation-specific lines; persist guest session appropriately; revalidate price, stock, limits and coupon rules at WooCommerce.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-202. PRD: dated operative requirements. Planned coverage: 20-01, 20-02, 20-03, 20-04. Status: covered in plan, implementation not implied.

### REQ-ECO-203

collect validated customer details and addresses; model country-specific fields through client config; quote shipping using configured WooCommerce destination rules; compute taxes/totals from WooCommerce.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-203. PRD: dated operative requirements. Planned coverage: 21-01, 21-02, 21-03, 21-04. Status: covered in plan, implementation not implied.

### REQ-ECO-204

end-to-end COD test checkout, order creation, true server-confirmed success, transactional mail test sink, recoverable payment failures, duplicate-submit protection.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-204. PRD: dated operative requirements. Planned coverage: 22-01, 22-02, 22-03, 22-04. Status: covered in plan, implementation not implied.

### REQ-ECO-205

provider adapter contract, verified callbacks/webhooks, idempotency, event ledger/status synchronization. Add Stripe or Moroccan CMI only after a verified compatible staging flow; do not say integrated based only on available PHP plugin.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-205. PRD: dated operative requirements. Planned coverage: 23-01, 23-02, 23-03. Status: covered in plan, implementation not implied.

### REQ-ECO-206

guest order-status link must prove ownership, with opaque short-lived signed token/email challenge or native safe mechanism; avoid public enumeration and insecure query-parameter success checks.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-206. PRD: dated operative requirements. Planned coverage: 24-01, 24-02, 24-03. Status: covered in plan, implementation not implied.

### REQ-ECO-301

create `SearchProvider` abstraction with search, suggestions, filters/facets, index health, sync and fallback. Compare Meilisearch vs Typesense vs repaired native Woo search using real sample catalog; log maintenance/pricing and license decisions.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-301. PRD: dated operative requirements. Planned coverage: 25-01, 25-02, 25-03. Status: covered in plan, implementation not implied.

### REQ-ECO-302

normalized product/variation search projection: SKU exact-match priority (typo correction disabled for technical references), localized names, categories, brands, public prices, availability, safe attributes, slug and thumbnail. Never index private quote/customer data.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-302. PRD: dated operative requirements. Planned coverage: 26-01, 26-02, 26-03. Status: covered in plan, implementation not implied.

### REQ-ECO-303

index on product/variation/brand/stock changes, retry failed events, remove deleted docs, support full rebuild and periodic reconciliation. Avoid relying on slow fragile on-request indexing.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-303. PRD: dated operative requirements. Planned coverage: 27-01, 27-02, 27-03. Status: covered in plan, implementation not implied.

### REQ-ECO-304

header autocomplete, category/brand suggestions, keyboard listbox and mobile overlay; debounce and AbortController; robust empty/loading/error states; protect rate limits.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-304. PRD: dated operative requirements. Planned coverage: 28-01, 28-02, 28-03. Status: covered in plan, implementation not implied.

### REQ-ECO-305

multi-facet catalog filters, URL-sync, clear-all, pagination reset, sorting and accessibility. Share service with `/devis` when enabled.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-305. PRD: dated operative requirements. Planned coverage: 29-01, 29-02, 29-03. Status: covered in plan, implementation not implied.

### REQ-ECO-401

consolidate `packages/themes` + `packages/brand-config` precedence, CSS tokens, layout slots, variant selection, locale, currency, contact info and content templates. Detect missing critical config at build/deploy.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-401. PRD: dated operative requirements. Planned coverage: 30-01, 30-02, 30-03. Status: covered in plan, implementation not implied.

### REQ-ECO-402

create `ClientProfile` manifest and schema validation; capability flags, shipping/payment methods, industry metadata, environment URLs separated from code.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-402. PRD: dated operative requirements. Planned coverage: 31-01, 31-02, 31-03. Status: covered in plan, implementation not implied.

### REQ-ECO-403

WordPress-managed hero, banners, navigation, page sections, brand stories, product documents (if addon), articles, SEO metadata. No giant hardcoded marketing JSON in production.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-403. PRD: dated operative requirements. Planned coverage: 32-01, 32-02, 32-03. Status: covered in plan, implementation not implied.

### REQ-ECO-404

reusable product/category/PDP/cart/checkout semantic UI templates, accessible images, loading/empty/error states, mobile navigation and reduced motion.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-404. PRD: dated operative requirements. Planned coverage: 33-01, 33-02, 33-03. Status: covered in plan, implementation not implied.

### REQ-ECO-405

canonical URLs, sitemap, robots, product/category structured data, correct indexing policy for facets/search, language/RTL framework if enabled.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-405. PRD: dated operative requirements. Planned coverage: 34-01, 34-02, 34-03. Status: covered in plan, implementation not implied.

### REQ-ECO-406

create a SECOND neutral example client with significantly different styling/catalog fixture to prove EcomOS is not ParaLoca-bound.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-406. PRD: dated operative requirements. Planned coverage: 35-01, 35-02, 35-03. Status: covered in plan, implementation not implied.

### REQ-ECO-501

map client operator roles and daily jobs (orders, products, inventory, promotions, content, quotes only if addon on). Enforce capabilities server-side.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-501. PRD: dated operative requirements. Planned coverage: 36-01, 36-02, 36-03. Status: covered in plan, implementation not implied.

### REQ-ECO-502

evaluate WordPress admin enhancement plugins on staging: e.g. White Label CMS or WP Adminify/uiXpress. Check licensing, Woo compatibility, HPOS, mobile, keyboard, updates and conflict footprint. Do NOT stack competing admin-shell plugins.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-502. PRD: dated operative requirements. Planned coverage: 37-01, 37-02, 37-03. Status: covered in plan, implementation not implied.

### REQ-ECO-503

implement simple EcomOS Operations WP admin landing (overview, order queue, low-stock alerts, nav shortcuts, addon slots), using WP authentication and Woo CRUD; avoid second merchant backend and duplicate reporting databases.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-503. PRD: dated operative requirements. Planned coverage: 38-01, 38-02, 38-03. Status: covered in plan, implementation not implied.

### REQ-ECO-504

publish merchant task runbook, QA sample workflows and permissions tests; restrict technical plugins/settings to platform operators.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-504. PRD: dated operative requirements. Planned coverage: 39-01, 39-02, 39-03. Status: covered in plan, implementation not implied.

### REQ-ECO-601

addon manifest (`id`, `version`, compatible API ranges, dependencies, capability requirements, config/schema, routes, UI slots, admin slots, PHP module, migrations, tests).

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-601. PRD: dated operative requirements. Planned coverage: 40-01, 40-02, 40-03. Status: covered in plan, implementation not implied.

### REQ-ECO-602

secure server-side feature registry and shared typed capability projection to Next.js. Disabled services return 404/403 as designed, not functioning because only UI was hidden.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-602. PRD: dated operative requirements. Planned coverage: 41-01, 41-02, 41-03. Status: covered in plan, implementation not implied.

### REQ-ECO-603

addon installation/migration/deactivation lifecycle, idempotency and rollback, missing-addon handling. Separate billing/paid license from EcomOS capability toggles.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-603. PRD: dated operative requirements. Planned coverage: 42-01, 42-02, 42-03. Status: covered in plan, implementation not implied.

### REQ-ECO-604

exemplar simple addon and contract tests verifying both disabled and enabled states, addon failure isolation and versioning.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-604. PRD: dated operative requirements. Planned coverage: 43-01, 43-02, 43-03. Status: covered in plan, implementation not implied.

### REQ-ECO-701

define RFQ state machine and permission model; guest submit/contact verification vs staff roles; compliance/privacy and consent fields configurable per client.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-701. PRD: dated operative requirements. Planned coverage: 44-01, 44-02, 44-03. Status: covered in plan, implementation not implied.

### REQ-ECO-702

separate `QuoteBasket` with exact product + variation IDs and quantities; `add to quote` secondary action and dedicated `/devis` builder with shared catalog search, category list, filters, sticky selection summary/mobile sheet.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-702. PRD: dated operative requirements. Planned coverage: 45-01, 45-02, 45-03. Status: covered in plan, implementation not implied.

### REQ-ECO-703

customer review step, quantity edit, optional notes, contact/company fields, validated submit and idempotency; never require B2C customer account.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-703. PRD: dated operative requirements. Planned coverage: 46-01, 46-02, 46-03. Status: covered in plan, implementation not implied.

### REQ-ECO-704

custom WordPress plugin with versioned REST API and durable persistence, snapshots and immutable offer revisions; guard transitions. Evaluate reputable mature quotation plugin as shortcut but demand headless API test. Do not assume a shortcode plugin meets requirements.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-704. PRD: dated operative requirements. Planned coverage: 47-01, 47-02, 47-03, 47-04. Status: covered in plan, implementation not implied.

### REQ-ECO-705

staff offer creation, line pricing/taxes from server, PDF with private authenticated/verified download, transactional emails, accept/reject/revise and expiration.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-705. PRD: dated operative requirements. Planned coverage: 48-01, 48-02, 48-03, 48-04. Status: covered in plan, implementation not implied.

### REQ-ECO-706

optional idempotent conversion accepted quote into WooCommerce order with audit references. Check price, payment, tax and shipping integrity; quote acceptance is not automatic reservation unless configured.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-706. PRD: dated operative requirements. Planned coverage: 49-01, 49-02, 49-03. Status: covered in plan, implementation not implied.

### REQ-ECO-707

add-on off-state removes route/menu/CTA and API privileges. Quote module never overwrites normal cart.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-707. PRD: dated operative requirements. Planned coverage: 50-01, 50-02, 50-03. Status: covered in plan, implementation not implied.

### REQ-ECO-801

create `clients/paraloca/` (or configuration convention consistent with repo). Brand spelling: **ParaLoca**, domain `paraloca.ma`. French + MAD + Moroccan addresses/delivery + appropriate payment gateway pending merchant verification.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-801. PRD: dated operative requirements. Planned coverage: 51-01, 51-02, 51-03. Status: covered in plan, implementation not implied.

### REQ-ECO-802

implement the approved light, minimal medical-lifestyle visual direction from `references/PARALOCA_DESIGN_REFERENCE.md`. Existing ParaLoca mockups are inspiration, not proof of backend functionality.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-802. PRD: dated operative requirements. Planned coverage: 52-01, 52-02, 52-03. Status: covered in plan, implementation not implied.

### REQ-ECO-803

build homepage, catalog categories, product PDP, brands pages, cart, guest checkout, favorites, product guide/info pages. No obligatory customer-account interface.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-803. PRD: dated operative requirements. Planned coverage: 53-01, 53-02, 53-03, 53-04. Status: covered in plan, implementation not implied.

### REQ-ECO-804

owned-brand classification lives inside the *single WooCommerce B2C catalog*: brand taxonomy term metadata, special brand landing/story panels, optional warranty/docs; same cart/checkout/search for third-party and private-label products.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-804. PRD: dated operative requirements. Planned coverage: 54-01, 54-02, 54-03. Status: covered in plan, implementation not implied.

### REQ-ECO-805

activate RFQ addon for ParaLoca; professional link and `/devis` builder must be discreet in B2C, not intrusive.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-805. PRD: dated operative requirements. Planned coverage: 55-01, 55-02, 55-03. Status: covered in plan, implementation not implied.

### REQ-ECO-806

verify real medical equipment content, claims, warranty, importer/legal disclosures with client. Do not invent certifications, compliance, device registration, distributor rights or stock levels.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-806. PRD: dated operative requirements. Planned coverage: 56-01, 56-02, 56-03. Status: covered in plan, implementation not implied.

### REQ-ECO-807

stage and UAT all French mobile and desktop experiences; keep the independent Coming Soon page until authorized cutover.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-807. PRD: dated operative requirements. Planned coverage: 57-01, 57-02, 57-03. Status: covered in plan, implementation not implied.

### REQ-ECO-901

stable CI build/typecheck/test/lint, E2E buyer+merchant and RFQ addon, security regression suite, performance budgets and accessibility.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-901. PRD: dated operative requirements. Planned coverage: 58-01, 58-02, 58-03. Status: covered in plan, implementation not implied.

### REQ-ECO-902

WordPress/PHP unit/integration tests, backend version matrix, Store API changes, HPOS compatibility, plugin updater compatibility.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-902. PRD: dated operative requirements. Planned coverage: 59-01, 59-02, 59-03. Status: covered in plan, implementation not implied.

### REQ-ECO-903

provisioning CLI/checklist, environment contract, migrations, version locking, backups and tested restore, monitoring, transaction error alerts, health probes and rollback.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-903. PRD: dated operative requirements. Planned coverage: 60-01, 60-02, 60-03, 60-04. Status: covered in plan, implementation not implied.

### REQ-ECO-904

initialize `Demo Client 2` with different theme and disabled RFQ/accounts. Same buying E2E must pass without source duplication.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-904. PRD: dated operative requirements. Planned coverage: 61-01, 61-02, 61-03. Status: covered in plan, implementation not implied.

### REQ-ECO-905

documentation for installing plugin integrations, changing providers and implementing additional addons; complete change log and compatibility table.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-905. PRD: dated operative requirements. Planned coverage: 62-01, 62-02, 62-03. Status: covered in plan, implementation not implied.

### REQ-ECO-906

verify user-approved production domain and payment certification. Never perform launch without explicit operator approval.

Source: ../02_PHASED_EXECUTION_PLAN.md, ECO-906. PRD: dated operative requirements. Planned coverage: 63-01, 63-02, 63-03. Status: covered in plan, implementation not implied.

## Tasks to requirements

### [13. Rescue evidence reconciliation](sections/section-13-rescue-evidence-reconciliation.md)

- 13-01: Recheck ECO-001 scoped baseline evidence → REQ-ECO-001, REQ-AUDIT; 0 files; checkpoint; dependencies none.
- 13-02: Recheck ECO-002 scoped baseline evidence → REQ-ECO-002, REQ-AUDIT; 0 files; checkpoint; dependencies 13-01.
- 13-03: Recheck ECO-003 scoped baseline evidence → REQ-ECO-003, REQ-AUDIT; 0 files; checkpoint; dependencies 13-02.
- 13-04: Recheck ECO-004 scoped baseline evidence → REQ-ECO-004, REQ-AUDIT; 0 files; checkpoint; dependencies 13-03.
- 13-05: Recheck ECO-005 scoped baseline evidence → REQ-ECO-005, REQ-AUDIT; 0 files; checkpoint; dependencies 13-04.
- 13-06: Recheck ECO-006 scoped baseline evidence → REQ-ECO-006, REQ-AUDIT; 0 files; checkpoint; dependencies 13-05.
- 13-07: Recheck ECO-007 scoped baseline evidence → REQ-ECO-007, REQ-AUDIT; 0 files; checkpoint; dependencies 13-06.
- 13-08: Recheck ECO-008 scoped baseline evidence → REQ-ECO-008, REQ-AUDIT; 0 files; checkpoint; dependencies 13-07.

### [14. Domain contract follow-up](sections/section-14-domain-contract-follow-up.md)

- 14-01: Specify canonical catalog alias rules → REQ-ECO-101, REQ-AUDIT; 2 files; auto; dependencies 13-08.
- 14-02: Replace vacuous neutrality coverage checks → REQ-ECO-101, REQ-AUDIT; 2 files; auto; dependencies 14-01.
- 14-03: Verify scoped integrated acceptance evidence → REQ-ECO-101, REQ-AUDIT; 0 files; checkpoint; dependencies 14-02.

### [15. Authoritative catalog mapping](sections/section-15-authoritative-catalog-mapping.md)

- 15-01: Prove installed catalog schema support → REQ-ECO-102; 2 files; auto; dependencies 13-08, 14-03.
- 15-02: Propagate explicit catalog transport failures → REQ-ECO-102; 3 files; auto; dependencies 15-01.
- 15-03: Complete paginated taxonomy and relationships → REQ-ECO-102; 3 files; auto; dependencies 15-02.
- 15-04: Map complete purchasable variation identity → REQ-ECO-102; 3 files; auto; dependencies 15-03.
- 15-05: Project canonical money and media → REQ-ECO-102; 3 files; auto; dependencies 15-04.
- 15-06: Verify reversible mixed catalog fixtures → REQ-ECO-102; 3 files; auto; dependencies 15-05.
- 15-07: Verify scoped integrated acceptance evidence → REQ-ECO-102; 0 files; checkpoint; dependencies 15-06.

### [16. Product queries and public caching](sections/section-16-product-queries-and-public-caching.md)

- 16-01: Define truthful catalog query metadata → REQ-ECO-103; 3 files; auto; dependencies 13-08, 14-03, 15-07.
- 16-02: Connect catalog filtering and pagination → REQ-ECO-103; 3 files; auto; dependencies 16-01.
- 16-03: Verify scoped integrated acceptance evidence → REQ-ECO-103; 0 files; checkpoint; dependencies 16-02.

### [17. Reusable catalog shopping components](sections/section-17-reusable-catalog-shopping-components.md)

- 17-01: Preserve exact accessible variation intent → REQ-ECO-104; 3 files; auto; dependencies 13-08, 14-03, 15-07, 16-03, 18-03.
- 17-02: Connect variation selection to product pages → REQ-ECO-104; 3 files; auto; dependencies 17-01.
- 17-03: Render data driven catalog states → REQ-ECO-104; 3 files; auto; dependencies 17-02.
- 17-04: Verify scoped integrated acceptance evidence → REQ-ECO-104; 0 files; checkpoint; dependencies 17-03.

### [18. Native brand capability projection](sections/section-18-native-brand-capability-projection.md)

- 18-01: Project verified native brand data → REQ-ECO-105; 3 files; auto; dependencies 13-08, 14-03, 15-07.
- 18-02: Expose brands through engine contracts → REQ-ECO-105; 3 files; auto; dependencies 18-01.
- 18-03: Verify scoped integrated acceptance evidence → REQ-ECO-105; 0 files; checkpoint; dependencies 18-02.

### [19. Secure Woo guest sessions](sections/section-19-secure-woo-guest-sessions.md)

- 19-01: Prove isolated Store API sessions → REQ-ECO-201; 3 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03.
- 19-02: Introduce browser cart session boundary → REQ-ECO-201; 3 files; auto; dependencies 19-01.
- 19-03: Verify scoped integrated acceptance evidence → REQ-ECO-201; 0 files; checkpoint; dependencies 19-02.

### [20. Authoritative variation aware cart](sections/section-20-authoritative-variation-aware-cart.md)

- 20-01: Implement Woo cart line operations → REQ-ECO-202; 3 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 19-03.
- 20-02: Connect authoritative cart mutation route → REQ-ECO-202; 3 files; auto; dependencies 20-01.
- 20-03: Reconcile cart display and rollback → REQ-ECO-202; 3 files; auto; dependencies 20-02.
- 20-04: Verify scoped integrated acceptance evidence → REQ-ECO-202; 0 files; checkpoint; dependencies 20-03.

### [21. Guest addresses shipping and tax](sections/section-21-guest-addresses-shipping-and-tax.md)

- 21-01: Quote destination totals through Woo → REQ-ECO-203; 2 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 20-04.
- 21-02: Validate configured guest address fields → REQ-ECO-203; 3 files; auto; dependencies 21-01.
- 21-03: Render canonical checkout quotation states → REQ-ECO-203; 3 files; auto; dependencies 21-02.
- 21-04: Verify scoped integrated acceptance evidence → REQ-ECO-203; 0 files; checkpoint; dependencies 21-03.

### [22. Real duplicate safe COD purchase](sections/section-22-real-duplicate-safe-cod-purchase.md)

- 22-01: Persist checkout attempt and recovery → REQ-ECO-204; 3 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 21-04.
- 22-02: Implement confirmed COD submission boundary → REQ-ECO-204; 3 files; auto; dependencies 22-01.
- 22-03: Connect confirmed guest order receipt → REQ-ECO-204; 3 files; auto; dependencies 22-02.
- 22-04: Verify scoped integrated acceptance evidence → REQ-ECO-204; 0 files; checkpoint; dependencies 22-03.

### [23. Certified optional payment providers](sections/section-23-certified-optional-payment-providers.md)

- 23-01: Specify payment certification evidence contract → REQ-ECO-205; 3 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 22-04.
- 23-02: Certify COD or selected payment capability → REQ-ECO-205; 3 files; auto; dependencies 23-01.
- 23-03: Verify scoped integrated acceptance evidence → REQ-ECO-205; 0 files; checkpoint; dependencies 23-02.

### [24. Owned guest order status access](sections/section-24-owned-guest-order-status-access.md)

- 24-01: Define private guest order access grants → REQ-ECO-206; 2 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 22-04.
- 24-02: Expose protected order confirmation status → REQ-ECO-206; 3 files; auto; dependencies 24-01.
- 24-03: Verify scoped integrated acceptance evidence → REQ-ECO-206; 0 files; checkpoint; dependencies 24-02.

### [25. Shared search provider selection](sections/section-25-shared-search-provider-selection.md)

- 25-01: Specify reusable public search contract → REQ-ECO-301; 2 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03.
- 25-02: Compare representative search providers → REQ-ECO-301; 2 files; auto; dependencies 25-01.
- 25-03: Verify scoped integrated acceptance evidence → REQ-ECO-301; 0 files; checkpoint; dependencies 25-02.

### [26. Safe product search projection](sections/section-26-safe-product-search-projection.md)

- 26-01: Normalize public search document identity → REQ-ECO-302; 2 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 25-03.
- 26-02: Rank exact technical SKU queries → REQ-ECO-302; 2 files; auto; dependencies 26-01.
- 26-03: Verify scoped integrated acceptance evidence → REQ-ECO-302; 0 files; checkpoint; dependencies 26-02.

### [27. Reliable search synchronization lifecycle](sections/section-27-reliable-search-synchronization-lifecycle.md)

- 27-01: Persist catalog change synchronization events → REQ-ECO-303; 3 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 26-03.
- 27-02: Reconcile rebuild and retry indexing → REQ-ECO-303; 3 files; auto; dependencies 27-01.
- 27-03: Verify scoped integrated acceptance evidence → REQ-ECO-303; 0 files; checkpoint; dependencies 27-02.

### [28. Accessible shared search suggestions](sections/section-28-accessible-shared-search-suggestions.md)

- 28-01: Implement cancellable shared suggestion hook → REQ-ECO-304; 2 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 26-03, 27-03.
- 28-02: Render keyboard and mobile suggestions → REQ-ECO-304; 3 files; auto; dependencies 28-01.
- 28-03: Verify scoped integrated acceptance evidence → REQ-ECO-304; 0 files; checkpoint; dependencies 28-02.

### [29. URL synchronized discovery facets](sections/section-29-url-synchronized-discovery-facets.md)

- 29-01: Normalize catalog URL filter state → REQ-ECO-305; 2 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 28-03.
- 29-02: Connect accessible facet controls → REQ-ECO-305; 3 files; auto; dependencies 29-01.
- 29-03: Verify scoped integrated acceptance evidence → REQ-ECO-305; 0 files; checkpoint; dependencies 29-02.

### [30. Theme and configuration precedence](sections/section-30-theme-and-configuration-precedence.md)

- 30-01: Resolve reusable theme token precedence → REQ-ECO-401; 3 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 19-03, 20-04, 21-04, 22-04, 23-03, 24-03, 25-03, 26-03, 27-03, 28-03, 29-03.
- 30-02: Connect configuration to storefront layout → REQ-ECO-401; 3 files; auto; dependencies 30-01.
- 30-03: Verify scoped integrated acceptance evidence → REQ-ECO-401; 0 files; checkpoint; dependencies 30-02.

### [31. Validated client capability manifest](sections/section-31-validated-client-capability-manifest.md)

- 31-01: Validate independent client profile manifests → REQ-ECO-402; 2 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 19-03, 20-04, 21-04, 22-04, 23-03, 24-03, 25-03, 26-03, 27-03, 28-03, 29-03, 30-03.
- 31-02: Load profiles at application boundary → REQ-ECO-402; 3 files; auto; dependencies 31-01.
- 31-03: Verify scoped integrated acceptance evidence → REQ-ECO-402; 0 files; checkpoint; dependencies 31-02.

### [32. Merchant managed WordPress content](sections/section-32-merchant-managed-wordpress-content.md)

- 32-01: Expose safe structured WordPress content → REQ-ECO-403; 3 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 19-03, 20-04, 21-04, 22-04, 23-03, 24-03, 25-03, 26-03, 27-03, 28-03, 29-03, 31-03.
- 32-02: Render CMS content with safe fallbacks → REQ-ECO-403; 3 files; auto; dependencies 32-01.
- 32-03: Verify scoped integrated acceptance evidence → REQ-ECO-403; 0 files; checkpoint; dependencies 32-02.

### [33. Reusable accessible shopping templates](sections/section-33-reusable-accessible-shopping-templates.md)

- 33-01: Audit shared template accessibility states → REQ-ECO-404; 3 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 19-03, 20-04, 21-04, 22-04, 23-03, 24-03, 25-03, 26-03, 27-03, 28-03, 29-03, 31-03.
- 33-02: Harden cart checkout mobile interaction → REQ-ECO-404; 3 files; auto; dependencies 33-01.
- 33-03: Verify scoped integrated acceptance evidence → REQ-ECO-404; 0 files; checkpoint; dependencies 33-02.

### [34. Correct public SEO and locale policy](sections/section-34-correct-public-seo-and-locale-policy.md)

- 34-01: Define canonical indexing and sitemap rules → REQ-ECO-405; 3 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 19-03, 20-04, 21-04, 22-04, 23-03, 24-03, 25-03, 26-03, 27-03, 28-03, 29-03, 32-03, 33-03.
- 34-02: Render locale aware structured catalog metadata → REQ-ECO-405; 3 files; auto; dependencies 34-01.
- 34-03: Verify scoped integrated acceptance evidence → REQ-ECO-405; 0 files; checkpoint; dependencies 34-02.

### [35. Contrasting neutral client theme proof](sections/section-35-contrasting-neutral-client-theme-proof.md)

- 35-01: Create contrasting neutral client profile → REQ-ECO-406; 3 files; auto; dependencies 14-03, 15-07, 16-03, 17-04, 18-03, 19-03, 20-04, 21-04, 22-04, 23-03, 24-03, 25-03, 26-03, 27-03, 28-03, 29-03, 34-03.
- 35-02: Compare common commerce across themes → REQ-ECO-406; 2 files; auto; dependencies 35-01.
- 35-03: Verify scoped integrated acceptance evidence → REQ-ECO-406; 0 files; checkpoint; dependencies 35-02.

### [36. Server enforced merchant role matrix](sections/section-36-server-enforced-merchant-role-matrix.md)

- 36-01: Specify merchant role and job matrix → REQ-ECO-501; 2 files; auto; dependencies 30-03, 31-03, 32-03, 33-03, 34-03, 35-03.
- 36-02: Prove staff permissions against real workflows → REQ-ECO-501; 2 files; auto; dependencies 36-01.
- 36-03: Verify scoped integrated acceptance evidence → REQ-ECO-501; 0 files; checkpoint; dependencies 36-02.

### [37. Single admin shell evaluation](sections/section-37-single-admin-shell-evaluation.md)

- 37-01: Compare native and enhanced admin options → REQ-ECO-502; 2 files; auto; dependencies 30-03, 31-03, 32-03, 33-03, 34-03, 35-03, 36-03.
- 37-02: Verify selected admin shell rollback → REQ-ECO-502; 2 files; auto; dependencies 37-01.
- 37-03: Verify scoped integrated acceptance evidence → REQ-ECO-502; 0 files; checkpoint; dependencies 37-02.

### [38. Small native operations landing](sections/section-38-small-native-operations-landing.md)

- 38-01: Implement capability scoped WP operations landing → REQ-ECO-503; 3 files; auto; dependencies 30-03, 31-03, 32-03, 33-03, 34-03, 35-03, 36-03, 37-03.
- 38-02: Verify operations landing usability → REQ-ECO-503; 2 files; auto; dependencies 38-01.
- 38-03: Verify scoped integrated acceptance evidence → REQ-ECO-503; 0 files; checkpoint; dependencies 38-02.

### [39. Merchant workflow handover evidence](sections/section-39-merchant-workflow-handover-evidence.md)

- 39-01: Publish scoped merchant task runbook → REQ-ECO-504; 2 files; auto; dependencies 30-03, 31-03, 32-03, 33-03, 34-03, 35-03, 38-03.
- 39-02: Record merchant acceptance and permission failures → REQ-ECO-504; 2 files; auto; dependencies 39-01.
- 39-03: Verify scoped integrated acceptance evidence → REQ-ECO-504; 0 files; checkpoint; dependencies 39-02.

### [40. Versioned addon compatibility manifests](sections/section-40-versioned-addon-compatibility-manifests.md)

- 40-01: Define typed addon manifest schema → REQ-ECO-601; 3 files; auto; dependencies 19-03, 20-04, 21-04, 22-04, 23-03, 24-03.
- 40-02: Validate manifests during addon generation → REQ-ECO-601; 3 files; auto; dependencies 40-01.
- 40-03: Verify scoped integrated acceptance evidence → REQ-ECO-601; 0 files; checkpoint; dependencies 40-02.

### [41. Authoritative addon off state registry](sections/section-41-authoritative-addon-off-state-registry.md)

- 41-01: Implement secure server capability registry → REQ-ECO-602; 3 files; auto; dependencies 19-03, 20-04, 21-04, 22-04, 23-03, 24-03, 40-03.
- 41-02: Guard addon routes and UI projection → REQ-ECO-602; 3 files; auto; dependencies 41-01.
- 41-03: Verify scoped integrated acceptance evidence → REQ-ECO-602; 0 files; checkpoint; dependencies 41-02.

### [42. Reversible addon lifecycle migrations](sections/section-42-reversible-addon-lifecycle-migrations.md)

- 42-01: Implement idempotent addon migration lifecycle → REQ-ECO-603; 3 files; auto; dependencies 19-03, 20-04, 21-04, 22-04, 23-03, 24-03, 41-03.
- 42-02: Document tested lifecycle restore procedure → REQ-ECO-603; 2 files; auto; dependencies 42-01.
- 42-03: Verify scoped integrated acceptance evidence → REQ-ECO-603; 0 files; checkpoint; dependencies 42-02.

### [43. Enabled disabled exemplar addon proof](sections/section-43-enabled-disabled-exemplar-addon-proof.md)

- 43-01: Implement manifest driven exemplar addon → REQ-ECO-604; 3 files; auto; dependencies 19-03, 20-04, 21-04, 22-04, 23-03, 24-03, 42-03.
- 43-02: Test exemplar failure and off state → REQ-ECO-604; 2 files; auto; dependencies 43-01.
- 43-03: Verify scoped integrated acceptance evidence → REQ-ECO-604; 0 files; checkpoint; dependencies 43-02.

### [44. Guest RFQ permission state machine](sections/section-44-guest-rfq-permission-state-machine.md)

- 44-01: Define guest quote transitions and permissions → REQ-ECO-701; 2 files; auto; dependencies 25-03, 26-03, 27-03, 28-03, 29-03, 40-03, 41-03, 42-03, 43-03.
- 44-02: Specify quote policy and privacy contract → REQ-ECO-701; 3 files; auto; dependencies 44-01.
- 44-03: Verify scoped integrated acceptance evidence → REQ-ECO-701; 0 files; checkpoint; dependencies 44-02.

### [45. Separate variation aware quote basket](sections/section-45-separate-variation-aware-quote-basket.md)

- 45-01: Implement independent exact quote selection → REQ-ECO-702; 3 files; auto; dependencies 25-03, 26-03, 27-03, 28-03, 29-03, 40-03, 41-03, 42-03, 43-03, 44-03.
- 45-02: Render enabled responsive quote builder → REQ-ECO-702; 3 files; auto; dependencies 45-01.
- 45-03: Verify scoped integrated acceptance evidence → REQ-ECO-702; 0 files; checkpoint; dependencies 45-02.

### [46. Validated duplicate safe guest RFQ submit](sections/section-46-validated-duplicate-safe-guest-rfq-submit.md)

- 46-01: Validate quote contact and review intent → REQ-ECO-703; 3 files; auto; dependencies 25-03, 26-03, 27-03, 28-03, 29-03, 40-03, 41-03, 42-03, 43-03, 45-03, 47-04.
- 46-02: Expose owned idempotent guest submit boundary → REQ-ECO-703; 3 files; auto; dependencies 46-01.
- 46-03: Verify scoped integrated acceptance evidence → REQ-ECO-703; 0 files; checkpoint; dependencies 46-02.

### [47. Durable versioned WordPress RFQ backend](sections/section-47-durable-versioned-wordpress-rfq-backend.md)

- 47-01: Choose verified quote backend strategy → REQ-ECO-704; 2 files; auto; dependencies 25-03, 26-03, 27-03, 28-03, 29-03, 40-03, 41-03, 42-03, 43-03, 44-03.
- 47-02: Persist immutable quote revisions safely → REQ-ECO-704; 3 files; auto; dependencies 47-01.
- 47-03: Expose versioned authorized RFQ endpoints → REQ-ECO-704; 3 files; auto; dependencies 47-02.
- 47-04: Verify scoped integrated acceptance evidence → REQ-ECO-704; 0 files; checkpoint; dependencies 47-03.

### [48. Private revisioned quote offers](sections/section-48-private-revisioned-quote-offers.md)

- 48-01: Create capability guarded staff offer revisions → REQ-ECO-705; 3 files; auto; dependencies 25-03, 26-03, 27-03, 28-03, 29-03, 40-03, 41-03, 42-03, 43-03, 46-03.
- 48-02: Protect offer PDF and notification delivery → REQ-ECO-705; 3 files; auto; dependencies 48-01.
- 48-03: Render guest offer review response → REQ-ECO-705; 3 files; auto; dependencies 48-02.
- 48-04: Verify scoped integrated acceptance evidence → REQ-ECO-705; 0 files; checkpoint; dependencies 48-03.

### [49. Optional quote to Woo order conversion](sections/section-49-optional-quote-to-woo-order-conversion.md)

- 49-01: Convert accepted quote through Woo CRUD → REQ-ECO-706; 2 files; auto; dependencies 25-03, 26-03, 27-03, 28-03, 29-03, 40-03, 41-03, 42-03, 43-03, 48-04.
- 49-02: Record conversion recovery and policy proof → REQ-ECO-706; 2 files; auto; dependencies 49-01.
- 49-03: Verify scoped integrated acceptance evidence → REQ-ECO-706; 0 files; checkpoint; dependencies 49-02.

### [50. Complete RFQ disabled state isolation](sections/section-50-complete-rfq-disabled-state-isolation.md)

- 50-01: Close disabled quote routes and side effects → REQ-ECO-707; 3 files; auto; dependencies 25-03, 26-03, 27-03, 28-03, 29-03, 40-03, 41-03, 42-03, 43-03, 45-03, 46-03, 47-04, 48-04, 49-03.
- 50-02: Verify buy and quote isolation matrix → REQ-ECO-707; 2 files; auto; dependencies 50-01.
- 50-03: Verify scoped integrated acceptance evidence → REQ-ECO-707; 0 files; checkpoint; dependencies 50-02.

### [51. French Moroccan ParaLoca profile](sections/section-51-french-moroccan-paraloca-profile.md)

- 51-01: Create validated ParaLoca client manifest → REQ-ECO-801; 3 files; auto; dependencies 30-03, 31-03, 32-03, 33-03, 34-03, 35-03, 36-03, 37-03, 38-03, 39-03, 44-03, 45-03, 46-03, 47-04, 48-04, 49-03, 50-03.
- 51-02: Connect ParaLoca profile theme selection → REQ-ECO-801; 3 files; auto; dependencies 51-01.
- 51-03: Verify scoped integrated acceptance evidence → REQ-ECO-801; 0 files; checkpoint; dependencies 51-02.

### [52. Approved ParaLoca visual direction](sections/section-52-approved-paraloca-visual-direction.md)

- 52-01: Implement approved client visual tokens → REQ-ECO-802; 2 files; auto; dependencies 30-03, 31-03, 32-03, 33-03, 34-03, 35-03, 36-03, 37-03, 38-03, 39-03, 44-03, 45-03, 46-03, 47-04, 48-04, 49-03, 50-03, 51-03.
- 52-02: Review reusable client presentation slots → REQ-ECO-802; 3 files; auto; dependencies 52-01.
- 52-03: Verify scoped integrated acceptance evidence → REQ-ECO-802; 0 files; checkpoint; dependencies 52-02.

### [53. Complete ParaLoca storefront navigation](sections/section-53-complete-paraloca-storefront-navigation.md)

- 53-01: Compose ParaLoca homepage and brand pages → REQ-ECO-803; 3 files; auto; dependencies 30-03, 31-03, 32-03, 33-03, 34-03, 35-03, 36-03, 37-03, 38-03, 39-03, 44-03, 45-03, 46-03, 47-04, 48-04, 49-03, 50-03, 52-03.
- 53-02: Connect optional local favorites behavior → REQ-ECO-803; 3 files; auto; dependencies 53-01.
- 53-03: Verify ParaLoca buy navigation continuity → REQ-ECO-803; 2 files; auto; dependencies 53-02.
- 53-04: Verify scoped integrated acceptance evidence → REQ-ECO-803; 0 files; checkpoint; dependencies 53-03.

### [54. Owned brands in one catalog](sections/section-54-owned-brands-in-one-catalog.md)

- 54-01: Store optional owned brand story metadata → REQ-ECO-804; 3 files; auto; dependencies 30-03, 31-03, 32-03, 33-03, 34-03, 35-03, 36-03, 37-03, 38-03, 39-03, 44-03, 45-03, 46-03, 47-04, 48-04, 49-03, 50-03, 53-04, 18-03.
- 54-02: Render owned brand content in shared shopping → REQ-ECO-804; 3 files; auto; dependencies 54-01.
- 54-03: Verify scoped integrated acceptance evidence → REQ-ECO-804; 0 files; checkpoint; dependencies 54-02.

### [55. Discreet ParaLoca quote addon activation](sections/section-55-discreet-paraloca-quote-addon-activation.md)

- 55-01: Configure approved ParaLoca RFQ capability → REQ-ECO-805; 3 files; auto; dependencies 30-03, 31-03, 32-03, 33-03, 34-03, 35-03, 36-03, 37-03, 38-03, 39-03, 44-03, 45-03, 46-03, 47-04, 48-04, 49-03, 50-03, 51-03.
- 55-02: Verify discreet professional quote entry → REQ-ECO-805; 3 files; auto; dependencies 55-01.
- 55-03: Verify scoped integrated acceptance evidence → REQ-ECO-805; 0 files; checkpoint; dependencies 55-02.

### [56. Approved truthful client product content](sections/section-56-approved-truthful-client-product-content.md)

- 56-01: Inventory unapproved medical and legal claims → REQ-ECO-806; 2 files; auto; dependencies 30-03, 31-03, 32-03, 33-03, 34-03, 35-03, 36-03, 37-03, 38-03, 39-03, 44-03, 45-03, 46-03, 47-04, 48-04, 49-03, 50-03, 51-03.
- 56-02: Record approved content publication review → REQ-ECO-806; 2 files; auto; dependencies 56-01.
- 56-03: Verify scoped integrated acceptance evidence → REQ-ECO-806; 0 files; checkpoint; dependencies 56-02.

### [57. French client staging acceptance](sections/section-57-french-client-staging-acceptance.md)

- 57-01: Execute mobile desktop French client UAT → REQ-ECO-807; 2 files; auto; dependencies 30-03, 31-03, 32-03, 33-03, 34-03, 35-03, 36-03, 37-03, 38-03, 39-03, 44-03, 45-03, 46-03, 47-04, 48-04, 49-03, 50-03, 53-04, 54-03, 55-03, 56-03.
- 57-02: Prepare reviewable client cutover packet → REQ-ECO-807; 2 files; auto; dependencies 57-01.
- 57-03: Verify scoped integrated acceptance evidence → REQ-ECO-807; 0 files; checkpoint; dependencies 57-02.

### [58. Cross profile release regression gates](sections/section-58-cross-profile-release-regression-gates.md)

- 58-01: Wire repeatable core and addon CI checks → REQ-ECO-901; 3 files; auto; dependencies 51-03, 52-03, 53-04, 54-03, 55-03, 56-03, 57-03.
- 58-02: Measure accessible performant release journeys → REQ-ECO-901; 3 files; auto; dependencies 58-01.
- 58-03: Verify scoped integrated acceptance evidence → REQ-ECO-901; 0 files; checkpoint; dependencies 58-02.

### [59. Woo PHP version and HPOS compatibility](sections/section-59-woo-php-version-and-hpos-compatibility.md)

- 59-01: Create backend compatibility test matrix → REQ-ECO-902; 3 files; auto; dependencies 51-03, 52-03, 53-04, 54-03, 55-03, 56-03, 57-03.
- 59-02: Verify safe plugin and Store API upgrades → REQ-ECO-902; 2 files; auto; dependencies 59-01.
- 59-03: Verify scoped integrated acceptance evidence → REQ-ECO-902; 0 files; checkpoint; dependencies 59-02.

### [60. Provisioning restore monitoring operations](sections/section-60-provisioning-restore-monitoring-operations.md)

- 60-01: Validate independent client provisioning contract → REQ-ECO-903; 3 files; auto; dependencies 51-03, 52-03, 53-04, 54-03, 55-03, 56-03, 57-03.
- 60-02: Exercise backup restore and release rollback → REQ-ECO-903; 3 files; auto; dependencies 60-01.
- 60-03: Implement scoped transaction health alerts → REQ-ECO-903; 3 files; auto; dependencies 60-02.
- 60-04: Verify scoped integrated acceptance evidence → REQ-ECO-903; 0 files; checkpoint; dependencies 60-03.

### [61. Independent second client purchase proof](sections/section-61-independent-second-client-purchase-proof.md)

- 61-01: Provision independent contrasting demo client → REQ-ECO-904; 2 files; auto; dependencies 51-03, 52-03, 53-04, 54-03, 55-03, 56-03, 57-03, 35-03, 58-03, 59-03, 60-04.
- 61-02: Run unchanged commerce suite across clients → REQ-ECO-904; 2 files; auto; dependencies 61-01.
- 61-03: Verify scoped integrated acceptance evidence → REQ-ECO-904; 0 files; checkpoint; dependencies 61-02.

### [62. Provider addon installation documentation](sections/section-62-provider-addon-installation-documentation.md)

- 62-01: Publish tested installation and extension guidance → REQ-ECO-905; 3 files; auto; dependencies 51-03, 52-03, 53-04, 54-03, 55-03, 56-03, 57-03, 61-03.
- 62-02: Publish release change and risk ledger → REQ-ECO-905; 2 files; auto; dependencies 62-01.
- 62-03: Verify scoped integrated acceptance evidence → REQ-ECO-905; 0 files; checkpoint; dependencies 62-02.

### [63. Explicit production launch authorization](sections/section-63-explicit-production-launch-authorization.md)

- 63-01: Prepare certified production release evidence → REQ-ECO-906; 2 files; auto; dependencies 51-03, 52-03, 53-04, 54-03, 55-03, 56-03, 57-03, 58-03, 59-03, 60-04, 61-03, 62-03.
- 63-02: Request concrete scoped launch approval → REQ-ECO-906; 1 files; auto; dependencies 63-01.
- 63-03: Verify scoped integrated acceptance evidence → REQ-ECO-906; 0 files; checkpoint; dependencies 63-02.

## Excluded historical scope and open choices

Mandatory customer accounts, Vendure sprint, Angelina pilot, unconditional Stripe/CMI, invented 30-day cart/deadline/performance commitments and a duplicate merchant backend have no active requirement authorization. Current code may retain contained legacy modules; this plan does not require deleting them wholesale. Conditional provider/admin/RFQ strategies map to their existing owner ECO units and decision gates D-01..D-08, not unsolicited new features.

## Structural checks

Run `node .ultraplan/scripts/validate.mjs` for exact task/XML agreement, requirement coverage both ways, unique IDs, dependency DAG, original-unit completeness, 1–3-file bounds, section granularity, preserved phase configuration and artifact existence. A passing validator cannot certify runtime behavior, owner approval, staging or deployment.

## Executed draft checks

At 12:11 UTC, structural validator PASS: 51 sections, 170 XML/manifest tasks, 58 original ECO units, 59 requirements, acyclic dependencies, file bounds and exact phase graph. A separate read-only reviewer independently parsed all 170 XML task blocks with PowerShell, PASS. Optional-provider and blocked-runtime dependency findings were corrected and the validator rerun. This does not imply owner approval or application certification.
