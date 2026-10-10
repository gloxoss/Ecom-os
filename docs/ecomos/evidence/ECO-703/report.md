# ECO-703: Customer Review Step, Validated Submit, and Idempotency Report

## Summary
Implemented the customer review UI (`QuoteReview`), input validation schema (`submit-schema.ts`), API submission client (`client.ts`), and secure deduplicating API endpoint (`POST /api/rfq`) with route guard protection and no customer account requirement.

## Scope & Claimed Paths
- `packages/addons-rfq/` (`src/submit-schema.ts`, `src/submit-schema.test.ts`, `src/client.ts`, `src/index.ts`)
- `apps/storefront/src/features/rfq/` (`ui/quote-review.tsx`)
- `apps/storefront/src/app/api/rfq/` (`route.ts`)
- `apps/storefront/src/__tests__/security/` (`rfq-submit.test.ts`)
- `docs/ecomos/evidence/ECO-703/` (`idempotency.md`, `report.md`)

## Key Implementations & Invariants
1. **Input Validation Schema (`packages/addons-rfq/src/submit-schema.ts`)**:
   - Requires non-empty `idempotencyKey`, valid contact email/name, positive item quantities, and mandatory legal consent IDs.
2. **Review Step UI (`apps/storefront/src/features/rfq/ui/quote-review.tsx`)**:
   - Presents item breakdown, contact & company fields, legal consent declarations, and automatic idempotency key generation.
3. **Deduplicated API Route (`apps/storefront/src/app/api/rfq/route.ts`)**:
   - Enforces addon off-state guard returning 404 when quotes addon is inactive.
   - Caches responses under `Idempotency-Key` to return identical quote details on replay without duplicate entity or email generation.
   - Enforces `Cache-Control: no-store, private` to protect customer data.
4. **Security & Contract Proof (`apps/storefront/src/__tests__/security/rfq-submit.test.ts`)**:
   - Validates off-state 404 barrier, successful 201 creation, replay deduplication, and 400 bad request handling.

## Executed Verification Commands
```bash
node ./node_modules/vitest/vitest.mjs run packages/addons-rfq/src/submit-schema.test.ts apps/storefront/src/__tests__/security/rfq-submit.test.ts
node ./node_modules/typescript/bin/tsc -p packages/addons-rfq/tsconfig.json --noEmit
node ./node_modules/typescript/bin/tsc -p apps/storefront/tsconfig.json --noEmit
```
Output:
```text
✓ packages/addons-rfq/src/submit-schema.test.ts (6 tests)
✓ apps/storefront/src/__tests__/security/rfq-submit.test.ts (4 tests)
tsc packages/addons-rfq: 0 errors
tsc apps/storefront: 0 errors
```
