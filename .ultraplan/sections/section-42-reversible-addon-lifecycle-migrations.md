# 42. Reversible addon lifecycle migrations

Phase 6. Lane: platform. Risk: red. Canonical hub units: ECO-603.

## Outcome

Addon lifecycle is repeatable and reversible with failure and retention semantics proved.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-603; requirements: REQ-ECO-603 -->

<task type="auto" id="42-01">
  <name>Implement idempotent addon migration lifecycle</name>
  <files>plugins/wp-ecomos-addons/lifecycle.php, plugins/wp-ecomos-addons/wp-ecomos-addons.php, plugins/wp-ecomos-addons/tests/lifecycle.test.php</files>
  <action>Version activation/migration/deactivation and handle missing addons without corruption. Use bounded migrations, restart markers and preserve core Woo orders/catalog on off-state.</action>
  <verify>Repeated activation, failed migration and restart recover; deactivation leaves core data intact.</verify>
  <done>Implement idempotent addon migration lifecycle was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-603; requirements: REQ-ECO-603 -->

<task type="auto" id="42-02">
  <name>Document tested lifecycle restore procedure</name>
  <files>docs/ecomos/addons/LIFECYCLE.md, docs/ecomos/evidence/ECO-603/restore.md</files>
  <action>Back up isolated staging and rehearse failure rollback/deactivation with explicit data-retention behavior. Do not authorize paid installs or destructive cleanup implicitly.</action>
  <verify>Recorded restore reproduces the prior compatible state and retained data remains owned/usable.</verify>
  <done>Document tested lifecycle restore procedure was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-603; requirements: REQ-ECO-603 -->

<task type="checkpoint" id="42-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-603 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Addon lifecycle is repeatable and reversible with failure and retention semantics proved.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 19, 20, 21, 22, 23, 24, 41. Runtime hub phase prerequisites remain [2]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-603 boundary", () => {
  it.todo("Repeated activation, failed migration and restart recover; deactivation leaves core data intact.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
