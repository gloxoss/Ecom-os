# 51. French Moroccan ParaLoca profile

Phase 8. Lane: experience. Risk: yellow. Canonical hub units: ECO-801.

## Outcome

ParaLoca is client configuration, not a fork of commerce core.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-801; requirements: REQ-ECO-801 -->

<task type="auto" id="51-01">
  <name>Create validated ParaLoca client manifest</name>
  <files>clients/paraloca/profile.ts, clients/paraloca/README.md, clients/paraloca/profile.test.ts</files>
  <action>Set approved spelling ParaLoca, target paraloca.ma, French/MAD and Morocco address context. Keep real gateway/shipping/tax policy pending merchant evidence and secrets outside profile.</action>
  <verify>Profile validation matches currency/locale and does not enable uncertified gateways or invent delivery/tax policy.</verify>
  <done>Create validated ParaLoca client manifest was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-801; requirements: REQ-ECO-801 -->

<task type="auto" id="51-02">
  <name>Connect ParaLoca profile theme selection</name>
  <files>packages/themes/src/clients/paraloca/theme.ts, apps/storefront/src/lib/client-profile.ts, apps/storefront/e2e/paraloca-profile.spec.ts</files>
  <action>Select the client theme/profile through existing seams and separate deployment environment. Generic packages must contain no ParaLoca business constants.</action>
  <verify>French/MAD renders from profile and source boundary guard passes without adapter changes.</verify>
  <done>Connect ParaLoca profile theme selection was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-801; requirements: REQ-ECO-801 -->

<task type="checkpoint" id="51-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-801 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>ParaLoca is client configuration, not a fork of commerce core.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 44, 45, 46, 47, 48, 49, 50. Runtime hub phase prerequisites remain [4,5,7]. Resolve D-02 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-801 boundary", () => {
  it.todo("Profile validation matches currency/locale and does not enable uncertified gateways or invent delivery/tax policy.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
