# ECO-401 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `runtime-cleanup`, experience lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `b83cfb9c6c14e0e9938d9a291c76ef009a793eeb`.
- Base: `18c8b1a02fec824817e3bb4331c6907c44a8b875`.
- Executor evidence: `docs/ecomos/evidence/ECO-401/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-401/verification.md`).

## Verdict

PASS for theme and brand configuration precedence resolution, layout slot definitions, CSS custom property generation, hex-to-HSL normalization, and build/runtime validation of critical configuration at commit `b83cfb9c6c14e0e9938d9a291c76ef009a793eeb`.

## Executed verification commands

1. Brand config & precedence test suite:
   - `node ./node_modules/vitest/vitest.mjs run packages/brand-config`
   - Exit: 0.
   - Result: 6 passed in 1 file (`precedence.test.ts`). Verified:
     - Accurate conversion of hex colors (`#ffffff`, `#000000`, `#aa631a`) to normalized HSL percentage strings.
     - Deterministic token resolution for two contrasting profiles (ParaLoca warm gold vs Aero Labs cool navy slate).
     - Theme override behavior preserving profile overrides while updating base styling.
     - Fallback to theme defaults when optional profile properties are omitted.
     - Valid CSS custom properties generation (`:root { ... }`).
     - Explicit rejection of missing or invalid critical fields (missing name, malformed email, missing logos) with `ConfigurationValidationError`.

2. Cross-package test suite:
   - `node ./node_modules/vitest/vitest.mjs run packages/brand-config apps/storefront/src/features/catalog apps/storefront/src/components/search packages/ecom-engine/src/search`
   - Exit: 0.
   - Result: 100 passed across 11 test files.

3. Brand Config TypeScript typecheck:
   - `node ./node_modules/typescript/bin/tsc -p packages/brand-config/tsconfig.json --noEmit`
   - Exit: 0.
   - Result: 0 errors.

4. Themes TypeScript typecheck:
   - `node ./node_modules/typescript/bin/tsc -p packages/themes/tsconfig.json --noEmit`
   - Exit: 0.
   - Result: 0 errors.

5. Git scope containment:
   - `git diff --stat 18c8b1a02fec824817e3bb4331c6907c44a8b875..b83cfb9c6c14e0e9938d9a291c76ef009a793eeb`
   - Result: Exactly 8 files modified/added, completely within claimed boundaries:
     - `packages/brand-config/` (6 files)
     - `packages/themes/` (1 file)
     - `docs/ecomos/evidence/ECO-401/report.md` (1 file)
   - Zero scope escape.

6. Invariant & Separation Assessment:
   - **Separation of Concerns**: Themes define presentation and layout slots only; commerce policies, tax rules, and backend engines remain strictly isolated from theme packages.
   - **Fail-Fast Configuration**: Critical configuration failures throw immediately at initialization/build time, preventing silent customer-facing errors.
