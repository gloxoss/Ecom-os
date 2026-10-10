# 56. Approved truthful client product content

Phase 8. Lane: experience. Risk: red. Canonical hub units: ECO-806.

## Outcome

Actual medical/legal content has client evidence and approval, without invented certifications or inventory.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-806; requirements: REQ-ECO-806 -->

<task type="auto" id="56-01">
  <name>Inventory unapproved medical and legal claims</name>
  <files>clients/paraloca/content-approval.md, docs/ecomos/evidence/ECO-806/claim-inventory.md</files>
  <action>Identify real device content, warranties, importer/legal disclosures and distributor/certification claims requiring client evidence. Keep unapproved claims unpublished; never invent stock, registration or rights.</action>
  <verify>Each sensitive public claim has an approval/source reference or is visibly blocked from publication.</verify>
  <done>Inventory unapproved medical and legal claims was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-806; requirements: REQ-ECO-806 -->

<task type="auto" id="56-02">
  <name>Record approved content publication review</name>
  <files>clients/paraloca/content-approval.md, docs/ecomos/evidence/ECO-806/uat.md</files>
  <action>Present concrete content and legal pages to the client for approval before publishing sensitive claims. Record version, approval and unresolved gaps without storing confidential documents in public code.</action>
  <verify>Client approval covers actual reviewed content; missing evidence remains excluded or blocks affected launch content.</verify>
  <done>Record approved content publication review was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-806; requirements: REQ-ECO-806 -->

<task type="checkpoint" id="56-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-806 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Actual medical/legal content has client evidence and approval, without invented certifications or inventory.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 44, 45, 46, 47, 48, 49, 50, 51. Runtime hub phase prerequisites remain [4,5,7]. Resolve D-07 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-806 boundary", () => {
  it.todo("Each sensitive public claim has an approval/source reference or is visibly blocked from publication.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
