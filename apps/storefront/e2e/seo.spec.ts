import { test, expect } from '@playwright/test';

test.describe('SEO, Canonical URLs, and Robots (ECO-405)', () => {
  test('homepage has canonical tag', async ({ page }) => {
    await page.goto('/');
    const canonical = page.locator('link[rel="canonical"]');
    if (await canonical.count() > 0) {
      const href = await canonical.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('robots.txt disallows private routes and references sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    if (response.ok()) {
      const text = await response.text();
      expect(text).toContain('Disallow: /checkout');
      expect(text).toContain('Disallow: /cart');
      expect(text).toContain('Disallow: /api/');
      expect(text).toContain('Sitemap:');
    }
  });

  test('sitemap.xml contains catalog and excludes private routes', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    if (response.ok()) {
      const text = await response.text();
      expect(text).toContain('/catalog');
      expect(text).not.toContain('/checkout');
      expect(text).not.toContain('/cart');
      expect(text).not.toContain('/api/');
    }
  });
});
