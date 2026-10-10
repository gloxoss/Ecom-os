# 33. Reusable accessible shopping templates

Phase 4. Lane: experience. Risk: yellow. Canonical hub units: ECO-404.

## Outcome

Reusable shopping templates are usable on mobile/desktop and preserve authoritative commerce state.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-404; requirements: REQ-ECO-404 -->

<task type="auto" id="33-01">
  <name>Audit shared template accessibility states</name>
  <files>apps/storefront/src/features/catalog/ui/product-grid.tsx, apps/storefront/src/features/product/ui/product-hero.tsx, apps/storefront/e2e/catalog-accessibility.spec.ts</files>
  <action>Preserve UI while correcting semantic structure, labels, images, keyboard/focus and reduced-motion behavior. Cover catalog/PDP loading, empty, error and unavailable states.</action>
  <verify>Repeatable accessibility checks and keyboard walkthrough cover mobile and desktop catalog/PDP.</verify>
  <done>Audit shared template accessibility states was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-404; requirements: REQ-ECO-404 -->

<task type="auto" id="33-02">
  <name>Harden cart checkout mobile interaction</name>
  <files>apps/storefront/src/features/cart/ui/cart.tsx, apps/storefront/src/features/checkout/ui/checkout-form.tsx, apps/storefront/e2e/checkout-accessibility.spec.ts</files>
  <action>Keep canonical backend state while improving form errors, focus restoration and mobile navigation. Avoid optimistic success that contradicts failed or pending commerce.</action>
  <verify>Keyboard/touch checkout errors remain understandable; reduced motion and pending/retry states preserve purchase integrity.</verify>
  <done>Harden cart checkout mobile interaction was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-404; requirements: REQ-ECO-404 -->

<task type="checkpoint" id="33-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-404 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Reusable shopping templates are usable on mobile/desktop and preserve authoritative commerce state.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31. Runtime hub phase prerequisites remain [1,2,3]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-404 boundary", () => {
  it.todo("Repeatable accessibility checks and keyboard walkthrough cover mobile and desktop catalog/PDP.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
