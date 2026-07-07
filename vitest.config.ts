import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/storefront/src'),
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/*.spec.ts'],
    projects: [
      {
        name: 'storefront',
        testEnvironment: 'node',
        include: ['apps/storefront/src/**/*.test.ts', 'apps/storefront/src/**/*.test.tsx'],
      },
      {
        name: 'packages',
        testEnvironment: 'node',
        include: ['packages/*/src/**/*.test.ts'],
      }
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'apps/storefront/src/lib/crypto.ts',
        'apps/storefront/src/lib/logger.ts',
        'apps/storefront/src/app/api/revalidate/route.ts',
        'packages/addons-multi-payment/src/hash.ts',
        'packages/addons-multi-payment/src/dedup.ts'
      ],
    },
  },
});
