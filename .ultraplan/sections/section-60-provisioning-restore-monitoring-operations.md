# 60. Provisioning restore monitoring operations

Phase 9. Lane: platform. Risk: red. Canonical hub units: ECO-903.

## Outcome

Independent provisioning, tested restore/rollback and actionable safe monitoring are demonstrated.

## Before execution

Use the current owner handoff and hub assignment, not legacy section instructions. Claim exact files and required resources before editing; inspect current source, since proposed new paths may need a bounded reassignment to the existing module. No task grants staging mutation, paid installation, production or messaging authorization. Each automatic slice is one reviewable commit of at most three implementation/test files; submit redacted task evidence separately.

## Tasks

<!-- Hub: ECO-903; requirements: REQ-ECO-903 -->

<task type="auto" id="60-01">
  <name>Validate independent client provisioning contract</name>
  <files>packages/cli/src/commands/provision.ts, packages/cli/src/commands/provision.test.ts, docs/ecomos/operations/PROVISION.md</files>
  <action>Provision/check independent client WP/DB/secrets and version-locked profile/environment contracts. Fail missing configuration without fake fallback; never copy production credentials into template code.</action>
  <verify>Two client configurations validate independently; absent secrets/migrations fail actionable preflight checks.</verify>
  <done>Validate independent client provisioning contract was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-903; requirements: REQ-ECO-903 -->

<task type="auto" id="60-02">
  <name>Exercise backup restore and release rollback</name>
  <files>docs/ecomos/operations/RESTORE.md, scripts/verify-restore.ts, docs/ecomos/evidence/ECO-903/restore.md</files>
  <action>Back up isolated state and rehearse restore/rollback including addon migrations and order integrity. Verify resolved targets and approvals before any destructive operation.</action>
  <verify>Restored database/files/version reproduce known fixtures and recorded rollback succeeds.</verify>
  <done>Exercise backup restore and release rollback was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-903; requirements: REQ-ECO-903 -->

<task type="auto" id="60-03">
  <name>Implement scoped transaction health alerts</name>
  <files>apps/storefront/src/app/api/health/route.ts, apps/storefront/src/lib/commerce/observability.ts, apps/storefront/src/__tests__/security/health.test.ts</files>
  <action>Expose minimal safe health and alert durable transaction errors without leaking private payloads/tokens. Define runbook ownership and verify the selected alert sink only after explicit sending configuration/authorization.</action>
  <verify>Simulated failed/pending transactions surface actionable redacted alerts; public health reveals no secrets/customer data.</verify>
  <done>Implement scoped transaction health alerts was completed and its scoped verification recorded.</done>
</task>

<!-- Hub: ECO-903; requirements: REQ-ECO-903 -->

<task type="checkpoint" id="60-04">
  <name>Verify scoped integrated acceptance evidence</name>
  <files>none</files>
  <action>Verify ECO-903 at its submitted exact SHA in an independent clean inspection checkout and check the section outcome against actual evidence. Record incomplete/blocked results truthfully; orchestrator acceptance and phase gate require all canonical prerequisites, and a passing section checkpoint does not waive other phase units.</action>
  <verify>Independent provisioning, tested restore/rollback and actionable safe monitoring are demonstrated.</verify>
  <done>Verify scoped integrated acceptance evidence was completed and its scoped verification recorded.</done>
</task>

## Regression design

Write meaningful failing boundary tests before repair where possible. Do not write tests that only assert a value supplied by their own literal fixture. Unit/mock proof, backend transactions, browser execution and operational restore are separate evidence classes. Never count a draft order ID, build success or screenshot as full purchase proof.

## Evidence and rollback

Record tested checkout SHA/path, tool versions, exact command results, fixture IDs and what was not run. Verifier must independently check the submitted SHA in a clean/detached inspection checkout. Revert only the owned slice; staging fixtures/migrations require their documented namespace backup/restore. Preserve other agents' changes and protected submodule. Final checkpoint is not automatically passed because its parent task was historically accepted.

## Dependencies and decisions

Hard section dependencies: 51, 52, 53, 54, 55, 56, 57. Runtime hub phase prerequisites remain [8]. No new owner decision is required for authorized local work in this scope.

## TDD stub, design only

Start the slice's listed regression file with this intent, then replace each todo with real boundary assertions before acceptance. These stubs are planning examples, not passing tests.

```ts
describe("ECO-903 boundary", () => {
  it.todo("Two client configurations validate independently; absent secrets/migrations fail actionable preflight checks.");
  it.todo("Reject invalid, unavailable or unauthorized input without false success");
});
```
