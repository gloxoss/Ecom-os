# 44. Guest RFQ permission state machine

Phase 7. Lane: commerce. Risk: red. Canonical hub units: ECO-701.

## Outcome

Separate guest quote state and actor permissions are specified with privacy/expiry policy.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-701; requirements: REQ-ECO-701 -->

<task type="auto" id="44-01">
  <name>Define guest quote transitions and permissions</name>
  <files>packages/addons-rfq/src/state-machine.ts, packages/addons-rfq/src/state-machine.test.ts</files>
  <action>Define draft/submitted/verified/offer/revised/accepted/rejected/expired transitions and actor permissions. Model ownership, immutable revision identity and configurable consent/retention without customer accounts.</action>
  <verify>Illegal transitions, unverified guest access, stale revision acceptance and wrong staff capability fail.</verify>
  <done>Define guest quote transitions and permissions was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-701; requirements: REQ-ECO-701 -->

<task type="auto" id="44-02">
  <name>Specify quote policy and privacy contract</name>
  <files>packages/addons-rfq/src/policy.ts, docs/ecomos/rfq/POLICY.md, packages/addons-rfq/src/policy.test.ts</files>
  <action>Specify expiration, contact verification, retention, quantities, attachment limits if supported and reservation behavior through client config. No automatic stock reservation is implied by acceptance.</action>
  <verify>Policy boundaries and deletion/expiry cases are tested; unresolved merchant/legal values remain explicit decisions.</verify>
  <done>Specify quote policy and privacy contract was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-701; requirements: REQ-ECO-701 -->

<task type="checkpoint" id="44-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-701 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Separate guest quote state and actor permissions are specified with privacy/expiry policy.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 25, 26, 27, 28, 29, 40, 41, 42, 43. Runtime hub phase prerequisites remain [3,6]. Resolve D-06 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-701 boundary", () => {
  it.todo("Illegal transitions, unverified guest access, stale revision acceptance and wrong staff capability fail.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
