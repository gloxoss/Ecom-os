# ECO-402 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `runtime-cleanup`, experience lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `151e956a74e5291e14e2c9339d47bdd0b65849c9`.
- Base: `c0f66dc5527720fe9372f8c147957e0bfe48ddf8`.
- Executor evidence: `docs/ecomos/evidence/ECO-402/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-402/verification.md`).

## Verdict

PASS for ClientProfile manifest and schema validation, capability flags, shipping/payment method boundaries, industry metadata compliance, environment URL decoupling, and safe public client profile projection at commit `151e956a74e5291e14e2c9339d47bdd0b65849c9`.

## Executed verification commands

1. Brand config unit and contract test suite:
   - `npx vitest --run packages/brand-config`
   - Exit: 0.
   - Result: 27 passed in 2 files (`client-profile.test.ts` 21 tests, `precedence.test.ts` 6 tests). Verified:
     - Complete manifest validation for compliant client profiles (tested with ParaLoca pharmaceutical profile fixture).
     - Strict capability boundaries: customer accounts are strictly disabled (`customerAccounts: false`), unknown/arbitrary capability keys rejected via `.strict()`.
     - Certified payment method boundaries: only certified `'cod'` accepted; uncertified payment methods (`stripe`, `cmi`) strictly rejected.
     - Commerce country and shipping rules: ISO 2-letter uppercase validation, non-empty allowed countries, default country membership validation, default shipping method membership validation.
     - Industry metadata: pharmaceutical and retail enums, cross-field validation requiring `minimumAge > 0` when `requiresAgeVerification: true`.
     - Environment URL decoupling: valid HTTP/HTTPS URLs, strict rejection of embedded credentials/secrets, protocol enforcement, runtime environment overrides (`envOverrides`), standard environment variable mapping (`resolveEnvironmentUrlsFromEnv`).
     - Public client profile projection (`toPublicClientProfile`): verified that internal backend URLs (`wooCommerceUrl`, `wordpressUrl`, `searchUrl`) are completely stripped from client payloads, while public presentation URLs (`cdnUrl`, `storefrontUrl`), brand tokens, and regulatory disclaimers are preserved.
     - Malformed inputs and edge cases: rejection of non-object manifests and malformed slug IDs.

2. Brand Config TypeScript typecheck:
   - `npx tsc -p packages/brand-config/tsconfig.json --noEmit`
   - Exit: 0.
   - Result: 0 errors.

3. Git scope containment:
   - `git diff --stat c0f66dc5527720fe9372f8c147957e0bfe48ddf8..151e956a74e5291e14e2c9339d47bdd0b65849c9`
   - Result: Exactly 5 files modified/added, completely within claimed boundaries:
     - `packages/brand-config/index.ts`
     - `packages/brand-config/src/schema.ts`
     - `packages/brand-config/src/client-profile.ts`
     - `packages/brand-config/src/client-profile.test.ts`
     - `docs/ecomos/evidence/ECO-402/report.md`
   - Zero scope escape.

4. Invariant & Separation Assessment:
   - **Separation of Capabilities and Server Authority**: The client profile defines presentation and client-side capability toggles, but backend authority (WooCommerce for inventory, prices, guest orders) remains strictly sovereign. Flags alone cannot bypass backend checks.
   - **Credential Separation**: Secrets and API keys are strictly forbidden in client profile manifests. Environment URLs are validated for protocol safety and credential absence.
   - **Safe Public Projection**: Client-facing components receive only safe public projections without internal server topology disclosures.
