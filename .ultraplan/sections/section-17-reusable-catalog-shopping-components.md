# 17. Reusable catalog shopping components

Phase 1. Lane: experience. Risk: yellow. Canonical hub units: ECO-104.

## Outcome

Generic PLP/PDP/category consumers and exact variation intents work accessibly; cart authority is accepted only in Phase 2.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-104; requirements: REQ-ECO-104 -->

<task type="auto" id="17-01">
  <name>Preserve exact accessible variation intent</name>
  <files>apps/storefront/src/features/product/ui/variation-selector.tsx, apps/storefront/src/features/product/model/purchase-intent.ts, apps/storefront/src/features/product/model/purchase-intent.test.ts</files>
  <action>Resolve only valid purchasable attribute combinations and return parent ID, variation ID, SKU and quantity. Provide keyboard-operable controls with explicit incomplete, unavailable and stale-product states.</action>
  <verify>Keyboard selection emits the exact fixture variation; missing or invalid combinations cannot emit a buy intent.</verify>
  <done>Preserve exact accessible variation intent was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-104; requirements: REQ-ECO-104 -->

<task type="auto" id="17-02">
  <name>Connect variation selection to product pages</name>
  <files>apps/storefront/src/features/product/ui/add-to-cart-button.tsx, apps/storefront/src/features/product/ui/product-hero.tsx, apps/storefront/src/app/[locale]/(shop)/product/[slug]/page.tsx</files>
  <action>Use generic engine data for selection, gallery and stock/range display. Keep checkout contained until Phase 2; cart intent integration may not treat a variable parent as an exact purchasable item.</action>
  <verify>PDP displays correct backend money/media and disabled unavailable choices; loading, errors and removed products are distinct.</verify>
  <done>Connect variation selection to product pages was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-104; requirements: REQ-ECO-104 -->

<task type="auto" id="17-03">
  <name>Render data driven catalog states</name>
  <files>apps/storefront/src/features/catalog/ui/product-grid.tsx, apps/storefront/src/features/catalog/ui/category-tree.tsx, apps/storefront/e2e/catalog.spec.ts</files>
  <action>Preserve existing presentation while wiring normalized products/categories. Provide empty, loading, upstream-error and removed-product states with accessible controls and image fallbacks.</action>
  <verify>Mobile and desktop fixtures render backend data, pagination beyond 20 and actionable error recovery without hardcoded product content.</verify>
  <done>Render data driven catalog states was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-104; requirements: REQ-ECO-104 -->

<task type="checkpoint" id="17-04">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-104 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Generic PLP/PDP/category consumers and exact variation intents work accessibly; cart authority is accepted only in Phase 2.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 13, 14, 15, 16, 18. Runtime hub phase prerequisites remain [0]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-104 boundary", () => {
  it.todo("Keyboard selection emits the exact fixture variation; missing or invalid combinations cannot emit a buy intent.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
