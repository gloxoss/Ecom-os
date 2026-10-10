# 28. Accessible shared search suggestions

Phase 3. Lane: experience. Risk: yellow. Canonical hub units: ECO-304.

## Outcome

Storefront and later RFQ can consume one accessible search component/service.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-304; requirements: REQ-ECO-304 -->

<task type="auto" id="28-01">
  <name>Implement cancellable shared suggestion hook</name>
  <files>apps/storefront/src/features/search/model/use-search.ts, apps/storefront/src/features/search/model/use-search.test.ts</files>
  <action>Debounce and cancel stale requests while keeping exact SKU input intact. Limit requests and present distinct loading, empty and error results.</action>
  <verify>Reversed response order cannot overwrite the current query; empty/error and rate-limit recovery are tested.</verify>
  <done>Implement cancellable shared suggestion hook was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-304; requirements: REQ-ECO-304 -->

<task type="auto" id="28-02">
  <name>Render keyboard and mobile suggestions</name>
  <files>apps/storefront/src/features/search/ui/search-box.tsx, apps/storefront/src/features/search/ui/search-overlay.tsx, apps/storefront/e2e/search.spec.ts</files>
  <action>Use the shared contract for product/category/brand suggestions with listbox semantics, keyboard navigation and mobile focus management. Respect reduced motion and expose clear retry state.</action>
  <verify>Keyboard and touch paths select correct items; escape/focus restoration, no results and network failures remain accessible.</verify>
  <done>Render keyboard and mobile suggestions was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-304; requirements: REQ-ECO-304 -->

<task type="checkpoint" id="28-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-304 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Storefront and later RFQ can consume one accessible search component/service.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 26, 27. Runtime hub phase prerequisites remain [1]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-304 boundary", () => {
  it.todo("Reversed response order cannot overwrite the current query; empty/error and rate-limit recovery are tested.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
