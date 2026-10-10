# 22. Real duplicate safe COD purchase

Phase 2. Lane: commerce. Risk: red. Canonical hub units: ECO-204.

## Outcome

Real browser-to-Woo COD order, two products including a variation, configured rate, server-confirmed receipt/mail sink and sequential/concurrent recovery proof.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-204; requirements: REQ-ECO-204 -->

<task type="auto" id="22-01">
  <name>Persist checkout attempt and recovery</name>
  <files>packages/engine-woocommerce/src/checkout-attempts.ts, packages/engine-woocommerce/src/__tests__/checkout-attempts.test.ts, docs/ecomos/evidence/ECO-204/idempotency.md</files>
  <action>Choose durable attempt storage and atomic uniqueness for a session/attempt key before enabling order submission. Model pending, confirmed, failed and unknown outcome; do not assume a universal upstream Idempotency-Key.</action>
  <verify>Sequential and concurrent requests produce one attempt/order; crash or timeout after upstream commit recovers without blind resubmission.</verify>
  <done>Persist checkout attempt and recovery was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-204; requirements: REQ-ECO-204 -->

<task type="auto" id="22-02">
  <name>Implement confirmed COD submission boundary</name>
  <files>apps/storefront/src/app/api/checkout/route.ts, packages/engine-woocommerce/src/checkout.ts, apps/storefront/src/__tests__/security/checkout-submit.test.ts</files>
  <action>Submit only a validated canonical cart/rate and certified COD capability using durable attempts. Confirm legitimate backend order status rather than merely a checkout-draft ID; capability-test expected_total before relying on it.</action>
  <verify>Stale totals, unavailable stock, gateway denial and concurrent submits cannot produce false paid/success states.</verify>
  <done>Implement confirmed COD submission boundary was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-204; requirements: REQ-ECO-204 -->

<task type="auto" id="22-03">
  <name>Connect confirmed guest order receipt</name>
  <files>apps/storefront/src/features/checkout/ui/checkout-form.tsx, apps/storefront/src/features/checkout/ui/order-confirmation.tsx, apps/storefront/e2e/guest-cod.spec.ts</files>
  <action>Render confirmation only from server-confirmed purchase state and use a transactional mail test sink. Handle uncertain outcomes and recoverable failures; preserve two products including one variation.</action>
  <verify>Browser order ID/status, line variation, shipping, tax and total match Woo; no customer account or duplicate order is created.</verify>
  <done>Connect confirmed guest order receipt was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-204; requirements: REQ-ECO-204 -->

<task type="checkpoint" id="22-04">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-204 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Real browser-to-Woo COD order, two products including a variation, configured rate, server-confirmed receipt/mail sink and sequential/concurrent recovery proof.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 21. Runtime hub phase prerequisites remain [1]. Resolve D-03 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-204 boundary", () => {
  it.todo("Sequential and concurrent requests produce one attempt/order; crash or timeout after upstream commit recovers without blind resubmission.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
