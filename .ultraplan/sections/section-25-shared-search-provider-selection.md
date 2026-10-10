# 25. Shared search provider selection

Phase 3. Lane: catalog. Risk: yellow. Canonical hub units: ECO-301.

## Outcome

One agreed public search contract and evidence-based provider choice serve shop and RFQ.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-301; requirements: REQ-ECO-301 -->

<task type="auto" id="25-01">
  <name>Specify reusable public search contract</name>
  <files>packages/ecom-engine/src/search.ts, packages/ecom-engine/src/__tests__/search-contract.test.ts</files>
  <action>Define search, suggestions, facets, index health, sync and fallback independent of storefront/RFQ. Specify safe public fields, unsupported capability and deterministic paging.</action>
  <verify>Consumers depend on the contract; unavailable external provider can fall back without leaking private data.</verify>
  <done>Specify reusable public search contract was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-301; requirements: REQ-ECO-301 -->

<task type="auto" id="25-02">
  <name>Compare representative search providers</name>
  <files>scripts/benchmark-search.ts, docs/ecomos/evidence/ECO-301/provider-decision.md</files>
  <action>Benchmark native Woo, Meilisearch and Typesense on the same catalog and record maintenance, licenses and cost. Agree measured latency/freshness budgets before installing or buying a selected external service.</action>
  <verify>A reproducible load profile, p95 measurements and source-supported tradeoffs justify the selected provider or native fallback.</verify>
  <done>Compare representative search providers was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-301; requirements: REQ-ECO-301 -->

<task type="checkpoint" id="25-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-301 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>One agreed public search contract and evidence-based provider choice serve shop and RFQ.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 14, 15, 16, 17, 18. Runtime hub phase prerequisites remain [1]. Resolve D-04 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-301 boundary", () => {
  it.todo("Consumers depend on the contract; unavailable external provider can fall back without leaking private data.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
