# 59. Woo PHP version and HPOS compatibility

Phase 9. Lane: platform. Risk: red. Canonical hub units: ECO-902.

## Outcome

Supported backend versions, HPOS and updater behavior have real PHP/integration proof.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-902; requirements: REQ-ECO-902 -->

<task type="auto" id="59-01">
  <name>Create backend compatibility test matrix</name>
  <files>docs/ecomos/release/BACKEND_MATRIX.md, plugins/tests/bootstrap.php, plugins/tests/compatibility.test.php</files>
  <action>Select a supported WordPress/Woo/PHP/GraphQL/Store API matrix from verified requirements. Test PHP modules, Woo CRUD/HPOS and capability changes without hardcoding the local version as universal support.</action>
  <verify>Each supported row has executed results; unsupported/untested rows are explicitly labeled.</verify>
  <done>Create backend compatibility test matrix was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-902; requirements: REQ-ECO-902 -->

<task type="auto" id="59-02">
  <name>Verify safe plugin and Store API upgrades</name>
  <files>scripts/verify-backend-compatibility.ts, docs/ecomos/evidence/ECO-902/upgrade.md</files>
  <action>Exercise backup, staging upgrade, schema/session/cart/order regression and rollback on the selected matrix. Preserve private tokens and test order extension behavior under HPOS.</action>
  <verify>Upgrade/rollback keep core order/catalog/addon integrity and breaking capabilities fail explicitly.</verify>
  <done>Verify safe plugin and Store API upgrades was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-902; requirements: REQ-ECO-902 -->

<task type="checkpoint" id="59-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-902 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Supported backend versions, HPOS and updater behavior have real PHP/integration proof.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 51, 52, 53, 54, 55, 56, 57. Runtime hub phase prerequisites remain [8]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-902 boundary", () => {
  it.todo("Each supported row has executed results; unsupported/untested rows are explicitly labeled.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
