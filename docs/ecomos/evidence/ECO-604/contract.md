# ECO-604: Exemplar Simple Addon Contract and Failure Isolation

## 1. Exemplar Specification (`@ecom-os/addon-dummy`)
The exemplar addon (`plugins/dummy-addon`) provides a minimal, harmless visible capability (`dummy_banner`) designed to prove compliance with the EcomOS addon specification without mutating WooCommerce cart or order authorities:
- **Manifest (`plugins/dummy-addon/manifest.ts`)**:
  - `id`: `dummy-addon`
  - `version`: `1.0.0`
  - `ecomOsApiRange`: `^1.0.0`
  - `capabilities.provided`: `['dummy_banner']`
  - `routes`: `GET /api/dummy-ping` (guarded by `withAddonGuard`)
  - `uiSlots`: `header_banner` -> `DummyBanner`
  - `adminSlots`: `operations_overview` -> `DummyAdminWidget`
- **Lifecycle Implementation (`plugins/dummy-addon/index.ts`)**:
  - `register(ctx)`: Initializes registration and records active status without side effects.
  - `disable()`: Safely tears down addon state.
  - `addon`: Standardized `EcomAddon` structure.

## 2. On / Off Behavioral Contract
1. **Disabled / Default State**:
   - `AddonRegistry.isEnabled('dummy-addon')` returns `false`.
   - `hasCapability('dummy_banner')` returns `false`.
   - Public capability projection (`getPublicAddonCapabilities()`) marks `features['dummy-addon'] = false` and omits `dummy_banner`.
   - Direct requests to `/api/dummy-ping` are intercepted by `guardAddonRoute('dummy-addon')`, returning HTTP 404 with code `ADDON_DISABLED`.
   - Zero background tasks, database mutations, or emails are triggered when disabled.
2. **Enabled State**:
   - `AddonRegistry.enable('dummy-addon', config)` activates the addon.
   - `hasCapability('dummy_banner')` returns `true`.
   - Public capability projection exposes `features['dummy-addon'] = true` and includes `dummy_banner`.
   - Route guard allows traffic (`allowed = true`, status 200), executing the endpoint cleanly.

## 3. Failure Isolation & Core Engine Protection
1. **Startup Failure Containment**:
   - If third-party addon startup code throws an unhandled exception, the execution wrapper isolates the failure.
   - Core WooCommerce catalog browsing (`engine.listProducts`) and cart manipulation (`engine.getCart`) continue operating normally.
2. **Version Mismatch Protection**:
   - If an addon manifest declares an incompatible API range (e.g., `^2.0.0` when host engine is `1.0.0`), `AddonRegistry.enable()` rejects activation with a descriptive `Error` (`requires EcomOS API range "^2.0.0", but host is "1.0.0"`).
   - Incompatible addons remain strictly disabled and cannot compromise runtime stability.
