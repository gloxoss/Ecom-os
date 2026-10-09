# ECO-006 independent verification

## Identity and scope

- Date: 2026-10-09.
- Executor: `commerce-cleanup`, commerce lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `b61fcbac0c584b78a93b70e3b43be94d92a5645a`.
- Base: `3ec04e5b1c0096737723f7969c976d8522cecf3a`.
- Executor evidence: `docs/ecomos/evidence/ECO-006/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-006/verification.md`).

## Verdict

PASS for fail-closed production runtime configuration and FakeEngine rejection at commit `b61fcbac0c584b78a93b70e3b43be94d92a5645a`.

## Executed verification commands

1. `pnpm exec vitest run apps/storefront/src/__tests__/security/runtime-config.test.ts`
   - Exit: 0
   - Result: PASS (12/12 tests). Confirms:
     - Rejection of missing `ECOM_ENGINE` or setting to fake/vendure in production.
     - Enforcement of HTTPS without embedded credentials for REST and GraphQL URLs.
     - Mandatory non-empty REST credentials.
     - Mandatory 32+ character secrets for revalidation and session cookies.
     - Mandatory base64-encoded 32-byte encryption key.
2. `pnpm --filter storefront typecheck`
   - Exit: 0
   - Result: PASS.
3. `pnpm --filter @ecom-os/engine-woocommerce typecheck`
   - Exit: 0
   - Result: PASS.
