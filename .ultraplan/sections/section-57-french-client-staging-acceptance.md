# 57. French client staging acceptance

Phase 8. Lane: experience. Risk: red. Canonical hub units: ECO-807.

## Outcome

French mobile/desktop staging UAT is accepted; cutover remains separately authorized.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-807; requirements: REQ-ECO-807 -->

<task type="auto" id="57-01">
  <name>Execute mobile desktop French client UAT</name>
  <files>apps/storefront/e2e/paraloca-uat.spec.ts, docs/ecomos/evidence/ECO-807/uat.md</files>
  <action>Run catalog/search/buy/RFQ scenarios on isolated staging with approved content and synthetic Woo records. Check accessibility, locale/currency, failures and safe guest access.</action>
  <verify>Recorded device/browser scenarios produce verified test orders/quotes and expose no mandatory customer account requirement.</verify>
  <done>Execute mobile desktop French client UAT was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-807; requirements: REQ-ECO-807 -->

<task type="auto" id="57-02">
  <name>Prepare reviewable client cutover packet</name>
  <files>docs/ecomos/release/PARALOCA_CUTOVER.md, docs/ecomos/evidence/ECO-807/open-risks.md</files>
  <action>Prepare deployment/dns/rollback/content/payment checklist and unresolved risks with concrete staging evidence. Keep independent Coming Soon page until explicit authorized cutover.</action>
  <verify>Owner can review exact target domain/build/rollback; no launch is inferred from successful staging.</verify>
  <done>Prepare reviewable client cutover packet was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-807; requirements: REQ-ECO-807 -->

<task type="checkpoint" id="57-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-807 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>French mobile/desktop staging UAT is accepted; cutover remains separately authorized.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 44, 45, 46, 47, 48, 49, 50, 53, 54, 55, 56. Runtime hub phase prerequisites remain [4,5,7]. Resolve D-08 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-807 boundary", () => {
  it.todo("Recorded device/browser scenarios produce verified test orders/quotes and expose no mandatory customer account requirement.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
