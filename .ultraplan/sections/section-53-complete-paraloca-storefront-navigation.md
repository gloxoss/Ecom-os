# 53. Complete ParaLoca storefront navigation

Phase 8. Lane: experience. Risk: yellow. Canonical hub units: ECO-803.

## Outcome

Complete client navigation, favorites and guides use real data and the shared guest purchase flow.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-803; requirements: REQ-ECO-803 -->

<task type="auto" id="53-01">
  <name>Compose ParaLoca homepage and brand pages</name>
  <files>apps/storefront/src/features/content/ui/page-sections.tsx, apps/storefront/src/app/[locale]/(shop)/brands/[slug]/page.tsx, clients/paraloca/content-schema.ts</files>
  <action>Compose real WordPress homepage, categories, brands and guides through shared templates. Keep empty/loading/error behavior and avoid fake content or authoritative catalog JSON.</action>
  <verify>Homepage/brand/guide fixtures link to real catalog data; unavailable content produces explicit usable states.</verify>
  <done>Compose ParaLoca homepage and brand pages was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-803; requirements: REQ-ECO-803 -->

<task type="auto" id="53-02">
  <name>Connect optional local favorites behavior</name>
  <files>apps/storefront/src/features/product/ui/use-wishlist.ts, apps/storefront/src/features/product/ui/wishlist-button.tsx, apps/storefront/e2e/favorites.spec.ts</files>
  <action>Support favorites without requiring accounts and treat stored identities as non-authoritative preferences. Handle removed products and clear consent/storage policy.</action>
  <verify>Guest can save/remove/reload favorites; removed items recover without fabricating stock or prices.</verify>
  <done>Connect optional local favorites behavior was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-803; requirements: REQ-ECO-803 -->

<task type="auto" id="53-03">
  <name>Verify ParaLoca buy navigation continuity</name>
  <files>apps/storefront/e2e/paraloca-buy.spec.ts, docs/ecomos/evidence/ECO-803/journeys.md</files>
  <action>Exercise home/catalog/PDP/brands/cart/guest checkout using actual fixture data and shared commerce implementation. Record mobile/desktop errors and navigation recovery.</action>
  <verify>Buy flow creates a verified test Woo order with exact variation; no mandatory account page interrupts it.</verify>
  <done>Verify ParaLoca buy navigation continuity was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-803; requirements: REQ-ECO-803 -->

<task type="checkpoint" id="53-04">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-803 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Complete client navigation, favorites and guides use real data and the shared guest purchase flow.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 44, 45, 46, 47, 48, 49, 50, 52. Runtime hub phase prerequisites remain [4,5,7]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-803 boundary", () => {
  it.todo("Homepage/brand/guide fixtures link to real catalog data; unavailable content produces explicit usable states.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
