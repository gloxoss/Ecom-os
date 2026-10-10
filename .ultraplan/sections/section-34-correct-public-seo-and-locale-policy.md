# 34. Correct public SEO and locale policy

Phase 4. Lane: experience. Risk: yellow. Canonical hub units: ECO-405.

## Outcome

Canonical/indexing/structured data are truthful, and extra locale behavior is explicitly configured.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-405; requirements: REQ-ECO-405 -->

<task type="auto" id="34-01">
  <name>Define canonical indexing and sitemap rules</name>
  <files>apps/storefront/src/app/sitemap.ts, apps/storefront/src/app/robots.ts, apps/storefront/e2e/seo.spec.ts</files>
  <action>Derive canonical public URLs from profile and catalog data. Define facet/search noindex policy, removed item handling and sitemap completeness without private order/RFQ capabilities.</action>
  <verify>Sitemap includes published records across pages; private/draft/filtered URLs obey policy and wrong canonical host fails.</verify>
  <done>Define canonical indexing and sitemap rules was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-405; requirements: REQ-ECO-405 -->

<task type="auto" id="34-02">
  <name>Render locale aware structured catalog metadata</name>
  <files>apps/storefront/src/lib/seo/product.ts, apps/storefront/src/app/[locale]/(shop)/product/[slug]/page.tsx, apps/storefront/src/i18n/routing.ts</files>
  <action>Use true price/currency/availability for structured data and supported locale links. Keep French first; RTL and extra languages are capability-driven rather than invented mandatory launch scope.</action>
  <verify>Metadata matches Woo and profile; unavailable/removed products and disabled locales do not advertise false offers.</verify>
  <done>Render locale aware structured catalog metadata was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-405; requirements: REQ-ECO-405 -->

<task type="checkpoint" id="34-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-405 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Canonical/indexing/structured data are truthful, and extra locale behavior is explicitly configured.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 32, 33. Runtime hub phase prerequisites remain [1,2,3]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-405 boundary", () => {
  it.todo("Sitemap includes published records across pages; private/draft/filtered URLs obey policy and wrong canonical host fails.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
