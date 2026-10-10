# 38. Small native operations landing

Phase 5. Lane: platform. Risk: yellow. Canonical hub units: ECO-503.

## Outcome

A minimal operations page improves real WordPress workflows without duplicating commerce authority.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-503; requirements: REQ-ECO-503 -->

<task type="auto" id="38-01">
  <name>Implement capability scoped WP operations landing</name>
  <files>plugins/wp-ecomos-operations/wp-ecomos-operations.php, plugins/wp-ecomos-operations/admin-page.php, plugins/wp-ecomos-operations/tests/admin.test.php</files>
  <action>Build a WP-authenticated overview with order queue, low-stock alerts and shortcuts using Woo CRUD and bounded queries. Add typed addon slots without a second Next merchant backend or duplicate reporting database.</action>
  <verify>Synthetic orders/stock display accurately; non-capable role cannot load data and disabled addon slots are absent.</verify>
  <done>Implement capability scoped WP operations landing was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-503; requirements: REQ-ECO-503 -->

<task type="auto" id="38-02">
  <name>Verify operations landing usability</name>
  <files>docs/ecomos/admin/OPERATIONS.md, docs/ecomos/evidence/ECO-503/workflows.md</files>
  <action>Walk through merchant jobs on mobile/desktop with keyboard and actual fixture data. Record screenshots/traces without private payloads and keep technical settings restricted.</action>
  <verify>Manager reaches real order/product/content tasks and no custom UI bypasses Woo permissions.</verify>
  <done>Verify operations landing usability was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-503; requirements: REQ-ECO-503 -->

<task type="checkpoint" id="38-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-503 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>A minimal operations page improves real WordPress workflows without duplicating commerce authority.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 30, 31, 32, 33, 34, 35, 36, 37. Runtime hub phase prerequisites remain [4]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-503 boundary", () => {
  it.todo("Synthetic orders/stock display accurately; non-capable role cannot load data and disabled addon slots are absent.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
