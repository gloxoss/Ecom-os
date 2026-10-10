# 52. Approved ParaLoca visual direction

Phase 8. Lane: experience. Risk: yellow. Canonical hub units: ECO-802.

## Outcome

Approved visual direction is implemented through client theme/profile only.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-802; requirements: REQ-ECO-802 -->

<task type="auto" id="52-01">
  <name>Implement approved client visual tokens</name>
  <files>packages/themes/src/clients/paraloca/theme.ts, clients/paraloca/DESIGN.md</files>
  <action>Apply the existing approved light minimal medical-lifestyle reference through client tokens/slots. Preserve working generic behavior and avoid treating mockups as integration evidence.</action>
  <verify>Reference comparison records typography/colors/layout and readable contrast on mobile/desktop.</verify>
  <done>Implement approved client visual tokens was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-802; requirements: REQ-ECO-802 -->

<task type="auto" id="52-02">
  <name>Review reusable client presentation slots</name>
  <files>apps/storefront/src/features/layout/ui/client-shell.tsx, apps/storefront/e2e/paraloca-visual.spec.ts, docs/ecomos/evidence/ECO-802/review.md</files>
  <action>Use slots for client-specific layout without changing commerce logic. Present actual rendered screens for owner visual acceptance, with reduced-motion and keyboard states.</action>
  <verify>Owner review uses real screenshots and records deviations/acceptance separately from backend tests.</verify>
  <done>Review reusable client presentation slots was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-802; requirements: REQ-ECO-802 -->

<task type="checkpoint" id="52-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-802 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Approved visual direction is implemented through client theme/profile only.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 44, 45, 46, 47, 48, 49, 50, 51. Runtime hub phase prerequisites remain [4,5,7]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-802 boundary", () => {
  it.todo("Reference comparison records typography/colors/layout and readable contrast on mobile/desktop.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
