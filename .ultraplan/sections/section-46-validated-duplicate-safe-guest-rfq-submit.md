# 46. Validated duplicate safe guest RFQ submit

Phase 7. Lane: commerce. Risk: red. Canonical hub units: ECO-703.

## Outcome

Guest review/submit creates one validated owned request and handles failure/retry.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-703; requirements: REQ-ECO-703 -->

<task type="auto" id="46-01">
  <name>Validate quote contact and review intent</name>
  <files>packages/addons-rfq/src/submit-schema.ts, packages/addons-rfq/src/submit-schema.test.ts, apps/storefront/src/features/rfq/ui/quote-review.tsx</files>
  <action>Validate quantities, optional notes and configured contact/company/consent fields. Show a review step and revalidate stale catalog identities without requiring account creation.</action>
  <verify>Invalid/missing fields and removed products are actionable; guest review preserves selected identities.</verify>
  <done>Validate quote contact and review intent was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-703; requirements: REQ-ECO-703 -->

<task type="auto" id="46-02">
  <name>Expose owned idempotent guest submit boundary</name>
  <files>apps/storefront/src/app/api/rfq/route.ts, packages/addons-rfq/src/client.ts, apps/storefront/src/__tests__/security/rfq-submit.test.ts</files>
  <action>Use durable backend idempotency with origin/rate and input protection; return minimal owned request reference. Avoid duplicate mail or quote records after uncertain outcomes.</action>
  <verify>Concurrent, sequential and timeout/retry submits create one durable request; private contact data never enters public cache/logs.</verify>
  <done>Expose owned idempotent guest submit boundary was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-703; requirements: REQ-ECO-703 -->

<task type="checkpoint" id="46-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-703 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Guest review/submit creates one validated owned request and handles failure/retry.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 25, 26, 27, 28, 29, 40, 41, 42, 43, 45, 47. Runtime hub phase prerequisites remain [3,6]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-703 boundary", () => {
  it.todo("Invalid/missing fields and removed products are actionable; guest review preserves selected identities.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
