# 36. Server enforced merchant role matrix

Phase 5. Lane: platform. Risk: red. Canonical hub units: ECO-501.

## Outcome

Staff capabilities control real operations independently of navigation hiding.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-501; requirements: REQ-ECO-501 -->

<task type="auto" id="36-01">
  <name>Specify merchant role and job matrix</name>
  <files>docs/ecomos/admin/ROLE_MATRIX.md, plugins/wp-ecomos-operations/capabilities.php</files>
  <action>Map products/stock/orders/promotions/content and addon-enabled quotes to WP staff capabilities. Separate client manager from platform administrator and enforce checks at every write/read endpoint.</action>
  <verify>Role matrix names allow/deny actions and non-admin cannot read secrets or technical settings.</verify>
  <done>Specify merchant role and job matrix was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-501; requirements: REQ-ECO-501 -->

<task type="auto" id="36-02">
  <name>Prove staff permissions against real workflows</name>
  <files>plugins/wp-ecomos-operations/tests/capabilities.test.php, docs/ecomos/evidence/ECO-501/permissions.md</files>
  <action>Exercise allowed merchant jobs and denied direct API/navigation paths with isolated synthetic staff roles. Keep accounts for staff separate from optional customer accounts.</action>
  <verify>Role downgrade, missing capability and disabled addon access fail server-side; permitted jobs remain usable.</verify>
  <done>Prove staff permissions against real workflows was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-501; requirements: REQ-ECO-501 -->

<task type="checkpoint" id="36-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-501 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Staff capabilities control real operations independently of navigation hiding.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 30, 31, 32, 33, 34, 35. Runtime hub phase prerequisites remain [4]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-501 boundary", () => {
  it.todo("Role matrix names allow/deny actions and non-admin cannot read secrets or technical settings.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
