import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/storefront/e2e',
  webServer: {
    command: 'pnpm --filter storefront dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  use: { baseURL: 'http://localhost:3000' },
});
