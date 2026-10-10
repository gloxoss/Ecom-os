# 47. Durable versioned WordPress RFQ backend

Phase 7. Lane: platform. Risk: red. Canonical hub units: ECO-704.

## Outcome

Real durable headless API, snapshots and immutable revision transitions work independently of a shortcode.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-704; requirements: REQ-ECO-704 -->

<task type="auto" id="47-01">
  <name>Choose verified quote backend strategy</name>
  <files>docs/ecomos/rfq/BACKEND_DECISION.md, docs/ecomos/evidence/ECO-704/headless-spike.md</files>
  <action>Compare a mature quotation plugin to a custom companion using real headless API, revision, permission and HPOS tests. A shortcode alone is not API capability; paid/deployed plugin changes need scoped approval.</action>
  <verify>Selected strategy passes requirements or custom plugin remains the planned path; licenses and maintenance are recorded.</verify>
  <done>Choose verified quote backend strategy was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-704; requirements: REQ-ECO-704 -->

<task type="auto" id="47-02">
  <name>Persist immutable quote revisions safely</name>
  <files>plugins/wp-ecomos-rfq/schema.php, plugins/wp-ecomos-rfq/repository.php, plugins/wp-ecomos-rfq/tests/repository.test.php</files>
  <action>Use versioned durable storage, indexed ownership/state/attempt identifiers and immutable snapshots/revisions. Guard transitions atomically and support idempotent migrations/rollback.</action>
  <verify>Concurrent revisions cannot overwrite accepted history; duplicate attempt and restart preserve one request.</verify>
  <done>Persist immutable quote revisions safely was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-704; requirements: REQ-ECO-704 -->

<task type="auto" id="47-03">
  <name>Expose versioned authorized RFQ endpoints</name>
  <files>plugins/wp-ecomos-rfq/wp-ecomos-rfq.php, plugins/wp-ecomos-rfq/routes.php, plugins/wp-ecomos-rfq/tests/routes.test.php</files>
  <action>Expose validated guest ownership and staff capability operations using selected durable repository. Protect reads/writes, bound lists and deny all routes when addon is off.</action>
  <verify>Wrong ownership/role, illegal state and off-state fail; allowed transitions persist with audit references.</verify>
  <done>Expose versioned authorized RFQ endpoints was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-704; requirements: REQ-ECO-704 -->

<task type="checkpoint" id="47-04">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-704 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Real durable headless API, snapshots and immutable revision transitions work independently of a shortcode.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 25, 26, 27, 28, 29, 40, 41, 42, 43, 44. Runtime hub phase prerequisites remain [3,6]. Resolve D-06 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-704 boundary", () => {
  it.todo("Selected strategy passes requirements or custom plugin remains the planned path; licenses and maintenance are recorded.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
