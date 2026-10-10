# 41. Authoritative addon off state registry

Phase 6. Lane: platform. Risk: red. Canonical hub units: ECO-602.

## Outcome

Disabled means inaccessible and inactive across frontend, backend, staff permissions and side effects.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-602; requirements: REQ-ECO-602 -->

<task type="auto" id="41-01">
  <name>Implement secure server capability registry</name>
  <files>packages/ecom-engine/src/addon-registry.ts, packages/ecom-engine/src/__tests__/addon-registry.test.ts, plugins/wp-epioso-capabilities/wp-epioso-capabilities.php</files>
  <action>Resolve enabled services server-side using compatible manifests and staff capabilities. Define frontend-safe projection and explicit unavailable/error states.</action>
  <verify>Unknown, disabled and mismatched addons never authorize routes/permissions even if a client flag is forged.</verify>
  <done>Implement secure server capability registry was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-602; requirements: REQ-ECO-602 -->

<task type="auto" id="41-02">
  <name>Guard addon routes and UI projection</name>
  <files>apps/storefront/src/lib/addon-capabilities.ts, apps/storefront/src/lib/addon-route-guard.ts, apps/storefront/src/__tests__/security/addon-off.test.ts</files>
  <action>Apply the authoritative registry to backend/API route checks as well as menus/slots. Disabled services perform no mail, background work or data writes.</action>
  <verify>Direct API, nav, admin and queued side-effect checks agree in on/off states.</verify>
  <done>Guard addon routes and UI projection was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-602; requirements: REQ-ECO-602 -->

<task type="checkpoint" id="41-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-602 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Disabled means inaccessible and inactive across frontend, backend, staff permissions and side effects.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 19, 20, 21, 22, 23, 24, 40. Runtime hub phase prerequisites remain [2]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-602 boundary", () => {
  it.todo("Unknown, disabled and mismatched addons never authorize routes/permissions even if a client flag is forged.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
