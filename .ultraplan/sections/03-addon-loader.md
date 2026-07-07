# Section 03 — Addon Loader & Flag Generation

> **Batch 2 · Risk: green · Deps: none · Tasks: 4 · Blueprint: Step 6**

## Why this section exists
FR-050..053 + ADR-007: addons toggled per-deployment via `ADDONS` env var, **build-time tree-shaken** (disabled addons = zero bytes in prod bundle). This is the foundation both the i18n (§08) and multi-payment (§09) addons register into.

## Requirements covered
- **FR-050** addons enabled/disabled via `ADDONS=i18n,multi-payment` env var
- **FR-051** disabling removes UI surface, code paths, and bundle weight
- **FR-052** adding an addon needs no edit to existing addons
- **FR-053** each addon ships with README, types, enable/disable schema, integration test

## Tasks
1. **Addon context type** — `packages/ecom-engine` (or a new `packages/addons-core`) defines `AddonContext` + the contract every addon must export: `register(ctx: AddonContext): void` and `disable(): void` (Cahier §8.17, ADR-007 consequence). CI rejects an addon missing either.
2. **Loader script** `scripts/generate-addons.ts` — reads `ADDONS` env var, resolves each name to `packages/addons-*`, emits `apps/storefront/src/addons.generated.ts` importing each enabled addon's `register()`. Fail with a helpful error on unknown addon name.
3. **Wire into build** — hook `generate-addons.ts` to `predev` + `prebuild` (Cahier §9 Step 6). Commit an empty `addons.generated.ts` so cold clones compile.
4. **Placeholder addon** — `packages/addons-noop` that satisfies the register/disable contract; verify `ADDONS=noop` registers it and `ADDONS=` registers none. Add the addon-import lint/CI rule.

## Inputs
- ADR-007, Cahier §8.17, Section 01 (AddonContext may live alongside engine types)

## Outputs
- `packages/addons-core/src/{context.ts,types.ts,index.ts}` (or within ecom-engine)
- `scripts/generate-addons.ts`
- `apps/storefront/src/addons.generated.ts` (committed empty)
- `packages/addons-noop/` (placeholder + README + test)
- `apps/storefront/src/lib/addons.ts` (calls `register()` from generated file in root layout)

## Acceptance Criteria
- [ ] `ADDONS=` → generated file imports zero addons; bundle analyzer shows addon code absent
- [ ] `ADDONS=noop` → noop registers on app start (visible in a dev log)
- [ ] `ADDONS=fake` → script fails with a helpful error listing valid addon names
- [ ] Adding `packages/addons-foo` requires no edit to `addons-noop` (FR-052)
- [ ] CI rule rejects any `packages/addons-*` package missing `register` + `disable` exports

## Skills to load
`nextjs-best-practices` (build hooks, RSC), `nextjs-app-structure`

## Risks / notes
- Tree-shaking guarantee must be verifiable — wire `@next/bundle-analyzer` and document how to confirm disabled addons are 0 bytes.
- Decide where `AddonContext` lives (its own `addons-core` package is cleaner than stuffing it in `ecom-engine`) — recommend `packages/addons-core`.
