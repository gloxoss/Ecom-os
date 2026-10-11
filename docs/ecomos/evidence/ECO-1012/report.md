# ECO-1012 — Storefront production build failure: engine package resolution

**Commit:** `b8f87cc` · **Surfaced by:** ECO-1004

## The defect

`next build` failed at module resolution before compiling anything:

```
Can't resolve './addon-manifest.js' in packages/ecom-engine/src/addon-registry.ts
```

`packages/ecom-engine` ships TypeScript source (`main: src/index.ts`) and the
workspace uses `moduleResolution: "Bundler"` (`tsconfig.base.json`). Under that
configuration a `./addon-manifest.js` specifier is not rewritten to
`addon-manifest.ts`, so the import resolved to nothing. Four occurrences, all in
`addon-registry.ts` and `addons.ts`, reachable through `apps/storefront/src/lib/engine.ts`
and `lib/addon-capabilities.ts`.

## Repair

Dropped the `.js` extension from the four specifiers:

```ts
import type { AddonManifest } from './addon-manifest';
import { checkAddonCompatibility, validateAddonManifest } from './addon-manifest';
export * from './addon-manifest';
```

`Bundler` resolution does not require extensions, and `tsc` still resolves them.

## Verification

| Check | Result |
| --- | --- |
| Resolution error present before | yes — `Can't resolve './addon-manifest.js'` in the build log |
| Resolution error after | gone; the build proceeded to the CSS transform stage |
| `tsc -p apps/storefront/tsconfig.json --noEmit --incremental false` | exit 0 |
| `tsx scripts/check-engine-imports.ts` | exit 0 |
| `vitest run` | exit 0 — 521 passed |

## Note

Fixing this exposed the next two failures behind it (the Turbopack CSS transform and
the RFQ route exports). They are recorded in ECO-1013. The audit had recorded "no
fresh production build … was completed"; this is why.
