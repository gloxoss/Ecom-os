---
name: ecom-addon-authoring
description: Guide for creating new Ecom OS addons. Use when building i18n, multi-payment, or any new addon package, or when enabling/disabling addons via env vars.
---

# Ecom OS Addon Authoring Skill

## When to Use
- Creating a new addon package under `packages/addons-*/`
- Implementing `register()` / `disable()` lifecycle hooks
- Wiring an addon into the build-time addon loader

## Addon Contract

Every addon MUST export:

```typescript
export function register(ctx: AddonContext): void {
  // Mount routes, providers, middleware
}

export function disable(): void {
  // Clean up — remove routes, unmount providers
}
```

## Addon Lifecycle

1. `ADDONS` env var lists enabled addons: `ADDONS=i18n,multi-payment`
2. `scripts/generate-addons.ts` reads `ADDONS` at build time
3. Generates `apps/storefront/src/addons.generated.ts` importing each enabled addon's `register()`
4. Disabled addons are tree-shaken from the production bundle
5. `ADDONS=` (empty) → zero addons loaded
6. `ADDONS=invalid-name` → script fails with helpful error

## File Structure
```
packages/addons-{name}/
├── src/
│   ├── register.ts     # register(ctx) + disable()
│   ├── index.ts         # Re-exports
│   └── ...              # Addon-specific modules
├── README.md            # Required
├── package.json
└── tsconfig.json
```

## package.json Convention
```json
{
  "name": "@ecom-os/addons-{name}",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "ecom-os": {
    "addon": true,
    "flag": "{name}"
  }
}
```

## Rules
1. **No cross-addon imports** — addons must not depend on other addons
2. **Graceful degradation** — addon errors degrade, never crash the storefront
3. **Independent testability** — each addon has its own test suite, ≥ 70% coverage
4. **Type-safe flag schema** — document what env vars your addon reads
5. **CI enforced** — missing `register()` or `disable()` export → CI fail

## Testing
```bash
pnpm --filter @ecom-os/addons-{name} test
pnpm --filter @ecom-os/addons-{name} typecheck
```
