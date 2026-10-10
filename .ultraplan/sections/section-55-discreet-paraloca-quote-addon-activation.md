# 55. Discreet ParaLoca quote addon activation

Phase 8. Lane: experience. Risk: yellow. Canonical hub units: ECO-805.

## Outcome

ParaLoca enables the reusable addon discreetly after its own acceptance gate.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-805; requirements: REQ-ECO-805 -->

<task type="auto" id="55-01">
  <name>Configure approved ParaLoca RFQ capability</name>
  <files>clients/paraloca/profile.ts, clients/paraloca/rfq-policy.ts, clients/paraloca/rfq-policy.test.ts</files>
  <action>Enable only the accepted RFQ addon with configured contact/privacy policy and compatible backend. Keep quote and buy intent separate and customer accounts disabled.</action>
  <verify>Invalid/missing RFQ backend or policy fails closed; enabled profile validates.</verify>
  <done>Configure approved ParaLoca RFQ capability was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-805; requirements: REQ-ECO-805 -->

<task type="auto" id="55-02">
  <name>Verify discreet professional quote entry</name>
  <files>apps/storefront/src/features/layout/ui/client-shell.tsx, apps/storefront/src/features/product/ui/add-to-quote-button.tsx, apps/storefront/e2e/paraloca-rfq.spec.ts</files>
  <action>Use a secondary professional link and product quote action with the shared builder. Avoid intrusive B2C detours and verify complete guest request/offer flow.</action>
  <verify>Guest reaches quotes via both paths; buy/cart remains intact and disabled-profile UI/API are absent.</verify>
  <done>Verify discreet professional quote entry was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-805; requirements: REQ-ECO-805 -->

<task type="checkpoint" id="55-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-805 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>ParaLoca enables the reusable addon discreetly after its own acceptance gate.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 44, 45, 46, 47, 48, 49, 50, 51. Runtime hub phase prerequisites remain [4,5,7]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-805 boundary", () => {
  it.todo("Invalid/missing RFQ backend or policy fails closed; enabled profile validates.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
