# 19. Secure Woo guest sessions

Phase 2. Lane: commerce. Risk: red. Canonical hub units: ECO-201.

## Outcome

Browser and Woo guest session identity agree, fail safely and remain private.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-201; requirements: REQ-ECO-201 -->

<task type="auto" id="19-01">
  <name>Prove isolated Store API sessions</name>
  <files>packages/engine-woocommerce/src/store-api.ts, packages/engine-woocommerce/src/__tests__/store-api.test.ts, docs/ecomos/evidence/ECO-201/session.md</files>
  <action>Use installed Store API Cart-Token support and verify session lifetime/recovery and gateway compatibility. Treat tokens as secrets and cart/checkout reads as private no-store; never globally disable nonce validation.</action>
  <verify>Two independent guests never share carts; missing/expired tokens and upstream failures have recoverable safe outcomes.</verify>
  <done>Prove isolated Store API sessions was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-201; requirements: REQ-ECO-201 -->

<task type="auto" id="19-02">
  <name>Introduce browser cart session boundary</name>
  <files>apps/storefront/src/lib/commerce/guest-session.ts, apps/storefront/src/app/api/cart/route.ts, apps/storefront/src/__tests__/security/guest-session.test.ts</files>
  <action>Manage Woo tokens behind a BFF using secure session cookies and a documented CSRF/origin policy. Validate requests and rotate/recover sessions without exposing tokens in browser storage, logs or shared caches.</action>
  <verify>Cross-origin mutation, forged session and cross-guest access fail; valid guest cart access works without customer login.</verify>
  <done>Introduce browser cart session boundary was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-201; requirements: REQ-ECO-201 -->

<task type="checkpoint" id="19-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-201 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Browser and Woo guest session identity agree, fail safely and remain private.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18. Runtime hub phase prerequisites remain [1]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-201 boundary", () => {
  it.todo("Two independent guests never share carts; missing/expired tokens and upstream failures have recoverable safe outcomes.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
