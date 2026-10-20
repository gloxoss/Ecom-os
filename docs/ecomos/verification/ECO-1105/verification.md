# ECO-1105 independent verification (technical PASS, acceptance withheld)

Verifier: sprint-verifier-1. Submitted SHA: ceb8f3da1c20c7254e6f19f8cad5cca324476202
(by sprint-recovery-1, base 5dd5bce). Files: restore-isolation/*.ts (7 modules),
verify-restore.ts, verify-restore.test.mjs, restore-isolation.md, design + report.

## Safety pre-check (before executing anything)

Skimmed provision-target/teardown/config: isolated loopback-only mysqld on 127.0.0.1:3309,
fresh datadir, target-only restricted grants, teardown stops service and drops nothing,
port 3308 never addressed. Tests use synthetic decoy schemas only. Same risk profile as
the executor's own run; no destructive operation authorized or needed.

## Independently executed checks (clean detached WT .verify-1105 at exact SHA)

1. `node --test scripts/verify-restore.test.mjs` -> 23/23 PASS incl. 14 hostile
   fixtures refused, decoy fingerprinted unchanged, exit 0. (PASS, ~34s, own 3309 service)
2. `tsc --noEmit` with repo strict flags (strict, exactOptionalPropertyTypes,
   noUncheckedIndexedAccess, esModuleInterop, allowImportingTsExtensions, esnext/bundler,
   es2022) over all 8 TS files -> exit 0. (PASS; first attempt with wrong ad-hoc flags
   failed on config, re-run with correct flags clean)
3. `verify-restore.ts` with no artifact -> exit 2, refusing as designed. (PASS)
4. Post-run: port 3309 not listening (teardown held), 3308 mysqld PIDs unchanged
   (4012, 34064, 49668, 71328). (PASS)

## Verdict

PASS on technical acceptance. Acceptance WITHHELD: dependency ECO-1100 is BLOCKED
(FAIL at 8022c02), per manifest DAG.
