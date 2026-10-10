# 32. Merchant managed WordPress content

Phase 4. Lane: experience. Risk: yellow. Canonical hub units: ECO-403.

## Outcome

Merchant can edit content without code and safe frontend rendering uses actual CMS data.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-403; requirements: REQ-ECO-403 -->

<task type="auto" id="32-01">
  <name>Expose safe structured WordPress content</name>
  <files>plugins/wp-epioso-cms/epioso-cms.php, packages/ecom-engine/src/content.ts, packages/engine-woocommerce/src/content.ts</files>
  <action>Audit existing CMS slots and expose hero, navigation, banners, stories, articles and SEO through validated neutral structures. Enforce staff write capability, safe rich text and media/reference constraints.</action>
  <verify>Unprivileged writes fail; empty/malformed content and unsafe markup do not compromise rendering.</verify>
  <done>Expose safe structured WordPress content was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-403; requirements: REQ-ECO-403 -->

<task type="auto" id="32-02">
  <name>Render CMS content with safe fallbacks</name>
  <files>apps/storefront/src/features/content/ui/page-sections.tsx, apps/storefront/src/app/[locale]/(shop)/page.tsx, apps/storefront/e2e/cms-content.spec.ts</files>
  <action>Replace production hardcoded marketing with WordPress-managed sections and explicit unavailable/empty fallback. Invalidate only public content cache after authorized edits.</action>
  <verify>A merchant edit changes public content correctly; no private cache, arbitrary script or theme commerce override is introduced.</verify>
  <done>Render CMS content with safe fallbacks was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-403; requirements: REQ-ECO-403 -->

<task type="checkpoint" id="32-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-403 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Merchant can edit content without code and safe frontend rendering uses actual CMS data.</verify>
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
describe("ECO-403 boundary", () => {
  it.todo("Unprivileged writes fail; empty/malformed content and unsafe markup do not compromise rendering.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
