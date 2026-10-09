# Independent verification

## Identity and scope

- Task / executor:
- Verifier ID:
- Submitted implementation SHA:
- Exact SHA independently inspected:
- Inspection worktree / environment:
- Executor evidence path:
- Verification evidence path:

## Verdict

PASS, FAIL or INCONCLUSIVE, with a concrete reason. No application fixes were made during verification. A missing runtime, browser, service or permission is inconclusive for that condition, not a pass.

## Independent checks

Record exact commands actually executed, expected result, observed result and redacted evidence path. Check commit existence, changed-path ownership, task scope and repository state independently. Do not replay copied executor text as your own result.

## Acceptance and regressions

For each assigned condition, record pass/fail/inconclusive. Include direct disabled API calls, forged identity, precise canonical amounts, exact variations, ownership, retries or UI interaction when relevant. Screenshots alone do not prove backend behavior.

## Limitations

Identify untested integration paths, concurrent behavior, version/provider compatibility, browser/device limits, warnings and advisories. Explain whether an integration commit will need another gate.

## Required follow-up

Specify the defect or proof needed and route it to the orchestrator. Do not repair it in the verification worktree.

## Hub verdict

Record `verify TASK --ok|--fail|--inconclusive --commit SHA --evidence PATH --checks TEXT` against the same submitted commit. The orchestrator decides acceptance or another repair assignment.
