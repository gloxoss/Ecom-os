# ECO-702: Separate QuoteBasket and Dedicated /devis Builder Report

## Summary
Implemented the independent `QuoteBasket` domain model in `@ecom-os/addons-rfq`, client Zustand store in `apps/storefront`, accessible `/devis` builder UI component, and comprehensive isolation/off-state contract tests.

## Scope & Claimed Paths
- `packages/addons-rfq/` (`src/basket.ts`, `src/basket.test.ts`, `src/index.ts`)
- `apps/storefront/src/features/rfq/` (`model/quote-store.ts`, `ui/quote-builder.tsx`)
- `apps/storefront/src/app/[locale]/(shop)/devis/` (`page.tsx`)
- `apps/storefront/e2e/` (`quote-builder.spec.ts`)
- `apps/storefront/package.json`
- `docs/ecomos/evidence/ECO-702/` (`basket.md`, `report.md`)

## Key Implementations & Invariants
1. **Independent Variation Keying (`packages/addons-rfq/src/basket.ts`)**:
   - Distinct variation IDs for the same product remain separate line items with dedicated quantities and customer notes.
   - Operations: `addQuoteItem`, `updateQuoteItemQuantity`, `updateQuoteItemNotes`, `removeQuoteItem`, `getQuoteBasketCount`, and `toRfqItems`.
2. **Strict Cart Decoupling (`apps/storefront/src/features/rfq/model/quote-store.ts`)**:
   - Stored under isolated localStorage key `quote-storage`. Zero read or write overlap with WooCommerce purchase cart.
3. **Responsive /devis Builder (`apps/storefront/src/features/rfq/ui/quote-builder.tsx`, `page.tsx`)**:
   - Mobile-ready layout with sticky selection summary sheet and quantity steppers.
   - Guarded by `isAddonActive('quotes')`, returning 404 when addon is disabled.
4. **Contract Verification (`apps/storefront/e2e/quote-builder.spec.ts`)**:
   - Proven 3-item multi-variation assembly, off-state 404 barrier, and zero cart cross-mutation.

## Executed Verification Commands
```bash
node ./node_modules/vitest/vitest.mjs run packages/addons-rfq/src/basket.test.ts
node --import tsx --test apps/storefront/e2e/quote-builder.spec.ts
node ./node_modules/typescript/bin/tsc -p packages/addons-rfq/tsconfig.json --noEmit
node ./node_modules/typescript/bin/tsc -p apps/storefront/tsconfig.json --noEmit
```
Output:
```text
✓ packages/addons-rfq/src/basket.test.ts (8 tests)
✔ Storefront Quote Builder & Isolation Contract (4 tests)
tsc packages/addons-rfq: 0 errors
tsc apps/storefront: 0 errors
```
