# 18. Native brand capability projection

Phase 1. Lane: catalog. Risk: yellow. Canonical hub units: ECO-105.

## Outcome

Native capability is demonstrated locally and neutral brand projection does not silently discard terms.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-105; requirements: REQ-ECO-105 -->

<task type="auto" id="18-01">
  <name>Project verified native brand data</name>
  <files>packages/engine-woocommerce/src/brands.ts, packages/engine-woocommerce/src/mappers.ts, packages/engine-woocommerce/src/__tests__/brands.test.ts</files>
  <action>Capability-test native product_brand and its installed schema/API. Implement provider-neutral identity and the agreed multiple-brand/primary-brand semantics; owned/third-party metadata is optional client data.</action>
  <verify>Absent support differs from an empty brand catalog; multiple terms are retained or handled by a documented policy.</verify>
  <done>Project verified native brand data was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-105; requirements: REQ-ECO-105 -->

<task type="auto" id="18-02">
  <name>Expose brands through engine contracts</name>
  <files>packages/engine-woocommerce/src/client.ts, packages/ecom-engine/src/interface.ts, packages/ecom-engine/src/fake-engine.ts</files>
  <action>Expose supported list/detail brand operations through EcomEngine with explicit capability results. Keep ParaLoca business naming out of the adapter.</action>
  <verify>Existing consumers typecheck; installed brand fixtures resolve IDs/slugs and empty/unsupported behavior correctly.</verify>
  <done>Expose brands through engine contracts was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-105; requirements: REQ-ECO-105 -->

<task type="checkpoint" id="18-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-105 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Native capability is demonstrated locally and neutral brand projection does not silently discard terms.</verify>
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
describe("ECO-105 boundary", () => {
  it.todo("Absent support differs from an empty brand catalog; multiple terms are retained or handled by a documented policy.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
