# 31. Validated client capability manifest

Phase 4. Lane: platform. Risk: yellow. Canonical hub units: ECO-402.

## Outcome

A validated profile controls presentation/capabilities while server permissions stay authoritative.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-402; requirements: REQ-ECO-402 -->

<task type="auto" id="31-01">
  <name>Validate independent client profile manifests</name>
  <files>packages/brand-config/src/client-profile.ts, packages/brand-config/src/client-profile.test.ts</files>
  <action>Define per-client capabilities, allowed country/payment/shipping configuration and optional industry metadata. Keep environment URLs/secrets separate and require independent deployment/WP/DB ownership.</action>
  <verify>Malformed capabilities fail; unknown fields and missing critical configuration cannot enable unsafe services.</verify>
  <done>Validate independent client profile manifests was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-402; requirements: REQ-ECO-402 -->

<task type="auto" id="31-02">
  <name>Load profiles at application boundary</name>
  <files>apps/storefront/src/lib/client-profile.ts, apps/storefront/src/lib/runtime-config.ts, apps/storefront/src/__tests__/security/client-profile.test.ts</files>
  <action>Load the validated profile with explicit precedence and server-only environment settings. Project only public capabilities to clients and retain disabled account/gateway boundaries.</action>
  <verify>Public payload has no secrets; profile flags alone cannot bypass backend capability or certification checks.</verify>
  <done>Load profiles at application boundary was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-402; requirements: REQ-ECO-402 -->

<task type="checkpoint" id="31-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-402 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>A validated profile controls presentation/capabilities while server permissions stay authoritative.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30. Runtime hub phase prerequisites remain [1,2,3]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-402 boundary", () => {
  it.todo("Malformed capabilities fail; unknown fields and missing critical configuration cannot enable unsafe services.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
