# EcomOS agent operating kit

Use one starter per independent session. The orchestrator supplies a bounded task assignment; role lane descriptions do not authorize unrestricted edits.

## Roles

- [Orchestrator START](orchestrator/START.md): plan, assign, coordinate gates, inspect evidence and accept.
- [Agent A START](agent-a/START.md): catalog, variations, taxonomy and search.
- [Agent B START](agent-b/START.md): guest commerce and security.
- [Agent C START](agent-c/START.md): experience, themes, CMS and i18n.
- [Agent D START](agent-d/START.md): tooling, WordPress, admin and addon infrastructure.
- [Verifier START](agent-5-verifier/START.md): independent execution against an exact commit.

Four implementation lanes plus a verifier are five responsibilities, not five concurrent processes. At most four executor/verifier registrations may be active; obey a lower provider/machine ceiling and reserve capacity for verification.

## Assignment and evidence

[ASSIGNMENT_TEMPLATE](shared/TASK_ASSIGNMENT_TEMPLATE.md) captures exact task, worktree/base SHA, allowed paths, resources, dependencies, business conditions and acceptance.

[REPORT_TEMPLATE](shared/REPORT_TEMPLATE.md) captures the executor's proof. [VERIFICATION_TEMPLATE](shared/VERIFICATION_TEMPLATE.md) captures independent verdicts. Generated `prompt TASK` includes the assignment and entrypoint context; these starters remain usable when a task has not yet been assigned.

Each implementation task has a redacted executor package and separate writable verifier package:

```text
docs/ecomos/evidence/TASK-ID/
  report.md
  checks/
  screenshots/
docs/ecomos/verification/TASK-ID/
  report.md
  checks/
  screenshots/
```

Create checks/screenshots only when required by the change. Evidence folders are not the source of product truth.

## Shared business guidance

Read the root hub [shared context](../shared/PROJECT_CONTEXT.md), [business rules](../shared/BUSINESS_RULES.md), [contracts](../shared/CONTRACTS.md), [roadmap gates](../shared/ROADMAP.md) and [decisions](../shared/DECISIONS.md). [PROTOCOL](../PROTOCOL.md) defines the enforced state machine and command use.

Unlike the source examples, this EcomOS kit has no automatic push or live release. Old claims/commits and historical staging reports require current independent checks before acceptance.
