# ECO-007 independent verification

## Identity and scope

- Date: 2026-10-09.
- Executor: `runtime-cleanup`, experience lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `1800a11a137c2db86cd9d55999e11310693cfd68`.
- Base: `d8fee8c51f7c6b58460e81592b78b555ef61a2f1`.
- Executor evidence: `docs/ecomos/evidence/ECO-007/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-007/verification.md`).

## Verdict

PASS for CSP header containment, dotted account route rejection, private revalidation headers, and automated production runtime verification at commit `1800a11a137c2db86cd9d55999e11310693cfd68`.

## Executed verification commands

1. `pnpm exec tsx --tsconfig apps/storefront/tsconfig.json scripts/verify-production-runtime.mjs`
   - Exit: 0
   - Checks:
     - Matcher excludes `.css`, `.js`, `.png` assets while matching dotted document/page paths.
     - Production CSP includes `strict-dynamic`, frame-ancestors none, nosniff, DENY, and request nonce matching.
     - Nonces are isolated per request.
     - Account paths (`/account`, `/fr/account`, `/account.html`, `/en/account.html`, `/account.json`) return 404 with `no-store`.
     - Revalidate route returns `Cache-Control: no-store, private` across all statuses (503, 401, 200).
     - Fail-closed production configuration verified.
2. `pnpm run verify`
   - Exit: 0
   - Architecture guard (13/13 PASS), lint (0 errors, 18 warnings), typecheck PASS, 112 Vitest tests PASS across 15 files, and 15 hub tests PASS.
3. `git diff --stat d8fee8c51f7c6b58460e81592b78b555ef61a2f1 1800a11a137c2db86cd9d55999e11310693cfd68`
   - Result: Exactly 6 files modified within claimed scope.

