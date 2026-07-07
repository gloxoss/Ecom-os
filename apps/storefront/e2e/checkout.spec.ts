import { test, expect } from '@playwright/test';

test.describe('COD checkout flow', () => {
  test('happy path: browse → add to cart → checkout → success', async ({ page }) => {
    await page.goto('/');

    const productLink = page.locator('a[href^="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 10000 });
    await productLink.click();
    await page.waitForURL(/\/product\//);

    await page.click('button:has-text("Add to Cart")');

    await page.click('button:has-text("Cart")');
    await page.click('a[href="/checkout"]');
    await page.waitForURL('/checkout');

    await page.fill('input[name="email"]', 'e2e@test.com');
    await page.fill('input[name="firstName"]', 'E2E');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('textarea[name="address"]', '1 Test Street, City, 00000');

    await page.click('button:has-text("Place Order")');

    await page.waitForURL(/\/checkout\/success/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Order confirmed');
  });

  test('empty cart shows message, not crash', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('text=cart is empty')).toBeVisible();
  });
});

test('security headers present on home page', async ({ request }) => {
  const res = await request.get('/');
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  expect(res.headers()['x-frame-options']).toBe('DENY');
  expect(res.headers()['content-security-policy']).toContain("default-src 'self'");
});
