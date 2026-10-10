# 20. Authoritative variation aware cart

Phase 2. Lane: commerce. Risk: red. Canonical hub units: ECO-202.

## Outcome

Add/update/remove, reload, stock/price/coupon revalidation and cross-guest isolation use one Woo cart.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-202; requirements: REQ-ECO-202 -->

<task type="auto" id="20-01">
  <name>Implement Woo cart line operations</name>
  <files>packages/engine-woocommerce/src/cart.ts, packages/ecom-engine/src/types.ts, packages/engine-woocommerce/src/__tests__/cart.test.ts</files>
  <action>Add exact product/variation/attribute/quantity inputs and update/remove by Woo line key. Let Woo enforce stock, quantity limits, pricing and coupons; do not construct authoritative totals locally.</action>
  <verify>Different variations remain different lines; quantity/coupon/price changes return canonical Woo errors or refreshed cart.</verify>
  <done>Implement Woo cart line operations was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-202; requirements: REQ-ECO-202 -->

<task type="auto" id="20-02">
  <name>Connect authoritative cart mutation route</name>
  <files>apps/storefront/src/app/api/cart/items/route.ts, apps/storefront/src/lib/commerce/guest-session.ts, apps/storefront/src/__tests__/security/cart-items.test.ts</files>
  <action>Validate input and session/origin on each line mutation and use the existing Woo session. Map safe errors with private headers and preserve exact identity.</action>
  <verify>Invalid quantities, cross-session keys and stale variations fail; valid update/remove returns the same guest canonical cart.</verify>
  <done>Connect authoritative cart mutation route was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-202; requirements: REQ-ECO-202 -->

<task type="auto" id="20-03">
  <name>Reconcile cart display and rollback</name>
  <files>apps/storefront/src/stores/cart-store.ts, apps/storefront/src/features/cart/ui/cart.tsx, apps/storefront/e2e/cart.spec.ts</files>
  <action>Replace parent-ID merge and authoritative localStorage totals with a Woo cart projection. If UI is optimistic, roll back rejected changes and refresh on price/stock/session changes.</action>
  <verify>Reload and two-tab changes reconcile; failed mutation restores canonical state and exact variations remain distinct.</verify>
  <done>Reconcile cart display and rollback was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-202; requirements: REQ-ECO-202 -->

<task type="checkpoint" id="20-04">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-202 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Add/update/remove, reload, stock/price/coupon revalidation and cross-guest isolation use one Woo cart.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 19. Runtime hub phase prerequisites remain [1]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-202 boundary", () => {
  it.todo("Different variations remain different lines; quantity/coupon/price changes return canonical Woo errors or refreshed cart.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
