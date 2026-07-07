# Section 05: Storefront Checkout

## Overview
Implement the most critical flow: Guest Checkout. It involves a multi-step form (Address -> Payment -> Confirmation) and securely processes orders. It connects the UI with multiple payment gateways (CMI, Stripe, COD) leveraging the Addon system built in Section 01. Order creation logic is delegated to the Engine.

## Risk: red - Critical path, multiple external dependencies
Checkout involves payment gateways, sensitive customer data, and complex state management. Validations must be strict (Zod schemas). Payment failures must be handled gracefully without losing the cart.

## Dependencies
- **Depends on:** section-04 (Cart), section-01 (Addons)
- **Blocks:** none
- **Parallel batch:** 5

## TDD Test Stubs
- Test: Checkout form validates empty or malformed address fields using Zod.
- Test: Only payment methods enabled via Addons are displayed.
- Test: Successful order clears the cart and redirects to the confirmation page.
- Test: Failed payment retains the cart and displays an error alert.

## Tasks

<task type="auto" id="05-01">
  <name>Define Order Interfaces & Validation</name>
  <files>packages/ecom-engine/src/interface.ts, apps/storefront/src/lib/validations.ts</files>
  <action>
    Define the `OrderInput` and `Order` types. Add a `createOrder(input)` method to `EcomEngine`. Create strict Zod schemas for checkout billing and shipping addresses.
  </action>
  <verify>Schemas successfully validate mock data objects.</verify>
  <done>Data contracts and validations for checkout are established.</done>
</task>

<task type="auto" id="05-02">
  <name>Build Multi-Step Checkout UI</name>
  <files>apps/storefront/src/app/(checkout)/checkout/page.tsx</files>
  <action>
    Build the checkout page with a stepper component: 1) Address form (using react-hook-form + Zod), 2) Payment method selection, 3) Review & Submit. Read the `registeredAddons` array to dynamically render available payment options.
  </action>
  <verify>Navigate through the steps locally with mock data.</verify>
  <done>The visual checkout flow is ready.</done>
</task>

<task type="auto" id="05-03">
  <name>Implement WC Order Creation Adapter</name>
  <files>packages/engine-woocommerce/src/index.ts</files>
  <action>
    Implement `createOrder` in the WooCommerce adapter. Note: WC REST API is typically better for writes (orders) than WPGraphQL. Configure the adapter to POST to `/wp-json/wc/v3/orders`.
  </action>
  <verify>Mock an order submission and verify it reaches the WC REST endpoint.</verify>
  <done>The engine can successfully create orders.</done>
</task>

<task type="auto" id="05-04">
  <name>Implement Payment Addons Structure</name>
  <files>plugins/stripe-payment/index.ts, plugins/cod-payment/index.ts</files>
  <action>
    Scaffold the actual implementation for the Stripe and Cash on Delivery (COD) addons. They should export UI components for the checkout page and server actions for processing. Wire the checkout page "Submit" button to trigger the selected addon's process function.
  </action>
  <verify>Select COD and submit; verify the order is created and cart is cleared.</verify>
  <done>Payment processing is fully integrated.</done>
</task>
