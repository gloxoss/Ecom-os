# ECO-406 Completion Report: Second Neutral Client Profile & Theming Proof

## Executive Summary

- **Task**: ECO-406 (Create a SECOND neutral example client with significantly different styling/catalog fixture to prove EcomOS is not ParaLoca-bound.)
- **Executor**: `runtime-cleanup`
- **Lane**: `experience`
- **Tool**: `codex`
- **Base Commit**: `2178bdd16712d08963bd58a145e8ef1d7ebf806b`
- **Status**: Implemented, verified with unit tests and typechecks, ready for independent verification.

---

## Changed Files & Architecture

All changes reside strictly within claimed file paths (`clients/demo-2`, `packages/themes`, `apps/storefront`, `docs/ecomos/evidence/ECO-406`):

1. [`clients/demo-2/profile.ts`](../../../clients/demo-2/profile.ts):
   - Defined `demo2Profile` for "Nordic Craft Supplies" conforming strictly to `ClientProfileSchema`.
   - Distinct industry (`general_retail` workshop outillage and raw materials).
   - Enforces Phase 4 invariant: `customerAccounts: false`.
   - Complete decoupled environment URLs (`wooCommerceUrl`, `wordpressUrl`, `storefrontUrl`, `cdnUrl`).
   - Clean brand colors (slate and sky blue) and sharp radii (`0.25rem` / `4px`).
   - Slots configured to `minimal` header/hero, `3-column` product grid, `dropdown` variant selector, and `simple` footer.

2. [`clients/demo-2/catalog-fixture.json`](../../../clients/demo-2/catalog-fixture.json):
   - Domain-independent catalog fixture containing woodcraft chisels, raw linen textiles, brass calipers, and ceramic clays.
   - Conforms strictly to EcomOS product and category interfaces.

3. [`clients/demo-2/README.md`](../../../clients/demo-2/README.md):
   - Documentation explaining the profile architecture and contrast matrix against ParaLoca.

4. [`packages/themes/src/clients/demo-2/theme.ts`](../../../packages/themes/src/clients/demo-2/theme.ts):
   - Registered `demo2Theme: EcomTheme` with tokens (`colors`, `radius`, `radii`, `slots`, `fontSans`).
   - Exported in [`packages/themes/src/index.ts`](../../../packages/themes/src/index.ts) under `themeRegistry['demo-2']`.

5. [`packages/themes/src/clients/demo-2/__tests__/theme.test.ts`](../../../packages/themes/src/clients/demo-2/__tests__/theme.test.ts) (4 tests):
   - Confirms `demo-2` theme is registered in `themeRegistry` and resolved by `getTheme`.
   - Confirms layout slot overrides (`minimal` header/hero, `3-column` grid, `dropdown` variants, `simple` footer).
   - Confirms sharp radius and color contrast against `angelinaTheme`.
   - Validates `demo2Profile` against `ClientProfileSchema` and verifies `customerAccounts: false` and `toPublicClientProfile` URL scrubbing.

6. [`apps/storefront/e2e/profile-reuse.spec.ts`](../../../apps/storefront/e2e/profile-reuse.spec.ts):
   - Playwright test asserting presentation decoupling and checkout payload consistency across themes.

7. [`docs/ecomos/evidence/ECO-406/reuse.md`](../../../docs/ecomos/evidence/ECO-406/reuse.md):
   - Architectural comparison matrix proving the identical commerce core powers both clients without application modifications.

---

## Verification Commands & Observed Results

1. **Theme and Profile Tests**:
   ```bash
   node ./node_modules/vitest/vitest.mjs run packages/themes/src/clients/demo-2/__tests__/theme.test.ts
   ```
   - **Result**: `1 passed (1)` test file, `4 passed (4)` tests.

2. **Cross-Package Storefront & Theme Tests**:
   ```bash
   node ./node_modules/vitest/vitest.mjs run apps/storefront/src/lib/seo apps/storefront/src/features/catalog packages/themes
   ```
   - **Result**: `6 passed (6)` test files, `42 passed (42)` tests.

3. **TypeScript Typecheck**:
   ```bash
   node ./node_modules/typescript/bin/tsc -p apps/storefront/tsconfig.json --noEmit
   node ./node_modules/typescript/bin/tsc -p packages/themes/tsconfig.json --noEmit
   ```
   - **Result**: `0 errors`.

---

## Architectural Invariants Adherence

- **ParaLoca Decoupling**: EcomOS runs with zero hardcoded assumptions about ParaLoca's luxury tea and pastry domain.
- **Invariants Preservation**: Customer accounts remain strictly disabled across all client profiles in Phase 4.
- **Tokens and Slots Boundary**: The presentation layer is modulated solely through CSS custom properties and layout slots without requiring forks of the commerce core.
