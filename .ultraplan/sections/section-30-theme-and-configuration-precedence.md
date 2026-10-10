# 30. Theme and configuration precedence

Phase 4. Lane: experience. Risk: yellow. Canonical hub units: ECO-401.

## Outcome

Brand changes do not require adapter edits or duplicated commerce services.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-401; requirements: REQ-ECO-401 -->

<task type="auto" id="30-01">
  <name>Resolve reusable theme token precedence</name>
  <files>packages/brand-config/src/schema.ts, packages/themes/src/types.ts, packages/brand-config/src/precedence.test.ts</files>
  <action>Define profile/theme/default precedence for tokens, slots, variants, locale/currency/contact and content templates. Reject missing critical fields without putting commerce policy in themes.</action>
  <verify>Two contrasting profiles resolve deterministic tokens and invalid configuration fails explicitly.</verify>
  <done>Resolve reusable theme token precedence was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-401; requirements: REQ-ECO-401 -->

<task type="auto" id="30-02">
  <name>Connect configuration to storefront layout</name>
  <files>apps/storefront/src/app/[locale]/layout.tsx, apps/storefront/src/styles/theme-vars.css, packages/themes/src/index.ts</files>
  <action>Apply resolved tokens and layout slots to existing presentation. Keep engine-specific imports outside UI and respect accessible/reduced-motion styles.</action>
  <verify>Theme switching changes presentation only; same engine data and commerce tests remain valid.</verify>
  <done>Connect configuration to storefront layout was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-401; requirements: REQ-ECO-401 -->

<task type="checkpoint" id="30-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-401 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Brand changes do not require adapter edits or duplicated commerce services.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29. Runtime hub phase prerequisites remain [1,2,3]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-401 boundary", () => {
  it.todo("Two contrasting profiles resolve deterministic tokens and invalid configuration fails explicitly.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
