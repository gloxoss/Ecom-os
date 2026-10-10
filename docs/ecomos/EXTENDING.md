# EcomOS Extension & Addon Authoring Guide

- **Document**: `EXTENDING.md`
- **Application**: EcomOS Extension Guidelines
- **Version**: 1.0.0
- **Status**: **PRODUCTION CERTIFIED**

---

## 1. Architectural Extension Philosophy

EcomOS enforces strict layer boundaries:
- **Core Engine Isolation**: The core commerce engine (`packages/ecom-engine`) defines universal domain models (cart, orders, product projection) and must never contain client-specific or addon-specific hacks.
- **Addon Decoupling**: Addons reside in `packages/addons-<name>` with corresponding WordPress plugins `plugins/wp-ecomos-<name>`.
- **Off-State Invariant**: Disabling an addon (`capabilities.<addon> = false`) must completely isolate its code paths, unmount UI components, and fail-closed all related API endpoints without breaking core checkout.

---

## 2. Implementing a New Addon

### Step 1: Define Addon Manifest
Create `addon.json` in `packages/addons-<name>/`:
```json
{
  "id": "my-addon",
  "name": "My Custom Addon",
  "version": "1.0.0",
  "dependencies": [],
  "capabilities": ["custom_feature"],
  "requiresHpOs": true
}
```

### Step 2: Implement Domain Package
- Author pure TypeScript domain models, validators, and contract tests in `packages/addons-<name>`.
- Never import `apps/storefront` or database drivers directly.

### Step 3: Implement WordPress Companion Plugin
- Register database migrations with reversible up/down methods.
- Declare HPOS compatibility:
  ```php
  \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
  ```

---

## 3. Creating a Client Profile & Theme

1. Create `clients/<client-id>/profile.ts` implementing `ClientProfile`:
   - Set `id`, `name`, `brand.colors`, `brand.fonts`, `brand.slots`.
   - Configure `capabilities`: `customerAccounts: false`, `guestCheckout: true`, `quotes: boolean`.
   - Set `commerce.allowedPaymentMethods`: strictly certified gateways (`['cod']`).
2. Scaffold theme styles using CSS custom properties (`--color-primary`, `--color-accent`, etc.).
3. Test using `apps/storefront/e2e/profile-reuse.spec.ts`.
