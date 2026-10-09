# EcomOS phased roadmap and gates

Authoritative task IDs and acceptance: [owner plan](../../../02_PHASED_EXECUTION_PLAN.md) and [reporting contract](../../../04_REPORTING_AND_ACCEPTANCE.md). This hub decomposes those tasks; it cannot replace acceptance with document creation or successful lint.

## Current position

Phase 0 is PARTIAL at the recorded `6541de1` checkpoint. Security containment/local checks and backend COD integration proof are recorded; frontend checkout, browser checks, concurrent retry protection and other open evidence remain. Full Phase 2 checkout must not be mistaken for the Phase 0 backend smoke.

Next implementation focus is finishing/reconciling Phase 0 gates, then Phase 1 catalog contracts, real pagination/filtering and variation identity. Maintain safe disabled behavior while those features are incomplete.

## Dependency order

```text
0 -> 1 -> 2
     1 -> 3
     2 + 3 -> 4 -> 5
     2 -> 6; 6 + 3 -> 7
     4 + 7 -> 8
     5 + 8 -> 9
```

Independent agents may research/test future contracts or implement explicitly approved, isolated support work. They cannot claim a dependent feature finished or enable it before its gates. An enabled exploitable P0 blocks feature expansion; safe disabling can close that exposure while keeping feature readiness incomplete.

## Phase acceptance summaries

### Phase 0: rescue and integration proof, ECO-001 through ECO-008

Revalidate repo/environment; deterministic install/check/build; close unsafe identity/payment paths; canonical money; fail-closed production config; CSP/dependency review; live staging capability/product/cart/COD proof. No known exploitable customer/payment path may remain enabled. Record remaining blockers, mitigation and owner acknowledgment where required. Browser/runtime proof and second clean workspace evidence are not implied by a build.

### Phase 1: catalog and domain contracts, ECO-101 through ECO-105

Typed neutral product/variation/category/brand/stock/media/money contracts; actual Woo mapping and query semantics. Required sample: 100+ mixed simple/variable fixtures, pagination beyond first 20, correct combined filters, exact SKU/variation, gallery/currency and empty/removed products. Verify native brands support before adopting it. Do not hardcode ParaLoca or medical fields into core.

### Phase 2: guest purchase, ECO-201 through ECO-206

Secure backend-backed guest session, exact cart mutations/coupons, validated contact/destination, Woo shipping/tax totals, genuine COD checkout/confirmation and ownership-safe tracking. Two products including a variation, legitimate rate and no customer account. Sequential and concurrent duplicates, recoverable failures and unknown outcomes require evidence. Online providers stay disabled until independent integration/certification succeeds.

### Phase 3: discovery, ECO-301 through ECO-305

Shared search contract/provider with public projection; SKU priority, French accents/typos, combined facets, URL state and nonrepeating pagination; mobile/keyboard suggestions. Update/delete sync, retries and rebuild pass. Agree and measure freshness/latency under a repeatable load profile; no invented performance passes.

### Phase 4: themes, content and SEO, ECO-401 through ECO-406

Validated client config and token/slot precedence; merchant-editable WordPress content; reusable accessible pages; actual metadata/canonical/schema/sitemap. A significantly different neutral client changes presentation/locale/features without altering Woo business services. Both profiles pass the same core buying suite.

### Phase 5: merchant operations, ECO-501 through ECO-504

Real WP-authenticated, capability-scoped product/stock/order/content workflows and a small Operations landing. Evaluate one coherent admin enhancement with compatibility/license/headless/HPOS evidence. Manager tasks pass; denied roles cannot change settings/payment secrets. Disabled addon has no admin/API access.

### Phase 6: addon contracts, ECO-601 through ECO-604

Versioned schema/manifests, dependencies, server registry and safe client projection. Installation/migration/deactivation has documented retention/rollback. Simple exemplar passes enabled/disabled route/UI/API/admin/capability tests and failure isolation without corrupting core commerce or forcing accounts.

### Phase 7: optional RFQ, ECO-701 through ECO-707

Separate basket, shared public search, durable guest RFQ and immutable staff offers. At least three items from both entry paths; quantity edits; one request on retry; protected access/PDF; safe responses; older/expired revisions rejected; optional order conversion once. Off-state denies frontend/backend/admin paths. RFQ acceptance does not complete core checkout.

### Phase 8: ParaLoca profile, ECO-801 through ECO-807

French/MAD/Morocco settings in the profile; approved theme; one B2C catalog with owned-brand stories and generic purchase/search; discreet RFQ entry. Verify medical/legal claims and content with the owner. French mobile/desktop UAT with real test records. Coming Soon/domain cutover stays separately owner-approved.

### Phase 9: cross-client release, ECO-901 through ECO-906

CI and buyer/merchant/addon E2E, security/accessibility/performance evidence, actual PHP/backend version and HPOS matrix, provisioning/environment/migration/monitoring runbooks and rehearsed backup restore/rollback. Second client has quotes/accounts OFF and passes the same buying suite without core duplication. Production launch/provider certification requires recorded owner approval.

## Gate recording rules

Use `DONE`, `PARTIAL` or `BLOCKED` for work outcomes and `PASS`, `FAIL` or `BLOCKED` for individual checks. A gate passes only with relevant implementation and representative evidence at a recorded commit/environment. The coordinator records the decision; an independent verifier checks the evidence. A task board status cannot manufacture a passed phase.

Each accepted slice records requirement/task IDs, base and tested commit, owned files, command/status, sanitized fixture/environment references, negative tests, migration/privacy impact, remaining risks and next task. Do not combine mock/unit, live backend, browser and production evidence into one undifferentiated pass. Sequential retry is not concurrent retry proof; PHP syntax is not deployed permission proof.

Report Core, addon maturity and ParaLoca readiness separately. Do not copy old percentages or create a completion score without a defined denominator and fresh evidence. Preserve historical reports and append corrections; never rewrite a failed check into a pass.

## Parallel work that preserves the gates

Suitable early lanes: catalog contract design/mapping; negative security regression; browser/runtime verification when available; isolated PHP/admin permission inspection; read-only provider/plugin capability research. Only one owner edits each shared contract, lockfile, configuration or registry at a time. Dependent implementations wait for the accepted contract revision.

Unsafe parallelization: two agents changing the same money/cart contract; a theme inventing prices while an adapter is incomplete; enabling a provider to unblock a mock checkout; deploying plugins/migrations from a task assignment. Hub orchestration must keep these boundaries explicit.
