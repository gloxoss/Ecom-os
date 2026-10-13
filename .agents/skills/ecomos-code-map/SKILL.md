---
name: ecomos-code-map
description: Map of the EcomOS codebase with its connection style and coding conventions: where code lives, the engine adapter seam, addons, client profiles and themes, import boundaries enforced by the architecture guard, money and security rules, test and commit conventions. Use before adding a feature, enhancing, refactoring or optimizing EcomOS code, adding an addon, adapter, theme or client profile, writing tests, or when orienting in the repo or an instance.
---

# EcomOS code map and conventions

Read `references/architecture-map.md` for the full file map. This page holds the rules that keep new code compatible with future starter updates.

## The shape in one paragraph

A Next.js storefront (`apps/storefront`) talks to commerce only through the `EcomEngine` interface (`packages/ecom-engine`). The real implementation is the WooCommerce adapter (`packages/engine-woocommerce`); a fake engine serves tests. Optional features are addons (`packages/addons-*`, plus WordPress companion plugins in `plugins/`), switched by `ADDONS` and runtime capabilities. A client is a profile (`clients/<id>`) plus a theme (`packages/themes`). WooCommerce is the source of truth for prices, stock, totals and orders.

## Connection rules (the guard enforces the first two)

1. **UI never imports an engine adapter.** Only `apps/storefront/src/lib/engine.ts` may import `engine-woocommerce`; everything else uses the `@ecom-os/engine` types.
2. **Every `packages/addons-*` exports `register` and `disable`** from `src/index.ts`, and has a `manifest.json`. Addon names resolve by package suffix or declared `ecom-os.flag` (the RFQ package `addons-rfq` is named `quotes`).
3. **Features sit behind capabilities.** When an addon is off, its routes return 404 (`lib/addon-route-guard.ts`) and its UI does not mount. Test the off state.
4. **Adapters map, UI renders.** Raw WooCommerce responses are converted in `mappers.ts`; nothing engine-specific leaks upward.
5. **Client-specific behavior is config, theme or an addon, never an `if (client === ...)` in core.** Clients register by folder: `clients/<id>/profile.ts` and `themes/src/clients/<id>/theme.ts`, discovered by `scripts/generate-clients.mjs` (the guard checks the generated files are fresh).

Run the guard with `node node_modules/tsx/dist/cli.mjs scripts/check-engine-imports.ts` (13 tests in `scripts/check-engine-imports.test.mjs`).

## Commerce and security rules

- Money is an integer in minor units with an explicit currency (`amount_minor`, `MAD`). Never parse localized strings, never default a currency.
- Browser-supplied prices, totals and stock are never trusted. Order creation goes through the WooCommerce Store API with the authoritative cart.
- Guest first: customer accounts are off in core. Unsigned tokens are never accepted as identity.
- Uncertain outcomes stay uncertain: an unconfirmed checkout stays `PENDING`, a capped search is "inconclusive", never "not found".
- Fail closed. Missing config in production stops the app (`validateRuntimeConfig`). Secrets only in env, never in code or profiles.
- Only certified payment methods (`cod`) are enabled until a gateway is certified.

## Code style

- TypeScript strict with `exactOptionalPropertyTypes`. No `any`: use `unknown` and narrow. A test fixture may use one commented `eslint-disable-next-line` with a reason.
- Reuse before adding: look in `lib/`, `features/<name>/model`, and existing helpers (for example `features/rfq/model/upstream-error.ts`).
- Feature layout: `features/<name>/{model,ui}`, routes in `app/`, shared UI in `components/`.
- Tests: Vitest for units (`*.test.ts`, `__tests__/`); `node:test` for `e2e/*.spec.ts`; Playwright for `*.pw.spec.ts` and the live specs. Keep the three runners separate.
- Comments explain why or name a gotcha. Commits are small and conventional (`fix(checkout): ...`), one concern each, with the attribution trailer.

## Enhancing safely (recipes)

- **New addon:** follow `docs/ecomos/EXTENDING.md`: manifest, `register`/`disable`, flag, route guard, off-state test, migration note.
- **New engine capability:** add it to `interface.ts`, then the fake engine, the WooCommerce adapter plus mapper, then a test for each. UI uses only the interface.
- **New client or theme:** use `ecomos-instance-creation`.
- **Optimization:** measure first (existing measure scripts, live latency), change one thing, keep the before/after numbers in the commit or evidence. Never trade away a security rule for speed.

## Verify before you claim

Guard, `eslint`, `tsc --noEmit`, `vitest run`, `hub:test`, a production build (`next build --webpack`), and the live specs for commerce changes. Reports must say what was actually run and what was not. A passing journal entry is not proof; an executed command with its exit code is.

## Where problems go

Anything wrong in core goes through `ecomos-upstream-first`. Updating instances: `ecomos-instance-updates`.
