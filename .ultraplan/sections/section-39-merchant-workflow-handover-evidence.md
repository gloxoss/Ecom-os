# 39. Merchant workflow handover evidence

Phase 5. Lane: platform. Risk: yellow. Canonical hub units: ECO-504.

## Outcome

Documented merchant work is demonstrated, including negative permissions and addon off-state.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-504; requirements: REQ-ECO-504 -->

<task type="auto" id="39-01">
  <name>Publish scoped merchant task runbook</name>
  <files>docs/ecomos/admin/MERCHANT_RUNBOOK.md, docs/ecomos/admin/PLATFORM_RUNBOOK.md</files>
  <action>Document routine product/stock/order/content jobs, addon-off behavior and escalation paths. Separate merchant responsibilities from secret/plugin/platform operations.</action>
  <verify>A manager follows instructions on fixtures without code or access to technical secrets.</verify>
  <done>Publish scoped merchant task runbook was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-504; requirements: REQ-ECO-504 -->

<task type="auto" id="39-02">
  <name>Record merchant acceptance and permission failures</name>
  <files>docs/ecomos/evidence/ECO-504/uat.md, plugins/wp-ecomos-operations/tests/workflows.test.php</files>
  <action>Repeat actual allowed jobs and denied direct endpoints with role downgrade and addon off. Record unresolved usability or capability gaps explicitly.</action>
  <verify>Product/stock edit, sample order processing and homepage change succeed; unauthorized settings/addon data access fail.</verify>
  <done>Record merchant acceptance and permission failures was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-504; requirements: REQ-ECO-504 -->

<task type="checkpoint" id="39-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-504 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Documented merchant work is demonstrated, including negative permissions and addon off-state.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 30, 31, 32, 33, 34, 35, 38. Runtime hub phase prerequisites remain [4]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-504 boundary", () => {
  it.todo("A manager follows instructions on fixtures without code or access to technical secrets.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
