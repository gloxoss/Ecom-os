# 54. Owned brands in one catalog

Phase 8. Lane: experience. Risk: yellow. Canonical hub units: ECO-804.

## Outcome

Owned brands are metadata and presentation within the single B2C commerce catalog.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-804; requirements: REQ-ECO-804 -->

<task type="auto" id="54-01">
  <name>Store optional owned brand story metadata</name>
  <files>plugins/wp-epioso-cms/brand-fields.php, clients/paraloca/brand-schema.ts, clients/paraloca/brand-schema.test.ts</files>
  <action>Add optional taxonomy term owned/third-party story/document metadata, scoped to client content conventions. Do not create another checkout/catalog or invent warranties/distributor rights.</action>
  <verify>Owned flag/story is optional, safely rendered and does not alter canonical product identity or prices.</verify>
  <done>Store optional owned brand story metadata was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-804; requirements: REQ-ECO-804 -->

<task type="auto" id="54-02">
  <name>Render owned brand content in shared shopping</name>
  <files>apps/storefront/src/features/brands/ui/brand-story.tsx, apps/storefront/src/app/[locale]/(shop)/brands/[slug]/page.tsx, apps/storefront/e2e/owned-brands.spec.ts</files>
  <action>Render approved owned stories and optional documents alongside ordinary brand/catalog data. Both owned and third-party products use the same search, cart and checkout.</action>
  <verify>Mixed-brand order uses one Woo session/order and generic adapter contains no owned-brand business constants.</verify>
  <done>Render owned brand content in shared shopping was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-804; requirements: REQ-ECO-804 -->

<task type="checkpoint" id="54-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-804 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Owned brands are metadata and presentation within the single B2C commerce catalog.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 44, 45, 46, 47, 48, 49, 50, 53, 18. Runtime hub phase prerequisites remain [4,5,7]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-804 boundary", () => {
  it.todo("Owned flag/story is optional, safely rendered and does not alter canonical product identity or prices.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
