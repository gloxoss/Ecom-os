# EcomOS Extension & Addon Authoring Guide

- **Document**: `EXTENDING.md`
- **Application**: EcomOS Extension Guidelines
- **Version**: 1.1.0
- **Status**: DRAFT — instructions below were validated against the repository source listed in each section. No executed clean-checkout install or full addon lifecycle run is retained as evidence for this guide. Treat the "not yet implemented" markings as authoritative.

---

## 1. Architectural extension philosophy

EcomOS enforces layer boundaries:

- **Core engine isolation**: `packages/ecom-engine` defines universal domain models (cart, orders, product projection). It must not contain client-specific or addon-specific code.
- **Addon decoupling**: TypeScript addons live in `packages/addons-<name>/` (formal workspace packages) or `plugins/<name>/` (local/example addons). WordPress companion plugins live in `plugins/wp-ecomos-<name>/`.
- **Off-state invariant**: A disabled addon exposes no operational routes, permissions or background side effects. Server routes gate on the addon registry, which returns 404 for a disabled or unknown addon and 403 for a missing capability (`packages/ecom-engine/src/addon-registry.ts`, `AddonRegistry.guardService`).

---

## 2. Addon anatomy

An addon that the build can load needs exactly two things:

1. A `manifest.json` at the addon directory root. **The file is named `manifest.json`, not `addon.json`.** `scripts/generate-addons.ts:65` looks for `<addonDir>/manifest.json` and throws `Addon '<name>' ... is missing required manifest.json file.` if it is absent.
2. An entry module exporting the runtime members required by `EcomAddon` (`packages/ecom-engine/src/addons.ts`):

```ts
export const register = (ctx: AddonContext): void => { /* activate */ };
export const disable  = (): void => { /* deactivate */ };
```

`manifest` is an optional additional export. `plugins/dummy-addon/index.ts` is a working reference.

### 2.1 `manifest.json` schema

The authoritative schema is `packages/ecom-engine/src/addon-manifest.ts` (`AddonManifest`, validated by `validateAddonManifest`).

Required fields:

| Field | Type | Validation |
| :--- | :--- | :--- |
| `id` | string | lowercase alphanumeric and hyphens only (`/^[a-z0-9-]+$/`) |
| `name` | string | non-empty |
| `version` | string | strict semver `X.Y.Z` |
| `ecomOsApiRange` | string | non-empty semver range, e.g. `"^1.0.0"` |

Optional fields (all real and validated):

- `description`: string
- `dependencies`: **an object map** of addon id to semver range, e.g. `{ "rfq": "^1.0.0" }`. An array (`[]`) is rejected with `dependencies must be a key-value record of addon IDs to semver ranges.`
- `capabilities`: `{ required?: string[]; provided?: string[] }`
- `configSchema`: map of field name to `{ type: "string" | "number" | "boolean" | "object" | "array"; required?: boolean; default?: unknown; description?: string }`. A field without a valid `type` is rejected.
- `routes`: `AddonRoute[]` — `{ path, method?, handler?, authRequired? }`
- `uiSlots`: `AddonSlot[]` — `{ slot, component?, order? }`
- `adminSlots`: `AddonAdminSlot[]` — `{ slot, title?, component?, requiredCapability? }`
- `phpModule`: `{ pluginFile, minPhpVersion?, minWpVersion?, minWooVersion? }`. `pluginFile` is mandatory when the object is present.
- `migrations`: `AddonMigration[]` — each entry requires **all three** of `version`, `up`, `down`; a missing key is rejected.
- `billing`: `{ isPaid?, tier?, licenseKeyConfigKey? }`. Billing metadata never bypasses local capability gating.

`requiresHpOs` (used by an earlier draft of this guide) is **not** part of the schema. Unknown keys are ignored by the validator, so a manifest carrying `requiresHpOs` still validates, but the flag has no effect. Declare HPOS compatibility in the PHP companion plugin instead (see section 4).

### 2.2 Minimal valid manifest

Model this on the shipped exemplar `plugins/dummy-addon/manifest.json`:

```json
{
  "id": "my-addon",
  "name": "My Custom Addon",
  "version": "1.0.0",
  "description": "One-line purpose of this addon",
  "ecomOsApiRange": "^1.0.0",
  "dependencies": {},
  "capabilities": { "provided": ["my_feature"] },
  "configSchema": {
    "enabled": { "type": "boolean", "default": true, "description": "Whether the feature is active" }
  },
  "routes": [],
  "uiSlots": [],
  "adminSlots": []
}
```

---

## 3. Directory resolution and the enable/disable flow

### 3.1 How an addon name resolves

`scripts/generate-addons.ts` (`resolveAddon`) resolves an addon name in this order:

1. `packages/addons-<name>/` → import path `@ecom-os/addons-<name>`
2. **any package whose `package.json` declares `"ecom-os": { "addon": true, "flag": "<name>" }`** → import path is that package's real `name` field
3. `plugins/<name>/` → import path `../../../plugins/<name>`

If none matches, the generator throws `Addon '<name>' not found in packages/addons-<name>/ or plugins/<name>/`.

**An addon's `ADDONS` name is its feature flag, which need not equal its directory.** `packages/addons-rfq/package.json` declares `"ecom-os": { "flag": "quotes" }`, and the RFQ route guard checks the addon id `quotes`, so the name to pass is `quotes`. Step 2 exists precisely so that works: `ADDONS=quotes` resolves to `@ecom-os/addons-rfq`. For `i18n` and `multi-payment` the flag and the directory suffix happen to match, so every path resolves to the same package.

Prefer passing the flag, since that is the id the runtime registry and route guards use.

### 3.2 Enabling and disabling at build time

Addon selection is driven by the `ADDONS` environment variable (comma-separated names, trimmed, empty entries dropped — `scripts/generate-addons.ts:145-149`). `scripts/generate-addons.ts` then:

1. loads each manifest, schema-validates it (`validateAddonManifest`),
2. checks the engine API range and peer dependencies (`checkAddonCompatibility`) against `ECOMOS_API_VERSION` (default `1.0.0`) and the other active addons,
3. writes `apps/storefront/src/addons.generated.ts` containing `registeredAddons: EcomAddon[]`.

`apps/storefront/src/lib/addons.ts` (`initAddons`) calls `register(ctx)` on each entry; `apps/storefront/src/app/layout.tsx:15` invokes it. Any validation or compatibility failure aborts the generator with a non-zero exit, which fails `predev`/`prebuild`.

So the real lifecycle is:

- **Enable**: add the name to `ADDONS` in the environment file, then run `pnpm dev` or `pnpm build` (root scripts run `generate-addons.ts` via `predev`/`prebuild`).
- **Disable**: remove the name from `ADDONS` and regenerate. A disabled or removed addon falls out of `registeredAddons` and, through `AddonRegistry.guardService`, its routes resolve to 404.

### 3.3 Runtime capability gate (separate path)

`apps/storefront/src/lib/addon-capabilities.ts` builds a second, independent `AddonRegistry` from the same `ADDONS` value and exposes `isAddonActive`, `hasAddonCapability` and `getPublicAddonCapabilities`. It synthesizes a manifest per name with a hard-coded `version: "1.0.0"` and `ecomOsApiRange: "^1.0.0"`; it does **not** read `manifest.json`. Components gate on it through `apps/storefront/src/components/if-capable.tsx`.

`AddonRegistry.enable(id)` / `disable(id)` exist in the engine and are exercised by the addon e2e specs, but the storefront has no user-facing toggle wired to them. Toggling is an environment change plus a rebuild.

### 3.4 Worked example (the only addon that builds today)

```bash
# 1. Create plugins/my-addon/manifest.json from the template in section 2.2.
# 2. Create plugins/my-addon/index.ts exporting register() and disable().
# 3. Point ADDONS at it (apps/storefront/.env.local or the shell):
export ADDONS=my-addon

# 4. Regenerate and confirm the addon landed:
node node_modules/tsx/dist/cli.mjs scripts/generate-addons.ts
# -> Generated addons.generated.ts with 1 validated addons: my-addon

# 5. Disable by clearing ADDONS and regenerating:
export ADDONS=
node node_modules/tsx/dist/cli.mjs scripts/generate-addons.ts
# -> Generated addons.generated.ts with 0 validated addons:
```

`ADDONS` is read by the generator from `.env.local`, `.env`, `apps/storefront/.env.local` and `apps/storefront/.env` (first match wins per key — `loadEnv` in `scripts/generate-addons.ts:10-28`).

### 3.5 Manifests (added 2026-10-11)

Every shipped addon package now has a `manifest.json`: `packages/addons-i18n/manifest.json` (id `i18n`), `packages/addons-multi-payment/manifest.json` (id `multi-payment`), `packages/addons-rfq/manifest.json` (id `quotes`), plus the exemplar `plugins/dummy-addon/manifest.json`.

Verified working:

```bash
ADDONS="i18n,multi-payment,quotes" node node_modules/tsx/dist/cli.mjs scripts/generate-addons.ts
# -> Generated addons.generated.ts with 3 validated addons: i18n, multi-payment, quotes

ADDONS=bogus node node_modules/tsx/dist/cli.mjs scripts/generate-addons.ts
# -> Error generating addons: Addon 'bogus' not found... (exit 1)
```

Remaining caveat: an addon that also runs PHP-side must still declare HPOS compatibility in its plugin. That is now done for `wp-ecomos-addons`, `wp-ecomos-operations` and `wp-ecomos-rfq`; see section 4.

The generator also has its own contract test, which is not wired into `pnpm test` or CI. Run it through `tsx` (plain `node --test` fails two cases because the test imports `addon-manifest.js` for a `.ts` module):

```bash
node node_modules/tsx/dist/cli.mjs --test scripts/generate-addons.test.mjs
# 5 tests, 5 pass
```

---

## 4. WordPress companion plugin

Register reversible DB migrations in the plugin, and declare HPOS compatibility **inside the plugin** (the schema has no field for it):

```php
add_action('before_woocommerce_init', function () {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables', __FILE__, true
        );
    }
});
```

Note: none of the three project plugins under `plugins/` (`wp-ecomos-addons`, `wp-ecomos-operations`, `wp-ecomos-rfq`) currently contains this declaration; only the PHP test fixtures in `plugins/tests/` call `declare_compatibility`. Verify the declaration exists before claiming HPOS compatibility for a given plugin.

---

## 5a. Client shell overrides (header, footer, language, home page)

A client instance owns its storefront look without editing core files. Add `apps/storefront/src/client-shells/<client-id>.tsx` (the id is `ECOM_CLIENT_PROFILE`) exporting exactly one `<name>Shell` constant of type `ClientShellOverrides` (`@/lib/client-shell`):

- `htmlLang`: value for `<html lang>` (default `en`).
- `Header` / `Footer`: replace the default site header and footer.
- `Landing`: replaces the whole home page and receives the active `locale`.

Every field is optional. Run `node scripts/generate-clients.mjs` to register the file (it also runs in `predev`, `prebuild` and the guard). The starter ships no shells; client content never goes into the shared components.

## 5. Creating a client profile and theme

1. Add `clients/<client-id>/profile.ts` exporting a `ClientProfile` (type: `packages/brand-config/src/client-profile.ts`). Model it on `clients/paraloca/profile.ts`. The validated shape includes:
   - `id`, `name`, `version`
   - `brand`: `name`, `slug`, `theme`, `logos`, `colors`, `fonts`, `radii`, `slots`, `hero`, `contact`, `commerce`
   - `capabilities`: `quotes`, `multiCurrency`, `guestCheckout`, `customerAccounts`, `reviews`, `wishlist`, `newsletter`, `facetedSearch`
   - `commerce`: `allowedCountries`, `defaultCountry`, `allowedPaymentMethods` (certified gateways only — `['cod']`), `allowedShippingMethods`, `defaultShippingMethod`
   - `industry`, `environment` (backend/staging URLs, overridable from the environment)
2. Register the profile (and its theme) in the registries in `apps/storefront/src/lib/client-profile.ts`. The active profile is chosen by `ECOM_CLIENT_PROFILE` (default `paraloca`; built-in keys are `paraloca` and `demo-2`).
3. Generate theme tokens with `pnpm dev`/`pnpm build` (root `predev`/`prebuild` run `scripts/generate-tokens.ts`, which reads `apps/storefront/brand.config.ts` and writes `apps/storefront/src/styles/brand.tokens.css`). Theme selection also reads `THEME_NAME` (`apps/storefront/scripts/generate-theme.ts`, default `angelina`).
4. Test reuse with `apps/storefront/e2e/profile-reuse.spec.ts` (exists) via `pnpm e2e`.
