# 61. Independent second client purchase proof

Phase 9. Lane: platform. Risk: red. Canonical hub units: ECO-904.

## Outcome

Two independent deployments prove reuse, not merely two visual themes.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-904; requirements: REQ-ECO-904 -->

<task type="auto" id="61-01">
  <name>Provision independent contrasting demo client</name>
  <files>clients/demo-2/README.md, docs/ecomos/evidence/ECO-904/provision.md</files>
  <action>Use the accepted provisioning procedure for separate WP/DB/secrets with RFQ/accounts off and a contrasting catalog/theme. Avoid reusing ParaLoca customer/session data or copying commerce source.</action>
  <verify>Environment separation and profile identity are evidenced; no core source duplication is introduced.</verify>
  <done>Provision independent contrasting demo client was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-904; requirements: REQ-ECO-904 -->

<task type="auto" id="61-02">
  <name>Run unchanged commerce suite across clients</name>
  <files>apps/storefront/e2e/profile-reuse.spec.ts, docs/ecomos/evidence/ECO-904/reuse.md</files>
  <action>Execute the common browser buy/error/security suite against both independent clients. Include RFQ-off direct API and staff permissions checks in the neutral client.</action>
  <verify>Both create exact verified guest test orders using one core; RFQ/accounts off are truly inaccessible.</verify>
  <done>Run unchanged commerce suite across clients was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-904; requirements: REQ-ECO-904 -->

<task type="checkpoint" id="61-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-904 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Two independent deployments prove reuse, not merely two visual themes.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 51, 52, 53, 54, 55, 56, 57, 35, 58, 59, 60. Runtime hub phase prerequisites remain [8]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-904 boundary", () => {
  it.todo("Environment separation and profile identity are evidenced; no core source duplication is introduced.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
