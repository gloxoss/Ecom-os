import { test, expect } from '@playwright/test';

/**
 * ECO-1009: real browser cart journey.
 *
 * These tests drive the locally served storefront in a real Chromium browser.
 * Nothing here constructs an order object or asserts a local boolean: every
 * assertion is made against rendered DOM produced by the running application.
 *
 * The add-to-bag leg additionally needs a product source. With ECOM_ENGINE=fake
 * the engine returns zero products and no WooCommerce is reachable on this
 * machine, so that leg reports NOT MEASURED (skipped, with the observed
 * evidence logged) rather than pretending to pass.
 */

test.describe('real cart journey', () => {
  test('header cart link opens the real cart page', async ({ page }) => {
    await page.goto('/');

    const cartLink = page.locator('a[href="/cart"]').first();
    await expect(cartLink).toBeVisible();
    await cartLink.click();

    await page.waitForURL(/\/cart$/);
    // The cart page renders from the real cart store, not from a fixture.
    await expect(page.locator('h1', { hasText: 'Your Cart' })).toBeVisible();
    await expect(page.locator('text=Your cart is currently empty')).toBeVisible();
  });

  test('add to bag updates the real cart UI', async ({ page }) => {
    await page.goto('/');

    const productLinks = page.locator('a[href*="/product/"]');
    const productCount = await productLinks.count();
    console.log(`[ECO-1009] product links rendered on / : ${productCount}`);

    if (productCount === 0) {
      const probe = await page.request.get('/product/signature-mont-blanc');
      const message =
        `NOT MEASURED: the storefront served no product links, so add-to-bag could not be driven. ` +
        `Observed: 0 links matching a[href*="/product/"] on /; GET /product/signature-mont-blanc -> HTTP ${probe.status()}. ` +
        `Cause: ECOM_ENGINE=fake returns no products and no WooCommerce is reachable from this machine.`;
      console.log(`[ECO-1009] ${message}`);
      test.info().annotations.push({ type: 'not-measured', description: message });
      test.skip(true, message);
      return;
    }

    await productLinks.first().click();
    await page.waitForURL(/\/product\//);

    const productHeading = (await page.locator('h1').first().textContent())?.trim() ?? '';
    expect(productHeading.length).toBeGreaterThan(0);

    const addButton = page.locator('button', { hasText: /add to bag/i }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    // The real header/bag UI must reflect the added line.
    const bagLink = page.locator('a[href="/cart"]').first();
    await expect(bagLink).toContainText('(1)', { timeout: 15000 });

    await bagLink.click();
    await page.waitForURL(/\/cart$/);
    await expect(page.locator('h1', { hasText: 'Your Cart' })).toBeVisible();
    await expect(page.locator('text=Your cart is currently empty')).toHaveCount(0);
  });
});
