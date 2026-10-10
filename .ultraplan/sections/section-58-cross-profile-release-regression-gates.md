# 58. Cross profile release regression gates

Phase 9. Lane: platform. Risk: red. Canonical hub units: ECO-901.

## Outcome

Exact-commit CI and actual runtime/browser evidence cover buyer, merchant and addon on/off with agreed budgets.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-901; requirements: REQ-ECO-901 -->

<task type="auto" id="58-01">
  <name>Wire repeatable core and addon CI checks</name>
  <files>.github/workflows/ci.yml, package.json, docs/ecomos/release/CI_MATRIX.md</files>
  <action>Run deterministic guard/lint/typecheck/unit/build and common buyer/merchant/RFQ on/off suites on exact commits. Store redacted artifacts, tool versions and fixture identity, with real failing gates.</action>
  <verify>Injected security/commerce regression fails CI; accepted run links checkout SHA and outputs rather than claimed check text.</verify>
  <done>Wire repeatable core and addon CI checks was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-901; requirements: REQ-ECO-901 -->

<task type="auto" id="58-02">
  <name>Measure accessible performant release journeys</name>
  <files>apps/storefront/e2e/release.spec.ts, scripts/measure-storefront.ts, docs/ecomos/evidence/ECO-901/budgets.md</files>
  <action>Measure p95 journey/API performance and accessibility under a documented load/environment. Agree budgets from results instead of inheriting old Lighthouse/delivery claims; include actual CSP/hydration runtime smoke.</action>
  <verify>Agreed budgets and keyboard/core purchase checks pass on both profiles or release reports remain blocked.</verify>
  <done>Measure accessible performant release journeys was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-901; requirements: REQ-ECO-901 -->

<task type="checkpoint" id="58-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-901 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Exact-commit CI and actual runtime/browser evidence cover buyer, merchant and addon on/off with agreed budgets.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 51, 52, 53, 54, 55, 56, 57. Runtime hub phase prerequisites remain [8]. Resolve D-04 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-901 boundary", () => {
  it.todo("Injected security/commerce regression fails CI; accepted run links checkout SHA and outputs rather than claimed check text.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
