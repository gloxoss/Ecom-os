# 40. Versioned addon compatibility manifests

Phase 6. Lane: platform. Risk: yellow. Canonical hub units: ECO-601.

## Outcome

One versioned manifest controls compatibility rather than scattered unchecked flags.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-601; requirements: REQ-ECO-601 -->

<task type="auto" id="40-01">
  <name>Define typed addon manifest schema</name>
  <files>packages/ecom-engine/src/addons.ts, packages/ecom-engine/src/addon-manifest.ts, packages/ecom-engine/src/__tests__/addon-manifest.test.ts</files>
  <action>Define id/version/API compatibility, dependencies, capabilities, config schema, routes/UI/admin slots, PHP module, migrations and tests. Keep paid-license billing separate from enablement.</action>
  <verify>Missing dependencies, incompatible versions and invalid configuration are rejected deterministically.</verify>
  <done>Define typed addon manifest schema was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-601; requirements: REQ-ECO-601 -->

<task type="auto" id="40-02">
  <name>Validate manifests during addon generation</name>
  <files>scripts/generate-addons.ts, scripts/generate-addons.test.mjs, plugins/dummy-addon/index.ts</files>
  <action>Validate existing addons through the manifest before generating registration. Preserve current seams and produce explicit diagnostics rather than broken imports.</action>
  <verify>Compatible exemplar generates reproducibly; malformed/incompatible addon cannot silently activate.</verify>
  <done>Validate manifests during addon generation was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-601; requirements: REQ-ECO-601 -->

<task type="checkpoint" id="40-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-601 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>One versioned manifest controls compatibility rather than scattered unchecked flags.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 19, 20, 21, 22, 23, 24. Runtime hub phase prerequisites remain [2]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-601 boundary", () => {
  it.todo("Missing dependencies, incompatible versions and invalid configuration are rejected deterministically.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
