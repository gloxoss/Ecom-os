# 29. URL synchronized discovery facets

Phase 3. Lane: experience. Risk: yellow. Canonical hub units: ECO-305.

## Outcome

One reusable filter/query state works across catalog and enabled RFQ.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-305; requirements: REQ-ECO-305 -->

<task type="auto" id="29-01">
  <name>Normalize catalog URL filter state</name>
  <files>apps/storefront/src/features/catalog/model/query-state.ts, apps/storefront/src/features/catalog/model/query-state.test.ts</files>
  <action>Serialize supported category/brand/availability/attribute facets and sorting to stable URLs. Validate unknown values, reset cursors on changes and preserve back/forward state.</action>
  <verify>Mixed filters round-trip, clear-all resets pagination and malformed query input cannot inject unsupported upstream options.</verify>
  <done>Normalize catalog URL filter state was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-305; requirements: REQ-ECO-305 -->

<task type="auto" id="29-02">
  <name>Connect accessible facet controls</name>
  <files>apps/storefront/src/features/catalog/ui/filters.tsx, apps/storefront/src/app/[locale]/(shop)/catalog/page.tsx, apps/storefront/e2e/facets.spec.ts</files>
  <action>Render server-supported counts and results through the shared query contract. Keep mobile controls, loading/empty/errors and browser navigation coherent; reuse services in enabled RFQ.</action>
  <verify>Combined facets/counts match backend truth, pages do not repeat and copied URLs reproduce the same selection.</verify>
  <done>Connect accessible facet controls was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-305; requirements: REQ-ECO-305 -->

<task type="checkpoint" id="29-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-305 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>One reusable filter/query state works across catalog and enabled RFQ.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 28. Runtime hub phase prerequisites remain [1]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-305 boundary", () => {
  it.todo("Mixed filters round-trip, clear-all resets pagination and malformed query input cannot inject unsupported upstream options.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
