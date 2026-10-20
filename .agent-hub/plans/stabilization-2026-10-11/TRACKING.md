# Follow the execution and readiness

The canonical hub is the only live task board. These scripts read it; they store no second state.

From Ecom-os:

```powershell
node .agent-hub/plans/stabilization-2026-10-11/validate.mjs
node .agent-hub/plans/stabilization-2026-10-11/status.mjs
node .agent-hub/hub.mjs check
```

Stages: Sprint A has 8 tasks, Sprint B has 7, release preparation has 2. A task counts complete only when independently ACCEPTED. These are execution counts, not percent of application readiness. Adding corrective tasks does not erase historical product progress.

A0, A1, A2 are scheduling labels under existing numeric hub phase 9. The coordinator checks manifest dependencies and handoffs manually; the CLI does not implement these task-level dependencies.

## Readiness rubric

Retain the October 11 audit's disclosed weights so future estimates are comparable:
- Foundation/reproducibility/containment: 15 points, baseline credit 12.
- Catalog/discovery: 15, baseline 9.
- Guest purchase/owned order access: 20, baseline 12.
- Themes/CMS/client experience: 15, baseline 10.
- Merchant operations: 10, baseline 5.
- Addons/RFQ: 10, baseline 5.
- Independent client/operations: 10, baseline 4.
- Approved content/release acceptance: 5, baseline 1.

Historical sum: 58/100 assessment points, reasonably described as about 60% with a 55-65% judgment range. This is not measured code completion, effort remaining or current certification.

At ECO-1107, ECO-1204 and ECO-1302, report each category's new credit with dated exact-SHA proof and limits. No automatic percentage increments. Full credit requires demonstrated original acceptance, not one passing mock or a historical task label. Also report core, RFQ and ParaLoca independently, and list evidence coverage.

Any checkout correctness, RFQ authorization or source-database safety failure blocks stabilization acceptance. Any unresolved critical security/correctness, merchant facts, two-client or release proof blocks release regardless of numerical score.

## Daily owner update

Use five short facts: pinned SHA; accepted work and actual proof; current A/B/R gate; remaining blocker and owner action if required; next assigned task. Link the detailed evidence rather than pasting logs.

Do not certify production readiness from local test environments. A local release packet remains separate from explicit operator launch approval.

