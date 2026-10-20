# PLAN-002: four-agent execution pack

Date: 2026-10-11. Scope: owner-requested documentation, task registration and startup prompts only.

## Result

Created .agent-hub/plans/stabilization-2026-10-11 with PLAN, COMMON, manifest, tracking/readiness rubric, read-only status/structural validation scripts, launch instructions and four startup prompts.

Registered 17 new OPEN canonical phase-9 tasks:
- Sprint A: ECO-1100 through ECO-1107, eight tasks.
- Sprint B: ECO-1201/1202/1203, ECO-1211/1212/1213, ECO-1204, seven tasks.
- Release preparation: ECO-1301/1302, two tasks.

Three implementers plus one coordinator/verifier, no extra implementation session. Start coordinator first. Separate exact-SHA review, task dependencies, held RFQ handoff, capacity, shared resources and source-safe recovery are explicit. Only Sprint A implementation is immediate; prepare B after acceptance. No production/deployment/destructive DB/new addon authorization added.

## Git and preservation

Assignment base: b8ae0601f217f1d7d8a224583340aee3fdc2ec0d on fix/ecomos-phase-0. Source commits continued to arrive during planning. No application files were changed by this task. Existing cart/catalog/product changes, RFQ state-machine harness and dirty wordpress-mcp were preserved.

git-index remains held by backend-par-1 under ECO-1006; a release/handoff message was sent through the hub, and no release was observed. This session does not steal the claim or stage/commit without it. Documentation is saved but not submitted as a committed task SHA. PLAN-002 will be marked PARTIAL, its document claim released and temporary executor left, so it cannot consume one of the four new worker slots.

Coordinator handoff: after the holder releases Git resources, assign a real available documentation executor the saved pack/evidence, pin its assignment base after provenance reconciliation, serialize its documentation commit and obtain distinct exact-SHA verification. Do not accept PLAN-002 from this uncommitted review alone. This planning-task follow-up is required before the overall phase-9 gate, not a reason to lose or discard these files.

## Executed validation

- node .agent-hub/plans/stabilization-2026-10-11/validate.mjs: PASS, 17 unique tasks, acyclic valid dependencies, four prompts, safe scopes/resources, no cross-owner overlap.
- node .agent-hub/plans/stabilization-2026-10-11/status.mjs: PASS, canonical tasks exist; A 0/8, B 0/7, release 0/2 independently accepted. These counts are not product-readiness percentages.
- node .agent-hub/hub.mjs check: PASS, claims do not expire automatically.
- Independent read-only planning reviewer checked actual pack and executed validator/status; found checkout dependency and maintained SEO/layout/client path corrections, which were applied. This is planning review, not runtime or committed exact-SHA certification.
- Earlier evolving-working-tree storefront tsc exit 0, Vitest 521 tests/62 files exit 0, import guard exit 0. They are advisory snapshots, not a clean pinned full baseline.
- Fresh full production build and complete integrated browser/PHP/security/recovery suite: NOT RUN by this documentation task, required in ECO-1100/1107 and later gates.

## Limits and next action

Observed 58/100 weighted readiness from the October 11 audit is not increased by writing a plan. Owner facts, checkout correctness, RFQ authorization, restore isolation and full cross-client release proof remain gated.

Launch Agent 4 with START_NOW.md. It handles genuine current-worker handoff, capacity, saved documentation commit/review and A0 activation. No destructive database operation or production service was touched.

