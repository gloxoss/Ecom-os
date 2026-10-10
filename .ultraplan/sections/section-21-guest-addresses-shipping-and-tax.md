# 21. Guest addresses shipping and tax

Phase 2. Lane: commerce. Risk: red. Canonical hub units: ECO-203.

## Outcome

Customer details, destination shipping and tax are backend quoted with merchant policy still an explicit decision.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-203; requirements: REQ-ECO-203 -->

<task type="auto" id="21-01">
  <name>Quote destination totals through Woo</name>
  <files>packages/engine-woocommerce/src/checkout.ts, packages/engine-woocommerce/src/__tests__/checkout-quote.test.ts</files>
  <action>Update validated guest addresses in the same Store API session and request configured shipping/tax/totals. Require a real allowed rate and distinguish unavailable delivery from a zero fee.</action>
  <verify>Destination changes alter canonical totals/rates; missing rate, invalid country and changed stock fail safely.</verify>
  <done>Quote destination totals through Woo was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-203; requirements: REQ-ECO-203 -->

<task type="auto" id="21-02">
  <name>Validate configured guest address fields</name>
  <files>apps/storefront/src/features/checkout/model/address-schema.ts, apps/storefront/src/app/api/checkout/quote/route.ts, apps/storefront/src/__tests__/security/checkout-quote.test.ts</files>
  <action>Use profile-specific country/address rules and reject invalid contact or unsupported destinations at the BFF. Keep session ownership, origin protection and private response headers.</action>
  <verify>French/Moroccan synthetic cases pass configured rules; client-supplied shipping/tax amounts cannot override Woo.</verify>
  <done>Validate configured guest address fields was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-203; requirements: REQ-ECO-203 -->

<task type="auto" id="21-03">
  <name>Render canonical checkout quotation states</name>
  <files>apps/storefront/src/features/checkout/ui/checkout-form.tsx, apps/storefront/src/features/checkout/ui/shipping-methods.tsx, apps/storefront/e2e/checkout-quote.spec.ts</files>
  <action>Display backend shipping, tax and grand total with loading, failure and repricing recovery. Do not treat synthetic fixture rates as merchant-approved delivery policy.</action>
  <verify>Switching destination/rate updates totals; stale quotes require refreshed confirmation and blocked destinations cannot proceed.</verify>
  <done>Render canonical checkout quotation states was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-203; requirements: REQ-ECO-203 -->

<task type="checkpoint" id="21-04">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-203 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Customer details, destination shipping and tax are backend quoted with merchant policy still an explicit decision.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 20. Runtime hub phase prerequisites remain [1]. Resolve D-02 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-203 boundary", () => {
  it.todo("Destination changes alter canonical totals/rates; missing rate, invalid country and changed stock fail safely.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
