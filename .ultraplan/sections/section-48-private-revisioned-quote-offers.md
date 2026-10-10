# 48. Private revisioned quote offers

Phase 7. Lane: commerce. Risk: red. Canonical hub units: ECO-705.

## Outcome

Staff offer, protected PDF/mail and guest responses preserve ownership, immutable revisions and expiration.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-705; requirements: REQ-ECO-705 -->

<task type="auto" id="48-01">
  <name>Create capability guarded staff offer revisions</name>
  <files>plugins/wp-ecomos-rfq/offers.php, plugins/wp-ecomos-rfq/tests/offers.test.php, packages/addons-rfq/src/offer.ts</files>
  <action>Staff creates immutable server-priced lines/tax and expiration using verified identities and permissions. Old offers cannot be modified or accepted after replacement.</action>
  <verify>Reprice/revise/expire cases retain history; stale or tampered revision cannot transition to accepted.</verify>
  <done>Create capability guarded staff offer revisions was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-705; requirements: REQ-ECO-705 -->

<task type="auto" id="48-02">
  <name>Protect offer PDF and notification delivery</name>
  <files>plugins/wp-ecomos-rfq/documents.php, plugins/wp-ecomos-rfq/notifications.php, plugins/wp-ecomos-rfq/tests/documents.test.php</files>
  <action>Generate safe offer PDF from approved fields and expose it only through authenticated staff or verified guest ownership. Queue transactional notifications durably with mail-sink tests and no duplicate sends.</action>
  <verify>Copied/expired download access fails; malicious text cannot inject output and retries send one notification per event.</verify>
  <done>Protect offer PDF and notification delivery was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-705; requirements: REQ-ECO-705 -->

<task type="auto" id="48-03">
  <name>Render guest offer review response</name>
  <files>apps/storefront/src/features/rfq/ui/offer-review.tsx, apps/storefront/src/app/api/rfq/offers/route.ts, apps/storefront/e2e/quote-offer.spec.ts</files>
  <action>Allow verified guest accept/reject/revision request through owned versioned endpoints. Display expiration and current revision honestly without promising automatic inventory reservation.</action>
  <verify>Verified guest responds; wrong guest, expired offer and older revision acceptance are denied.</verify>
  <done>Render guest offer review response was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-705; requirements: REQ-ECO-705 -->

<task type="checkpoint" id="48-04">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-705 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Staff offer, protected PDF/mail and guest responses preserve ownership, immutable revisions and expiration.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 25, 26, 27, 28, 29, 40, 41, 42, 43, 46. Runtime hub phase prerequisites remain [3,6]. Resolve D-03 before its affected activation, not before unrelated local work.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-705 boundary", () => {
  it.todo("Reprice/revise/expire cases retain history; stale or tampered revision cannot transition to accepted.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
