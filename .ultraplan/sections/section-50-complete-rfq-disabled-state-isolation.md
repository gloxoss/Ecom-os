# 50. Complete RFQ disabled state isolation

Phase 7. Lane: platform. Risk: red. Canonical hub units: ECO-707.

## Outcome

RFQ off-state is complete across UI, API, permissions and side effects; normal cart remains independent.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-707; requirements: REQ-ECO-707 -->

<task type="auto" id="50-01">
  <name>Close disabled quote routes and side effects</name>
  <files>plugins/wp-ecomos-rfq/routes.php, plugins/wp-ecomos-rfq/notifications.php, apps/storefront/src/lib/addon-route-guard.ts</files>
  <action>Enforce registry off-state at RFQ API, staff capabilities and background notification/conversion entry points. Remove route/menu/CTA through the same authoritative capability projection.</action>
  <verify>Direct API and queued tasks cannot execute while off; enabling restores only explicitly permitted behavior.</verify>
  <done>Close disabled quote routes and side effects was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-707; requirements: REQ-ECO-707 -->

<task type="auto" id="50-02">
  <name>Verify buy and quote isolation matrix</name>
  <files>apps/storefront/e2e/rfq-off.spec.ts, plugins/wp-ecomos-rfq/tests/off-state.test.php</files>
  <action>Run RFQ enabled and disabled against normal guest purchase, retained quote data and forbidden routes. Confirm quote basket operations never mutate the normal Woo cart.</action>
  <verify>Core purchase passes both profiles; off-state has no route/nav/API privilege/mail/background writes.</verify>
  <done>Verify buy and quote isolation matrix was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-707; requirements: REQ-ECO-707 -->

<task type="checkpoint" id="50-03">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-707 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>RFQ off-state is complete across UI, API, permissions and side effects; normal cart remains independent.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 25, 26, 27, 28, 29, 40, 41, 42, 43, 45, 46, 47, 48, 49. Runtime hub phase prerequisites remain [3,6]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-707 boundary", () => {
  it.todo("Direct API and queued tasks cannot execute while off; enabling restores only explicitly permitted behavior.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
