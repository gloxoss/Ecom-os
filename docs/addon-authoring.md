# Addon Authoring Contract

Addons in Ecom-os provide modular functionality and integrations. Each addon resides in its own `packages/addons-*` workspace.

## Required Structure
- `src/index.ts`: Must export a `register(ctx)` and an optional `disable()` function.
- `package.json`: Contains standard npm metadata. Addons are automatically discovered by the generator if they follow the `packages/addons-*` convention.

## Generator
The command `pnpm generate:addons` reads the `ADDONS` environment variable and injects registered addons into the storefront engine runtime via generated registry entries.

## Contract Hooks
- `register(ctx)`: Hook for addons to inject middleware, UI components, payment gateways, or event listeners.
- `disable()`: Cleanup hook called when addon is disabled or unloaded.

## Deep Addons vs Shallow Addons

Addons fall into two categories:

### Shallow addons (hot-toggle)
Registered and unregistered entirely at runtime via `register(ctx)` / `disable()`. Examples: `addons-multi-payment`. Toggling `PAYMENT_PROVIDERS` or `ADDONS` requires only a process restart (no redeploy, no rebuild).

### Deep addons (redeploy required)
Addons that integrate at the routing or build level. They cannot be hot-removed because Next.js bakes routing and config at build time. Examples: `addons-i18n`.

**`addons-i18n` is a deep addon.** It is always installed as a workspace dependency. "Disabling" it means running in single-locale mode:

```env
ADDONS=multi-payment          # no i18n
DEFAULT_LOCALE=en
```

This produces:
- `routing.localePrefix = 'never'` → URLs look like `/products/slug` (no `/en/` prefix)
- Only `en.json` messages are loaded
- `[locale]` route param is always `'en'` — invisible to the user

What you do NOT get by "disabling":
- Removal of the next-intl package from the bundle
- Removal of the `[locale]/` route structure

To fully remove i18n (save ~30KB bundle): use a separate storefront template without `[locale]/`. This is a Sprint D concern, not v1.
