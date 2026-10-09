# ECO-005: canonical money and price parsing report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `342f8144fa8878d975fe479218d7db3838dce553`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `packages/engine-woocommerce/src/money.ts`, `packages/engine-woocommerce/src/currency.ts`, `packages/engine-woocommerce/src/mappers.ts`, `packages/engine-woocommerce/src/__tests__/money.test.ts`, `apps/storefront/src/lib/format-money.ts`, `apps/storefront/src/__tests__/security/format-money.test.ts`, `docs/ecomos/evidence/ECO-005`.
- Resources: `git-index`.
- Date: 2026-10-09.

## Verified implementation

1. **Canonical raw money conversion:**
   - `packages/engine-woocommerce/src/money.ts` implements `parseRawMoney(value, currency)`.
   - Stringent numeric validation: rejects floating-point approximations, NaN, empty strings, and negative values.
   - Exact minor unit calculation via `BigInt` based on `Intl.NumberFormat` currency decimal resolution, with safe integer limit verification.
   - Rejects localized/formatted input strings (`1 299,00 MAD`, `1,299.00`, HTML spans, price ranges) as backend input.

2. **Currency precision & locale formatting:**
   - Multi-currency test fixtures: MAD (2 decimals), EUR (2 decimals), JPY (0 decimals), KWD (3 decimals).
   - Display formatting in `apps/storefront/src/lib/format-money.ts` uses `Intl.NumberFormat` with target locale (French by default) and proper major unit conversion without loss of precision.

3. **Adapter mapping:**
   - `mapProduct` requires canonical raw prices and currency read from WooCommerce general settings, preserving currency across products and related items.

## Executed checks

- `pnpm exec vitest run packages/engine-woocommerce/src/__tests__/money.test.ts apps/storefront/src/__tests__/security/format-money.test.ts` -> PASS (19/19 tests).
- `pnpm --filter @ecom-os/engine-woocommerce typecheck` -> PASS (exit 0).
- `pnpm --filter storefront typecheck` -> PASS (exit 0).
- `git diff --check` -> PASS (exit 0).
