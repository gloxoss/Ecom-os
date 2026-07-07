# Section 01: Addon Loader System

## Overview
Implement the addon system as described in ADR-007. The system uses environment variables (e.g., `ADDONS=stripe,cmi`) to register addons. A pre-build script runs to scan the `plugins/` directory and generate a static `addons.generated.ts` file. This allows Next.js to compile only the active addons and dead-code eliminate the rest, reducing bundle size.

## Risk: green - Straightforward script and convention
The script simply reads directories and generates a TypeScript array. It is highly predictable and does not involve complex external APIs or state.

## Dependencies
- **Depends on:** none
- **Blocks:** section-02 (CLI), section-05 (Checkout)
- **Parallel batch:** 1

## TDD Test Stubs
- Test: The script correctly parses the `ADDONS` environment variable into an array.
- Test: The script verifies that requested addons actually exist in the `plugins/` directory.
- Test: The generated `addons.generated.ts` exports a strongly-typed `registeredAddons` array.
- Test: If an invalid addon is provided in the env var, the script throws a descriptive error.

## Tasks

<task type="auto" id="01-01">
  <name>Create addon interface types</name>
  <files>packages/ecom-engine/src/addons.ts</files>
  <action>
    Define the `EcomAddon` interface in the engine package. It should require properties like `id`, `name`, `type` (e.g. 'payment', 'shipping', 'i18n'), and an `init` function. Export this interface so plugins can implement it.
  </action>
  <verify>Ensure `EcomAddon` is fully typed and exported.</verify>
  <done>Addon interface is available for use by plugins.</done>
</task>

<task type="auto" id="01-02">
  <name>Create script scaffolding</name>
  <files>scripts/generate-addons.ts, package.json</files>
  <action>
    Create a Node.js script using TypeScript. Add a `predev` and `prebuild` hook to the monorepo's `package.json` to automatically run `ts-node scripts/generate-addons.ts` before Next.js starts.
  </action>
  <verify>Run `pnpm run predev` and verify the script executes successfully.</verify>
  <done>The script runs automatically during the build lifecycle.</done>
</task>

<task type="auto" id="01-03">
  <name>Implement code generation logic</name>
  <files>scripts/generate-addons.ts</files>
  <action>
    Read `process.env.ADDONS`. Split by commas. Validate each addon directory exists in `plugins/`. Generate a TypeScript string that imports each valid addon and exports them in an array named `registeredAddons`. Write this string to `apps/storefront/src/addons.generated.ts`.
  </action>
  <verify>Set `ADDONS=stripe` and verify the generated file correctly imports from `plugins/stripe`.</verify>
  <done>The generated file correctly reflects the active environment variables.</done>
</task>

<task type="auto" id="01-04">
  <name>Create mock plugin for testing</name>
  <files>plugins/dummy-addon/index.ts</files>
  <action>
    Create a simple dummy addon that implements `EcomAddon` to test the generation script. It should just log its initialization.
  </action>
  <verify>Verify the generator script picks up the dummy addon.</verify>
  <done>A testable addon exists to prove the pipeline works.</done>
</task>
