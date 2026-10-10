# 24. Owned guest order status access

Phase 2. Lane: commerce. Risk: red. Canonical hub units: ECO-206.

## Outcome

Guest status is useful without accounts and inaccessible without ownership proof.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-206; requirements: REQ-ECO-206 -->

<task type="auto" id="24-01">
  <name>Define private guest order access grants</name>
  <files>apps/storefront/src/lib/commerce/order-access.ts, apps/storefront/src/__tests__/security/order-access.test.ts</files>
  <action>Use a documented opaque expiring grant or verified native ownership mechanism and protect private capability/email values. Enforce revocation/expiry/rate limits and avoid public ID enumeration.</action>
  <verify>Wrong guest, expired/revoked grant and guessed ID reveal no order data; valid proof accesses only its order.</verify>
  <done>Define private guest order access grants was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-206; requirements: REQ-ECO-206 -->

<task type="auto" id="24-02">
  <name>Expose protected order confirmation status</name>
  <files>apps/storefront/src/app/api/orders/status/route.ts, apps/storefront/src/features/checkout/ui/order-confirmation.tsx, apps/storefront/e2e/guest-order-access.spec.ts</files>
  <action>Return minimal verified status through private no-store responses. Never accept a numeric query ID or success flag as ownership or purchase evidence.</action>
  <verify>Copied numeric URLs fail; valid ownership works after reload and sensitive tokens do not reach analytics/public logs.</verify>
  <done>Expose protected order confirmation status was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-206; requirements: REQ-ECO-206 -->

<task type="checkpoint" id="24-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-206 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Guest status is useful without accounts and inaccessible without ownership proof.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 22. Runtime hub phase prerequisites remain [1]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-206 boundary", () => {
  it.todo("Wrong guest, expired/revoked grant and guessed ID reveal no order data; valid proof accesses only its order.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
