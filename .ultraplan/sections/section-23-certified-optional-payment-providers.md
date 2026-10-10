# 23. Certified optional payment providers

Phase 2. Lane: commerce. Risk: red. Canonical hub units: ECO-205.

## Outcome

COD can remain the only certified provider; online gateways require provider-specific proof and scoped owner authorization.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-205; requirements: REQ-ECO-205 -->

<task type="auto" id="23-01">
  <name>Specify payment certification evidence contract</name>
  <files>packages/addons-multi-payment/src/interface.ts, packages/addons-multi-payment/src/registry.ts, packages/addons-multi-payment/src/__tests__/provider-capabilities.test.ts</files>
  <action>Preserve COD core and disabled Stripe/CMI defaults. Define provider capability, signed approval semantics, durable event handling and reconciliation requirements before any gateway is activated.</action>
  <verify>Disabled direct routes/callbacks cannot mutate orders; declined or wrongly signed events never mark paid.</verify>
  <done>Specify payment certification evidence contract was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-205; requirements: REQ-ECO-205 -->

<task type="auto" id="23-02">
  <name>Certify COD or selected payment capability</name>
  <files>packages/addons-multi-payment/src/providers/cod/provider.ts, packages/addons-multi-payment/src/__tests__/provider-capabilities.test.ts, docs/ecomos/evidence/ECO-205/certification.md</files>
  <action>Certify the chosen release profile: COD-only is a valid complete branch, with Stripe/CMI still denied at direct boundaries and explicitly deferred in the evidence. If D-01 selects an online provider, prepare a separate bounded provider-specific assignment against its real existing files and require sandbox success/decline/signature/amount/currency, durable retries and reordered-event recovery before certification. Do not create generic selected-provider placeholder files or make deferred online payments a prerequisite of CORE_GUEST.</action>
  <verify>COD-only branch passes canonical COD plus negative disabled-provider checks; online activation, if selected, additionally requires provider-specific real staging certification. Missing online merchant choice does not block COD-only acceptance.</verify>
  <done>The selected release payment capability was certified or explicitly deferred with COD-only scope preserved.</done>
</task>

<!-- Hub: ECO-205; requirements: REQ-ECO-205 -->

<task type="checkpoint" id="23-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-205 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>COD can remain the only certified provider; online gateways require provider-specific proof and scoped owner authorization.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 22. Runtime hub phase prerequisites remain [1]. Resolve D-01 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-205 boundary", () => {
  it.todo("Disabled direct routes/callbacks cannot mutate orders; declined or wrongly signed events never mark paid.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
