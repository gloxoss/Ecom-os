# Task assignment

Use this template when a generated hub task prompt needs additional human-readable acceptance detail. Values are deliberate assignment fields, not completed evidence.

- Task ID and lane:
- Executor ID / tool:
- Orchestrator ID:
- Exact base SHA and implementation branch:
- Worktree absolute path:
- Authoritative hub root:
- Allowed repository-relative paths:
- Exclusive resources required:
- Dependencies / phase gate evidence:
- Source task / handoff section:
- Current implementation evidence and known user changes:
- Concrete before/after behavior:
- Business invariants affected:
- Acceptance conditions, with exact quantities/thresholds:
- Commands/checks to execute:
- Staging mutation scope and existing authorization:
- Evidence path:
- Compatibility / migration / rollback:
- Explicitly unresolved conditions:
- Stop/escalation condition:

Assign only after dependencies are met. The executor joins and claims this exact scope before editing. Completion requires an owned implementation commit and report. A distinct verifier checks that commit; only the orchestrator accepts. No implicit push, merge, deployment or paid operation.
