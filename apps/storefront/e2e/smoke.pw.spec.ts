import { test, expect } from '@playwright/test';

test('homepage loads successfully and displays hero', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();
});

test('catalog displays products', async ({ page }) => {
  await page.goto('/catalog');
  await expect(page.locator('h1', { hasText: 'All Products' })).toBeVisible();
});
