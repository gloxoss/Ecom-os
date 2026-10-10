# 26. Safe product search projection

Phase 3. Lane: catalog. Risk: yellow. Canonical hub units: ECO-302.

## Outcome

Public search documents are safe and exact technical references are never silently rewritten.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-302; requirements: REQ-ECO-302 -->

<task type="auto" id="26-01">
  <name>Normalize public search document identity</name>
  <files>packages/search/src/projection.ts, packages/search/src/projection.test.ts</files>
  <action>Project product/variation identity, exact SKU, localized name, categories, brands, availability, public price, safe attributes, slug and thumbnail. Exclude private quote/customer fields and preserve deletion identity.</action>
  <verify>Fixtures contain no private fields; missing values and exact variation identities map deterministically.</verify>
  <done>Normalize public search document identity was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-302; requirements: REQ-ECO-302 -->

<task type="auto" id="26-02">
  <name>Rank exact technical SKU queries</name>
  <files>packages/search/src/query.ts, packages/search/src/query.test.ts</files>
  <action>Prioritize exact SKU and disable typo rewriting of technical reference identifiers. Allow documented French accent/name typo behavior separately.</action>
  <verify>Exact SKU resolves the intended item before approximate names; French accent/name cases and combined facets match fixtures.</verify>
  <done>Rank exact technical SKU queries was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-302; requirements: REQ-ECO-302 -->

<task type="checkpoint" id="26-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-302 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Public search documents are safe and exact technical references are never silently rewritten.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 25. Runtime hub phase prerequisites remain [1]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-302 boundary", () => {
  it.todo("Fixtures contain no private fields; missing values and exact variation identities map deterministically.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
