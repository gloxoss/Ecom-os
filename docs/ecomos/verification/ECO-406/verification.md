# ECO-406 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `runtime-cleanup`, experience lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `f102ab191a16950fa75ebe5d18ba2cd027171def`.
- Base: `2178bdd16712d08963bd58a145e8ef1d7ebf806b`.
- Executor evidence: `docs/ecomos/evidence/ECO-406/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-406/verification.md`).

## Verdict

PASS for second neutral client profile ("Nordic Craft Supplies", `demo-2`), theme token registration, layout slot orchestration, domain-independent catalog fixture, and commerce engine multi-tenancy reuse proof at commit `f102ab191a16950fa75ebe5d18ba2cd027171def`.

## Executed verification commands

1. Cross-package test suite:
   - `node ./node_modules/vitest/vitest.mjs run apps/storefront/src/features/brand apps/storefront/src/lib/seo apps/storefront/src/features/catalog apps/storefront/src/features/content packages/themes`
   - Exit: 0.
   - Result: 45 passed across 7 test files.
   - Verified:
     - `demo2Profile` validates strictly against `ClientProfileSchema`.
     - Invariant enforcement: customer accounts stay disabled (`customerAccounts = false`), preventing unauthorized customer registration.
     - Public client profile projection (`toPublicClientProfile`): internal backend URLs (`wooCommerceUrl`, `wordpressUrl`) are scrubbed before client transmission.
     - `demo2Theme` is registered in `themeRegistry` and resolves via `getTheme('demo-2')`.
     - Layout slot configuration (`minimal` header, `minimal` hero, `3-column` product grid, `dropdown` variant selector, `simple` footer) differs cleanly from Angelina luxury presets without altering commerce models.
     - Token variance: sharp radii (`0.25rem` / `4px`) and slate colors contrast completely with Angelina's soft ivory/burgundy tokens.

2. TypeScript compile verification:
   - `node ./node_modules/typescript/bin/tsc -p packages/themes/tsconfig.json --noEmit` -> Exit: 0.
   - `node ./node_modules/typescript/bin/tsc -p apps/storefront/tsconfig.json --noEmit` -> Exit: 0.
   - Result: 0 errors across packages.

3. Git scope containment:
   - `git diff --stat 2178bdd16712d08963bd58a145e8ef1d7ebf806b..f102ab191a16950fa75ebe5d18ba2cd027171def`
   - Result: Exactly 10 files modified/added in commit `f102ab191a16950fa75ebe5d18ba2cd027171def`:
     - `apps/storefront/e2e/profile-reuse.spec.ts`
     - `apps/storefront/src/features/brand/__tests__/demo-2-profile.test.ts`
     - `clients/demo-2/README.md`
     - `clients/demo-2/catalog-fixture.json`
     - `clients/demo-2/profile.ts`
     - `docs/ecomos/evidence/ECO-406/report.md`
     - `docs/ecomos/evidence/ECO-406/reuse.md`
     - `packages/themes/src/clients/demo-2/__tests__/theme.test.ts`
     - `packages/themes/src/clients/demo-2/theme.ts`
     - `packages/themes/src/index.ts`
   - All files are within claimed boundaries (`clients/demo-2`, `packages/themes`, `apps/storefront`, `docs/ecomos/evidence/ECO-406`). Zero scope escape.

4. Invariant & Separation Assessment:
   - **ParaLoca Decoupling**: EcomOS operates without hardcoded dependence on ParaLoca or luxury food services.
   - **Unified Commerce Core**: Both profiles use the identical cart totals, guest checkout, tax, and order access logic.
   - **Presentation / Engine Boundary**: Theming changes are confined to CSS custom properties and layout slot dispatchers.
