# Section 07: Test Harness

## Overview
Set up the testing infrastructure for the monorepo. This includes configuring Jest for unit testing components and utilities, and Playwright for End-to-End (E2E) smoke testing the critical paths (like the checkout flow). Ensuring tests are in place early protects against regressions as new addons and engines are added.

## Risk: green - Standard tooling configuration
Setting up Jest and Playwright in a Next.js monorepo is well documented. The only minor complexity is handling environment variables and Next.js aliases inside test runners.

## Dependencies
- **Depends on:** all previous sections
- **Blocks:** none
- **Parallel batch:** 6

## TDD Test Stubs
- Test: Jest can execute a basic `describe/it` block testing a pure function (e.g., Zod schema validation).
- Test: Playwright can boot the local dev server and successfully load the homepage.
- Test: Playwright can complete a full guest checkout flow using the COD addon and mock engine.

## Tasks

<task type="auto" id="07-01">
  <name>Configure Jest for Unit Tests</name>
  <files>apps/storefront/jest.config.js, apps/storefront/package.json</files>
  <action>
    Install Jest, React Testing Library, and Next.js test utilities. Configure `jest.config.js` to handle `next/font`, CSS modules, and path aliases (`@/*`). Add `test:unit` script to package.json.
  </action>
  <verify>Run `pnpm test:unit` and ensure it executes successfully.</verify>
  <done>Unit testing infrastructure is ready.</done>
</task>

<task type="auto" id="07-02">
  <name>Configure Playwright for E2E</name>
  <files>apps/storefront/playwright.config.ts, apps/storefront/package.json</files>
  <action>
    Install Playwright. Configure it to start the Next.js dev server before running tests. Set up browser profiles (Chromium, Mobile Safari). Add `test:e2e` script to package.json.
  </action>
  <verify>Run `pnpm test:e2e` and verify it can start the server.</verify>
  <done>E2E testing infrastructure is ready.</done>
</task>

<task type="auto" id="07-03">
  <name>Write Critical Path Smoke Test</name>
  <files>apps/storefront/e2e/checkout.spec.ts</files>
  <action>
    Write a Playwright spec that navigates to the catalog, clicks a product, adds it to the cart, proceeds to checkout, fills out the address, selects COD, and submits the order. Verify the confirmation page appears.
  </action>
  <verify>Run the spec and watch it succeed.</verify>
  <done>The most critical flow of the app is protected by an automated test.</done>
</task>
