# ECO-601 Evidence: Addon Manifest Specification and Compatibility Contract

## Objective
Establish the canonical typed addon manifest contract for EcomOS, enforcing version compatibility, cross-addon dependencies, capabilities, slots, and migrations before code generation, while maintaining strict separation between commercial billing state and runtime engine capabilities.

---

## 1. Addon Manifest Schema (`AddonManifest`)

```typescript
export interface AddonManifest {
  id: string;                                     // Slug: lowercase alphanumeric and hyphens
  name: string;                                   // Human-readable title
  version: string;                                // Semver: X.Y.Z
  description?: string;
  ecomOsApiRange: string;                         // Engine semver range (e.g. "^1.0.0")
  dependencies?: Record<string, string>;          // Required peer addons and semver ranges
  capabilities?: {
    required?: string[];                          // Required core/commerce capabilities
    provided?: string[];                          // Capabilities unlocked by this addon
  };
  configSchema?: Record<string, AddonConfigField>;// Schema for environment/options validation
  routes?: AddonRoute[];                          // Storefront / API routes registered
  uiSlots?: AddonSlot[];                          // Storefront layout slots
  adminSlots?: AddonAdminSlot[];                  // Operations admin landing slots
  phpModule?: AddonPhpModule;                     // WordPress/WooCommerce companion plugin
  migrations?: AddonMigration[];                  // Database up/down migration definitions
  billing?: AddonBilling;                         // Billing metadata (strictly decoupled from enablement)
}
```

---

## 2. Invariant: Separation of Billing from Enablement

> [!CRITICAL]
> Commercial license metadata (`billing.isPaid`, `billing.tier`) is purely administrative.
> A paid license key or commercial status **never** directly or dynamically toggles engine capabilities or bypasses local capability gates.
> Local activation is strictly controlled by explicit client configuration and server-side feature registries (`ECO-602`).

---

## 3. Manifest Validation & Addon Generation Lifecycle

1. **Resolution Phase**:
   - `scripts/generate-addons.ts` reads active addons from `process.env.ADDONS`.
   - Resolves target directory in `packages/addons-{name}` or `plugins/{name}`.
2. **Schema & Compatibility Gate**:
   - Reads `manifest.json` from the resolved directory.
   - Executes `validateAddonManifest(raw)`: validates id format, semver syntax, config schema fields, and migration pairs.
   - Executes `checkAddonCompatibility(manifest, engineVersion, activeAddons)`: asserts that the running engine satisfies `ecomOsApiRange` and that all peer dependencies exist with matching versions.
3. **Deterministic Error Handling**:
   - Missing dependencies or incompatible versions trigger explicit errors and abort the build with exit code 1.
   - Prevents silent failures, partial imports, or runtime crashes.
4. **Code Generation**:
   - Produces clean, typed `apps/storefront/src/addons.generated.ts`.

---

## 4. Verification & Test Evidence

### Test Suite 1: Engine Unit Tests (`packages/ecom-engine/src/__tests__/addon-manifest.test.ts`)
- Tests: 14 passed (100%).
- Validates manifest schema conformance, semver range evaluations (`^1.0.0`, `>=1.0.0`, exact), peer dependency resolution, and billing metadata decoupling.

### Test Suite 2: Generator Contract Tests (`scripts/generate-addons.test.mjs`)
- Tests: 5 passed (100%).
- Verifies missing addon detection, missing manifest handling, API range mismatch rejection, and dependency resolution.
