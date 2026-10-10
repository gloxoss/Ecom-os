# ECO-203: Destination-Based Checkout Quotation & Customer Details Report

## Identity and scope

- Executor: `commerce-cleanup`, commerce lane.
- Assignment base: `fca6556e5bb0d8c6d9bb7907b7f91aab1719d7aa`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `packages/engine-woocommerce/src/cart.ts`, `packages/engine-woocommerce/src/client.ts`, `packages/engine-woocommerce/src/__tests__/checkout-quote.test.ts`, `apps/storefront/src/features/checkout/server/checkout-actions.ts`, `apps/storefront/src/features/checkout/model/address-schema.ts`, `docs/ecomos/evidence/ECO-203/report.md`.
- Resources: `git-index`.
- Date: 2026-10-10.

## Workflow and source of truth

1. **Guest Address Submission & Profile Validation:**
   - Shopper enters destination and billing information on the storefront checkout form.
   - Server Action `updateCustomerAddressAction` validates input through `validateCheckoutAddress` (`apps/storefront/src/features/checkout/model/address-schema.ts`).
   - Profile-specific validation rules enforce allowed countries (`MA`, `FR`), Moroccan and French phone conventions, and postal codes (5-digit French postal code required, Moroccan postal code checked if provided).
   - Rejects missing required fields, invalid emails, unsupported countries, or invalid postal codes before calling backend endpoints.

2. **Authoritative Store API Destination Quotation:**
   - The server action reads the guest's `Cart-Token` from the secure session cookie and invokes `WooCommerceEngine.updateCustomerAddress(cartId, input)`.
   - The engine sends `POST /cart/update-customer` to WooCommerce Store API with the shopper's address details.
   - WooCommerce calculates applicable destination-specific shipping zones, methods, tax rates, and cart totals server-side.
   - Returned `shipping_rates` packages are parsed with minor-unit price, taxes, and selection flags.
   - Returned `totals` (`total_shipping`, `total_tax`, `total_price`) are extracted directly in minor units without floating-point math.

3. **Authoritative Shipping Rate Selection:**
   - Shopper selects a quoted shipping method.
   - Server Action `selectShippingRateAction` dispatches `rateId` and `packageId` to `WooCommerceEngine.selectShippingRate(cartId, rateId, packageId)`.
   - The engine sends `POST /cart/select-shipping-rate` to WooCommerce Store API.
   - WooCommerce updates selected package rate and re-computes taxes, shipping fee, and grand total authoritatively.

4. **Security & Price Integrity:**
   - Client-supplied shipping fees or tax rates cannot override WooCommerce.
   - Zero-fee delivery (e.g. Free shipping `free_shipping`) is properly distinguished from unavailable delivery.
   - Incompatible destinations or invalid address data fail closed with Store API error codes.

## Changed behavior and files

- `packages/engine-woocommerce/src/cart.ts`:
  - Added `StoreAddress`, `UpdateCustomerInput`, `StoreShippingRate`, `StoreShippingPackage`, and `StoreCustomerQuoteResult` interfaces.
  - Implemented `extractShippingPackages(raw, currency)` helper to extract shipping packages and rates in minor units.
  - Implemented `updateStoreCustomer(cartToken, input)` for `POST /cart/update-customer`.
  - Implemented `selectStoreShippingRate(cartToken, packageId, rateId)` for `POST /cart/select-shipping-rate`.
- `packages/engine-woocommerce/src/client.ts`:
  - Implemented `WooCommerceEngine.updateCustomerAddress(cartId, input)`.
  - Implemented `WooCommerceEngine.selectShippingRate(cartId, rateId, packageId)`.
  - Implemented `WooCommerceEngine.listShippingMethods(countryCode)` with REST zone query and safe error handling.
- `apps/storefront/src/features/checkout/model/address-schema.ts`:
  - Created validation module for French and Moroccan guest checkout addresses.
- `apps/storefront/src/features/checkout/server/checkout-actions.ts`:
  - Implemented `updateCustomerAddressAction` and `selectShippingRateAction` wired to the server-side `Cart-Token` and engine methods.
- `packages/engine-woocommerce/src/__tests__/checkout-quote.test.ts`:
  - Created dedicated unit tests verifying shipping package extraction, destination-quoted customer address update, shipping rate selection, and error handling.

## Verification and test results

- **Checkout Quote Tests:**
  - `pnpm test packages/engine-woocommerce/src/__tests__/checkout-quote.test.ts`: PASS (6 tests).
- **Cart Tests:**
  - `pnpm test packages/engine-woocommerce/src/__tests__/cart.test.ts`: PASS (20 tests).
- **Workspace Test Suite:**
  - `pnpm test`: PASS (23 test files, 203 unit tests).
- **Lint & Typecheck:**
  - `pnpm -C apps/storefront lint`: PASS (0 errors).
  - `pnpm typecheck`: PASS (11 workspace packages clean).

## Honest Boundaries

- `ECO-203` provides server-side address validation and Store API shipping/tax quotation.
- Order submission, duplicate-submit protection, and Cash on Delivery order creation are implemented in `ECO-204`.

