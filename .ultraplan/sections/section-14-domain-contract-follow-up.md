# 14. Domain contract follow-up

Phase 1. Lane: catalog. Risk: yellow. Canonical hub units: ECO-101.

## Outcome

Typed specification remains accepted; dependent runtime invariants have meaningful negative tests. This is a follow-up, not a silent revocation of ECO-101.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-101; requirements: REQ-ECO-101, REQ-AUDIT -->

<task type="auto" id="14-01">
  <name>Specify canonical catalog alias rules</name>
  <files>packages/ecom-engine/src/types.ts, packages/ecom-engine/src/__tests__/contracts.test.ts</files>
  <action>Keep the accepted generic type surface. Specify canonical variations, inventory, category identity, variable display-price semantics and brand cardinality; derive compatibility aliases from one normalized value.</action>
  <verify>Test inconsistent aliases, unknown quantity, fractional or unsafe money and variable ranges at their normalization boundary.</verify>
  <done>Specify canonical catalog alias rules was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-101; requirements: REQ-ECO-101, REQ-AUDIT -->

<task type="auto" id="14-02">
  <name>Replace vacuous neutrality coverage checks</name>
  <files>packages/ecom-engine/src/__tests__/contracts.test.ts, scripts/check-engine-imports.test.mjs</files>
  <action>Replace assertions on fixture keys with real source-boundary or mapper checks. Use neutral fixtures and distinguish typed examples from runtime validation.</action>
  <verify>A deliberately introduced client business field/import must fail the appropriate guard; ordinary industry-specific client fixtures remain allowed.</verify>
  <done>Replace vacuous neutrality coverage checks was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-101; requirements: REQ-ECO-101, REQ-AUDIT -->

<task type="checkpoint" id="14-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-101 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Typed specification remains accepted; dependent runtime invariants have meaningful negative tests. This is a follow-up, not a silent revocation of ECO-101.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 13. Runtime hub phase prerequisites remain [0]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-101 boundary", () => {
  it.todo("Test inconsistent aliases, unknown quantity, fractional or unsafe money and variable ranges at their normalization boundary.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
