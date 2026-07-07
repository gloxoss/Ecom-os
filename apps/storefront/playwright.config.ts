import { defineConfig, devices } from '@playwright/test';

// ponytail: minimal playwright config, don't over-engineer browsers/retries
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
