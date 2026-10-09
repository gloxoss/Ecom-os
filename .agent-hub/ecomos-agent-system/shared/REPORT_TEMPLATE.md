# Executor report

## Identity

- Task / lane / executor:
- Base SHA:
- Implementation SHA:
- Branch / worktree:
- Claimed files and resources:
- Evidence date and environment:

## Result

State the concrete behavior implemented and remaining limits. Separate PASS, FAIL, BLOCKED and NOT RUN. Do not use a percentage or a phase-complete claim without the underlying accepted criteria.

## Changed behavior and files

Describe the problem, the new behavior, contract compatibility and file paths. Distinguish reused working code from retired/replaced code.

## Acceptance evidence

For each assigned condition, give the exact check, executed command, result, environment and safe output/report path. Include representative regression/failure cases. State which browser, API, WP/PHP, security, retry or concurrent cases were not proved.

## Business integrity

Explain guest account independence, Woo authoritative amounts/status, exact variation identity, addon off-state, client/core boundaries and staff capability checks where affected. Mark a condition not applicable only with a reason.

## Staging changes and rollback

List synthetic fixtures, schema/plugin/settings changes and existing authorization, if any. Describe rollback and whether restore was tested. Do not copy secrets or private backups.

## Risks and remaining work

List unresolved advisories, warnings, integration limits and dependencies. Give the next concrete action or verifier reproduction steps.

## Hub handoff

Use `done TASK --commit SHA --evidence PATH --summary TEXT --checks TEXT` after claiming/staging the exact owned changes. The report is supporting evidence; REVIEW still requires independent verification and orchestration acceptance.

If progress was marked PARTIAL or BLOCKED while the claim remains held, use `progress TASK --resume --note TEXT` before submission. A released task needs a fresh claim. On a shared branch, list inherited commits already submitted by other tasks separately from your own commits; your exact new tip and all own changed paths remain subject to scope checks.
