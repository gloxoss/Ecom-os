# Section 06: Storefront Account & Auth

## Overview
Implement customer authentication and account management. Customers should be able to log in, register, view their profile, and see their order history. Authentication is delegated to the underlying engine (e.g., WooCommerce Customer API). Next-Auth (Auth.js) or simple JWT cookies will be used to maintain sessions in the App Router.

## Risk: yellow - Authentication security
Handling tokens and sessions securely in Next.js Server Components and Route Handlers requires careful configuration. Must prevent unauthorized access to the `/account` routes.

## Dependencies
- **Depends on:** section-03
- **Blocks:** none
- **Parallel batch:** 5

## TDD Test Stubs
- Test: Unauthenticated users trying to access `/account` are redirected to `/login`.
- Test: Successful login sets an HttpOnly secure cookie with the auth token.
- Test: Profile page displays the logged-in user's details.
- Test: Order history page fetches and displays past orders.

## Tasks

<task type="auto" id="06-01">
  <name>Define Auth & Customer Interfaces</name>
  <files>packages/ecom-engine/src/interface.ts</files>
  <action>
    Add `Customer` type. Add `login(credentials)`, `register(data)`, `getCustomer(token)`, and `getCustomerOrders(token)` methods to `EcomEngine`.
  </action>
  <verify>Engine interface requires authentication methods.</verify>
  <done>Contracts for authentication are defined.</done>
</task>

<task type="auto" id="06-02">
  <name>Implement WC Auth Adapter</name>
  <files>packages/engine-woocommerce/src/index.ts</files>
  <action>
    Implement the auth methods in the WooCommerce adapter using the `jwt-auth` WordPress plugin or WC REST API to obtain and validate customer tokens.
  </action>
  <verify>Mock a login call and verify a token is returned.</verify>
  <done>Engine can authenticate users against WooCommerce.</done>
</task>

<task type="auto" id="06-03">
  <name>Build Login & Register Pages</name>
  <files>apps/storefront/src/app/(auth)/login/page.tsx, apps/storefront/src/app/(auth)/register/page.tsx</files>
  <action>
    Build UI forms for login and registration using react-hook-form + Zod. Implement Next.js Server Actions to handle form submissions, call the engine, and set a secure session cookie using `cookies().set()`.
  </action>
  <verify>Submit login form; verify cookie is set in browser.</verify>
  <done>Users can log in and register.</done>
</task>

<task type="auto" id="06-04">
  <name>Build Account Dashboard</name>
  <files>apps/storefront/src/app/(account)/account/page.tsx, apps/storefront/src/middleware.ts</files>
  <action>
    Create a Next.js Middleware to protect the `/account` route prefix. Build the account dashboard fetching the profile and order history using the session token.
  </action>
  <verify>Attempt to visit `/account` without a cookie; ensure redirect to `/login`.</verify>
  <done>Secure account area is complete.</done>
</task>
