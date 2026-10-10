# 15. Authoritative catalog mapping

Phase 1. Lane: catalog. Risk: red. Canonical hub units: ECO-102.

## Outcome

At least 100 mixed products, exact SKU/variation, complete required connections, images, stock, slugs, related items, money and explicit errors match real Woo data. Coordinate with the existing commerce-cleanup owner; do not overwrite its changes.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-102; requirements: REQ-ECO-102 -->

<task type="auto" id="15-01">
  <name>Prove installed catalog schema support</name>
  <files>docs/ecomos/evidence/ECO-102/schema.md, scripts/probe-woocommerce.ts</files>
  <action>Inspect the actual installed GraphQL schema read-only and record supported product, category, variation and gallery connections. Preserve the existing adapter; choose explicit unsupported behavior rather than guessing fields from documentation.</action>
  <verify>Record versions and redacted query results; unavailable schema/permissions remain blocked, never empty success.</verify>
  <done>Prove installed catalog schema support was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-102; requirements: REQ-ECO-102 -->

<task type="auto" id="15-02">
  <name>Propagate explicit catalog transport failures</name>
  <files>packages/engine-woocommerce/src/graphql.ts, packages/engine-woocommerce/src/products.ts, packages/engine-woocommerce/src/__tests__/catalog-errors.test.ts</files>
  <action>Distinguish auth, network, timeout, schema and malformed-payload failures from a legitimate empty collection or missing product. Sanitize upstream details and keep public reads separate from private mutation transport.</action>
  <verify>Failure injection throws a typed safe error; empty catalog and removed product yield their documented results.</verify>
  <done>Propagate explicit catalog transport failures was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-102; requirements: REQ-ECO-102 -->

<task type="auto" id="15-03">
  <name>Complete paginated taxonomy and relationships</name>
  <files>packages/engine-woocommerce/src/products.ts, packages/engine-woocommerce/src/mappers.ts, packages/engine-woocommerce/src/__tests__/categories.test.ts</files>
  <action>Traverse required category connections with parent, children, count and image using an explicit empty-category policy. Resolve slugs and related IDs without cycles, orphan loops or silent fixed-size truncation.</action>
  <verify>Compare a fixture with more than 100 categories and nested ancestors to backend IDs; test cycles, orphans, empty categories and related removed items.</verify>
  <done>Complete paginated taxonomy and relationships was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-102; requirements: REQ-ECO-102 -->

<task type="auto" id="15-04">
  <name>Map complete purchasable variation identity</name>
  <files>packages/engine-woocommerce/src/products.ts, packages/engine-woocommerce/src/mappers.ts, packages/engine-woocommerce/src/__tests__/variations.test.ts</files>
  <action>Retain parent and exact variation IDs, SKU and attribute combinations. Traverse nested variation pages; map stock, backorders and unknown quantity with canonical aliases and source purchase eligibility.</action>
  <verify>A product with more than 50 variations maps completely; unavailable combinations and unmanaged inventory never become falsely purchasable or zero stock.</verify>
  <done>Map complete purchasable variation identity was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-102; requirements: REQ-ECO-102 -->

<task type="auto" id="15-05">
  <name>Project canonical money and media</name>
  <files>packages/engine-woocommerce/src/mappers.ts, packages/engine-woocommerce/src/money.ts, packages/engine-woocommerce/src/__tests__/mapping.test.ts</files>
  <action>Map exact RAW variation money and separate parent display range in backend currency. Deduplicate featured/gallery media with accessible fallback and preserve tax visibility where supported; never parse formatted ranges as one price.</action>
  <verify>Compare backend currency/minor units and all gallery IDs; malformed or missing prices never become free items.</verify>
  <done>Project canonical money and media was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-102; requirements: REQ-ECO-102 -->

<task type="auto" id="15-06">
  <name>Verify reversible mixed catalog fixtures</name>
  <files>scripts/seed-local-woocommerce.php, scripts/verify-catalog-fixtures.ts, docs/ecomos/evidence/ECO-102/fixtures.md</files>
  <action>Use a namespaced isolated fixture set of at least 100 products, proposed 80 simple and 20 variable with at least two variations each. Include hierarchy, brands, galleries, unavailable/backordered/unmanaged stock and a removed record; record backend ground truth and cleanup IDs.</action>
  <verify>Complete paginated product/variation/category ID sets match backend truth, including pages beyond 20; cleanup affects only the fixture namespace.</verify>
  <done>Verify reversible mixed catalog fixtures was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-102; requirements: REQ-ECO-102 -->

<task type="checkpoint" id="15-07">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-102 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>At least 100 mixed products, exact SKU/variation, complete required connections, images, stock, slugs, related items, money and explicit errors match real Woo data. Coordinate with the existing commerce-cleanup owner; do not overwrite its changes.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 13, 14. Runtime hub phase prerequisites remain [0]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-102 boundary", () => {
  it.todo("Record versions and redacted query results; unavailable schema/permissions remain blocked, never empty success.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
