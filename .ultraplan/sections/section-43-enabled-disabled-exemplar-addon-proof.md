# 43. Enabled disabled exemplar addon proof

Phase 6. Lane: platform. Risk: yellow. Canonical hub units: ECO-604.

## Outcome

A small exemplar demonstrates the complete compatibility/on/off contract.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-604; requirements: REQ-ECO-604 -->

<task type="auto" id="43-01">
  <name>Implement manifest driven exemplar addon</name>
  <files>plugins/dummy-addon/index.ts, plugins/dummy-addon/package.json, plugins/dummy-addon/manifest.ts</files>
  <action>Adapt the existing simple exemplar to the new manifest and slots. Provide a harmless visible capability without adding customer login or altering cart/order authority.</action>
  <verify>Valid addon registers; absent/incompatible configuration yields the documented unavailable behavior.</verify>
  <done>Implement manifest driven exemplar addon was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-604; requirements: REQ-ECO-604 -->

<task type="auto" id="43-02">
  <name>Test exemplar failure and off state</name>
  <files>packages/ecom-engine/src/__tests__/addon-integration.test.ts, apps/storefront/e2e/addon-contract.spec.ts</files>
  <action>Exercise activation/deactivation, version mismatch, failed addon startup and direct hidden-route access. Isolate failure so ordinary core catalog/cart remains usable.</action>
  <verify>Enabled slots work; disabled routes/admin/side effects are absent and failure cannot corrupt the core purchase flow.</verify>
  <done>Test exemplar failure and off state was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-604; requirements: REQ-ECO-604 -->

<task type="checkpoint" id="43-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-604 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>A small exemplar demonstrates the complete compatibility/on/off contract.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 19, 20, 21, 22, 23, 24, 42. Runtime hub phase prerequisites remain [2]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-604 boundary", () => {
  it.todo("Valid addon registers; absent/incompatible configuration yields the documented unavailable behavior.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
