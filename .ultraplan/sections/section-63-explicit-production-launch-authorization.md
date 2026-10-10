# 63. Explicit production launch authorization

Phase 9. Lane: platform. Risk: red. Canonical hub units: ECO-906.

## Outcome

Production changes occur only after explicit operator approval of the concrete release packet.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-906; requirements: REQ-ECO-906 -->

<task type="auto" id="63-01">
  <name>Prepare certified production release evidence</name>
  <files>docs/ecomos/release/RELEASE_PACKET.md, docs/ecomos/release/ROLLBACK.md</files>
  <action>Prepare exact integrated build, domain, approved content/gateway/shipping/tax, backups/restore and known-risk signoff. Resolve or explicitly decide remaining advisory exposure before production approval.</action>
  <verify>Packet links core, addon, ParaLoca and second-client evidence with no critical unapproved capability.</verify>
  <done>Prepare certified production release evidence was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-906; requirements: REQ-ECO-906 -->

<task type="auto" id="63-02">
  <name>Request concrete scoped launch approval</name>
  <files>docs/ecomos/release/APPROVAL.md</files>
  <action>Present the completed reviewable release packet and exact production changes to the operator. Keep deployment, DNS and live payment actions pending until explicit scoped approval; staging approval is not launch approval.</action>
  <verify>Actual owner approval names target/build/actions and rollback, or launch remains blocked.</verify>
  <done>Request concrete scoped launch approval was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-906; requirements: REQ-ECO-906 -->

<task type="checkpoint" id="63-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-906 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Production changes occur only after explicit operator approval of the concrete release packet.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62. Runtime hub phase prerequisites remain [8]. Resolve D-08 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-906 boundary", () => {
  it.todo("Packet links core, addon, ParaLoca and second-client evidence with no critical unapproved capability.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
