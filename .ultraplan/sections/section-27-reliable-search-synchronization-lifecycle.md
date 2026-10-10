# 27. Reliable search synchronization lifecycle

Phase 3. Lane: catalog. Risk: red. Canonical hub units: ECO-303.

## Outcome

Changes and removals reach search reliably, with measured freshness and rebuild/retry evidence.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-303; requirements: REQ-ECO-303 -->

<task type="auto" id="27-01">
  <name>Persist catalog change synchronization events</name>
  <files>plugins/wp-ecomos-search/events.php, plugins/wp-ecomos-search/wp-ecomos-search.php, plugins/wp-ecomos-search/tests/events.test.php</files>
  <action>Emit authenticated product/variation/brand/stock change and delete events using durable retry state. Avoid indexing inside shopper requests and validate authorized destinations.</action>
  <verify>Duplicate/reordered events, failed delivery and deletion leave no private or obsolete search document.</verify>
  <done>Persist catalog change synchronization events was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-303; requirements: REQ-ECO-303 -->

<task type="auto" id="27-02">
  <name>Reconcile rebuild and retry indexing</name>
  <files>packages/search/src/sync.ts, packages/search/src/sync.test.ts, scripts/rebuild-search.ts</files>
  <action>Apply event versions idempotently with retry/backoff and full backend reconciliation. Bound batches and expose index health; record measured propagation lag.</action>
  <verify>Missed event is repaired by rebuild, interrupted rebuild resumes safely and update/delete freshness meets the agreed budget.</verify>
  <done>Reconcile rebuild and retry indexing was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-303; requirements: REQ-ECO-303 -->

<task type="checkpoint" id="27-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-303 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Changes and removals reach search reliably, with measured freshness and rebuild/retry evidence.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 26. Runtime hub phase prerequisites remain [1]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-303 boundary", () => {
  it.todo("Duplicate/reordered events, failed delivery and deletion leave no private or obsolete search document.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
