# ECO-601: Versioned Addon Compatibility Manifest Specification and Validation

## Summary
Implemented the canonical typed addon manifest contract (`AddonManifest`), schema validator (`validateAddonManifest`), semver compatibility checker (`checkAddonCompatibility`), and updated the addon generator (`scripts/generate-addons.ts`) to enforce compatibility and dependency resolution before generating runtime code.

## Scope & Claimed Paths
- `packages/ecom-engine/src/` (including `addon-manifest.ts`, `addons.ts`, `__tests__/addon-manifest.test.ts`)
- `scripts/` (including `generate-addons.ts`, `generate-addons.test.mjs`)
- `plugins/dummy-addon/` (including `manifest.json`, `index.ts`)
- `docs/ecomos/evidence/ECO-601/` (including `manifest-spec.md`, `report.md`)

## Key Implementations & Invariants
1. **Typed Addon Manifest Schema (`packages/ecom-engine/src/addon-manifest.ts`)**:
   - Encapsulates `id`, `name`, `version`, `ecomOsApiRange`, `dependencies`, `capabilities`, `configSchema`, `routes`, `uiSlots`, `adminSlots`, `phpModule`, `migrations`, and `billing`.
   - Built standalone semantic version parsing and range satisfaction (`satisfiesSemverRange`) supporting caret ranges (`^1.0.0`), comparison operators (`>=1.0.0`), exact versions, and wildcards.
2. **Deterministic Validation & Compatibility Checking**:
   - `validateAddonManifest`: Validates manifest structure, naming rules, semver syntax, and migration pairs.
   - `checkAddonCompatibility`: Checks runtime engine API compatibility and ensures all declared peer dependencies exist with matching versions.
3. **Decoupling Billing from Capability Enablement**:
   - Commercial billing attributes (`billing.isPaid`, `billing.tier`) are strictly separated from runtime enablement. Paid metadata does not bypass local engine capability gates.
4. **Generator Gate (`scripts/generate-addons.ts`)**:
   - Upgraded addon generation script to inspect each active addon's `manifest.json`, validate schema, and verify version compatibility and peer dependencies.
   - Missing dependencies or incompatible versions abort the generation process with explicit diagnostic messages.
5. **Exemplar Dummy Addon (`plugins/dummy-addon/`)**:
   - Implemented compliant exemplar addon with valid `manifest.json` and typed entry point.

## Executed Verification Commands
1. **Engine Addon Manifest Unit Tests**:
   ```bash
   node ./node_modules/vitest/vitest.mjs run packages/ecom-engine/src/__tests__/addon-manifest.test.ts
   ```
   Output: `14 passed (14), 100% PASS`
2. **Addon Generator Contract Tests**:
   ```bash
   node --import tsx --test scripts/generate-addons.test.mjs
   ```
   Output: `5 passed (5), 100% PASS`
3. **TypeScript Typecheck**:
   ```bash
   node ./node_modules/typescript/bin/tsc -p packages/ecom-engine/tsconfig.json --noEmit
   ```
   Output: `0 errors, Exit code 0`
