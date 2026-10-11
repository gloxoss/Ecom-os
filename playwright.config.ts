import { defineConfig, devices } from '@playwright/test';
import { findInstalledChromium } from './scripts/measure-storefront';

// Playwright and `node:test` share the folder apps/storefront/e2e. Only the
// `*.pw.spec.ts` files are genuine Playwright specs; the rest are node:test
// suites run with `tsx --test`. Without an explicit testMatch Playwright would
// try to run the node:test files and fail on every one of them.
const STOREFRONT_PORT = Number(process.env.STOREFRONT_PORT ?? 3100);
const STOREFRONT_URL = process.env.STOREFRONT_URL ?? `http://localhost:${STOREFRONT_PORT}`;

export default defineConfig({
  testDir: './apps/storefront/e2e',
  testMatch: '**/*.pw.spec.ts',
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  webServer: {
    // `pnpm --filter storefront dev` cannot run here: the pnpm shim on PATH is
    // broken. Invoke the local Next binary directly from the app directory.
    command: `node node_modules/next/dist/bin/next dev -p ${STOREFRONT_PORT}`,
    cwd: './apps/storefront',
    url: STOREFRONT_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...(process.env as Record<string, string>),
      // No live WooCommerce exists on this machine; the fake engine still
      // renders real pages, which is what the browser measurements need.
      ECOM_ENGINE: process.env.ECOM_ENGINE ?? 'fake',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // The pinned Chromium revision may not be the one installed on this
        // machine. Point at a real Chromium that is on disk; Playwright's own
        // default is used when no override is found.
        ...(() => {
          const executablePath = findInstalledChromium();
          return executablePath ? { launchOptions: { executablePath } } : {};
        })(),
      },
    },
  ],
  use: { baseURL: STOREFRONT_URL },
});
