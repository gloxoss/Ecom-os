# 16. Product queries and public caching

Phase 1. Lane: catalog. Risk: yellow. Canonical hub units: ECO-103.

## Outcome

Supported query fields actually affect results and page metadata; private carts/orders never share public catalog caching.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-103; requirements: REQ-ECO-103 -->

<task type="auto" id="16-01">
  <name>Define truthful catalog query metadata</name>
  <files>packages/ecom-engine/src/types.ts, packages/ecom-engine/src/interface.ts, packages/ecom-engine/src/__tests__/queries.test.ts</files>
  <action>Choose a single supported cursor or page strategy and define page info, exact-or-unavailable total, price-filter units and locale behavior. Reject unsupported combinations and cursor plus offset ambiguity.</action>
  <verify>Contract tests cover limits, invalid cursors, unknown totals, locale and unsupported filters without invented counts.</verify>
  <done>Define truthful catalog query metadata was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-103; requirements: REQ-ECO-103 -->

<task type="auto" id="16-02">
  <name>Connect catalog filtering and pagination</name>
  <files>packages/engine-woocommerce/src/products.ts, packages/engine-woocommerce/src/client.ts, packages/engine-woocommerce/src/__tests__/queries.test.ts</files>
  <action>Forward search, category, brand, sorting, limits, cursor and visible availability against the verified schema. Partition public caches by all query inputs, reset pagination on filters and avoid per-product fetch loops.</action>
  <verify>All pages are reachable and nonrepeating under stable ordering; combined filters/counts match backend, cache keys do not cross locale or filters.</verify>
  <done>Connect catalog filtering and pagination was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-103; requirements: REQ-ECO-103 -->

<task type="checkpoint" id="16-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-103 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Supported query fields actually affect results and page metadata; private carts/orders never share public catalog caching.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 13, 14, 15. Runtime hub phase prerequisites remain [0]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-103 boundary", () => {
  it.todo("Contract tests cover limits, invalid cursors, unknown totals, locale and unsupported filters without invented counts.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
