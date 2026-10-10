# 49. Optional quote to Woo order conversion

Phase 7. Lane: commerce. Risk: red. Canonical hub units: ECO-706.

## Outcome

Optional conversion is one owned audited Woo order with correct money/tax/shipping and duplicate protection.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-706; requirements: REQ-ECO-706 -->

<task type="auto" id="49-01">
  <name>Convert accepted quote through Woo CRUD</name>
  <files>plugins/wp-ecomos-rfq/conversion.php, plugins/wp-ecomos-rfq/tests/conversion.test.php</files>
  <action>Convert only the current accepted owned revision through Woo CRUD using an atomic conversion key. Revalidate price, stock, shipping, tax and payment policy and retain quote/order audit references.</action>
  <verify>Concurrent/repeated conversion creates one order; stale price/stock or wrong revision cannot bypass normal purchase checks.</verify>
  <done>Convert accepted quote through Woo CRUD was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-706; requirements: REQ-ECO-706 -->

<task type="auto" id="49-02">
  <name>Record conversion recovery and policy proof</name>
  <files>docs/ecomos/evidence/ECO-706/conversion.md, apps/storefront/e2e/quote-conversion.spec.ts</files>
  <action>Exercise timeout/restart reconciliation and explicitly configured optional conversion UI. Quote acceptance and order paid status remain distinct; no automatic reservation unless merchant policy authorizes it.</action>
  <verify>One confirmed Woo order is linked to the accepted revision; unknown outcome recovers without duplicate order.</verify>
  <done>Record conversion recovery and policy proof was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-706; requirements: REQ-ECO-706 -->

<task type="checkpoint" id="49-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-706 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Optional conversion is one owned audited Woo order with correct money/tax/shipping and duplicate protection.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 25, 26, 27, 28, 29, 40, 41, 42, 43, 48. Runtime hub phase prerequisites remain [3,6]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-706 boundary", () => {
  it.todo("Concurrent/repeated conversion creates one order; stale price/stock or wrong revision cannot bypass normal purchase checks.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
