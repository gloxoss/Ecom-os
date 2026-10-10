# 45. Separate variation aware quote basket

Phase 7. Lane: experience. Risk: yellow. Canonical hub units: ECO-702.

## Outcome

A separate accessible quote builder uses shared discovery and preserves exact variation selection.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-702; requirements: REQ-ECO-702 -->

<task type="auto" id="45-01">
  <name>Implement independent exact quote selection</name>
  <files>packages/addons-rfq/src/basket.ts, packages/addons-rfq/src/basket.test.ts, apps/storefront/src/features/rfq/model/quote-store.ts</files>
  <action>Maintain a separate QuoteBasket with exact product/variation/quantity identity. Share catalog/search services, never overwrite the B2C cart and validate removed/unavailable selections.</action>
  <verify>Quote and buy baskets do not cross-mutate; distinct variations and stale records have predictable behavior.</verify>
  <done>Implement independent exact quote selection was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-702; requirements: REQ-ECO-702 -->

<task type="auto" id="45-02">
  <name>Render enabled responsive quote builder</name>
  <files>apps/storefront/src/features/rfq/ui/quote-builder.tsx, apps/storefront/src/app/[locale]/(shop)/devis/page.tsx, apps/storefront/e2e/quote-builder.spec.ts</files>
  <action>Build enabled /devis selection from search and category entry paths with filters and sticky/mobile summary. Keep secondary product action discreet and keyboard accessible.</action>
  <verify>Guest selects at least three items through both entry paths and edits quantities; RFQ-off guard prevents route rendering.</verify>
  <done>Render enabled responsive quote builder was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-702; requirements: REQ-ECO-702 -->

<task type="checkpoint" id="45-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-702 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>A separate accessible quote builder uses shared discovery and preserves exact variation selection.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 25, 26, 27, 28, 29, 40, 41, 42, 43, 44. Runtime hub phase prerequisites remain [3,6]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-702 boundary", () => {
  it.todo("Quote and buy baskets do not cross-mutate; distinct variations and stale records have predictable behavior.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
