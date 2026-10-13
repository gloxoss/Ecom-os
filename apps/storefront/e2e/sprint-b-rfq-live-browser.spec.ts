import { test, expect } from '@playwright/test';
import fs from 'node:fs';

// Storefront under test; set STOREFRONT_URL to run against a client instance on another port.
const BASE = process.env.STOREFRONT_URL ?? 'http://localhost:3000';
import path from 'node:path';

const CHROME_PATH =
  process.env.ECOM_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const STAGING = process.env.ECOM_STAGING_URL ?? 'https://paraloca.local';

/** Look the synthetic fixtures up by SKU: product IDs differ between sites. */
async function findFixtures() {
  const res = await fetch(`${STAGING}/wp-json/wc/store/v1/products?per_page=100&orderby=date&order=asc`);
  const list = (await res.json()) as Array<{ id: number; sku: string; variations?: Array<{ id: number }> }>;
  const bySku = (sku: string) => list.find((p) => p.sku === sku);
  const simple = bySku('ECOMOS-TEST-SIMPLE');
  const variable = bySku('ECOMOS-TEST-VARIABLE');
  const bed = bySku('ECOMOS-TEST-BED');
  const variation = variable?.variations?.[0]?.id;
  if (!simple || !variable || !variation || !bed) {
    throw new Error('RFQ fixtures missing (need ECOMOS-TEST-SIMPLE, ECOMOS-TEST-VARIABLE with a variation, ECOMOS-TEST-BED). Run scripts/seed-instance-fixtures.php');
  }
  return { simple: simple.id, variable: variable.id, variation, bed: bed.id };
}

test.use({ launchOptions: { executablePath: CHROME_PATH }, ignoreHTTPSErrors: true });

test.describe('Live Real-Browser Quotation Journey (Chromium)', () => {
  test('Full UI journey: Entry on PDP, Quote Builder, Quote Reopen, Offer Review & Accept', async ({ page }) => {
    const fx = await findFixtures();
    // 1. Visit PDP and test Entry Method 1: Ajouter au devis pro
    await page.goto(`${BASE}/product/ecomos-test-variable`);
    const addToQuoteBtn = page.locator('button:has-text("Ajouter au devis pro")').first();
    await expect(addToQuoteBtn).toBeVisible({ timeout: 10000 });
    await addToQuoteBtn.click();
    await expect(page.locator('button:has-text("Ajouté au devis ✓")').first()).toBeVisible();

    // 2. Visit /devis (Entry Method 2 / Quote Builder)
    await page.goto(`${BASE}/devis`);
    const quoteBuilder = page.locator('[data-testid="quote-builder"]');
    await expect(quoteBuilder).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=EcomOS TEST variable item')).toBeVisible();

    // 3. Create a live quote through API representing a multi-item submission
    const quotePayload = {
      idempotencyKey: `browser_idemp_${Date.now()}`,
      customerName: 'Docteur Amina Benkirane',
      customerEmail: 'amina.benkirane@clinique-fes.ma',
      contact: {
        name: 'Docteur Amina Benkirane',
        email: 'amina.benkirane@clinique-fes.ma',
        phone: '+212 6 61 00 11 22',
        companyName: 'Clinique Internationale de Fès',
      },
      items: [
        { productId: fx.simple, sku: 'ECOMOS-TEST-SIMPLE', title: 'EcomOS TEST simple item', quantity: 3, unitPriceEstimated: 39.95 },
        { productId: fx.variable, variationId: fx.variation, sku: 'ECOMOS-TEST-VARIABLE', title: 'EcomOS TEST variable item - Standard', quantity: 2, unitPriceEstimated: 79.50 },
        { productId: fx.bed, sku: 'ECOMOS-TEST-BED', title: 'EcomOS TEST Lit Medicalise', quantity: 1, unitPriceEstimated: 850.00 }
      ],
      consents: [
        { consentId: 'terms_and_conditions', grantedAt: new Date().toISOString() },
        { consentId: 'privacy_consent', grantedAt: new Date().toISOString() }
      ]
    };

    const res = await fetch(`${BASE}/api/rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotePayload)
    });
    const quoteData = await res.json();
    expect(res.status).toBe(201);
    expect(quoteData.success).toBe(true);
    const { quoteId, quoteNumber, accessSecret } = quoteData;

    // 4. Staff creates offer revision with discounts
    // Staff credentials: the instance env (service user with manage_woocommerce) first, then the
    // machine-local file used on the starter staging site.
    const creds =
      process.env.ECOM_RFQ_WP_USER && process.env.ECOM_RFQ_WP_APP_PASSWORD
        ? { username: process.env.ECOM_RFQ_WP_USER, app_password: process.env.ECOM_RFQ_WP_APP_PASSWORD }
        : JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../../.agent-hub/.runtime/staff-credentials.json'), 'utf8'));
    const staffBasicAuth = Buffer.from(`${creds.username}:${creds.app_password}`).toString('base64');

    const staffRes = await fetch(`${STAGING}/wp-json/ecomos/v1/rfq/quotes/${quoteId}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${staffBasicAuth}`
      },
      body: JSON.stringify({
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        currency: 'MAD',
        notes: 'Offre hospitalière validée',
        lines: [
          { productId: fx.simple, sku: 'ECOMOS-TEST-SIMPLE', title: 'EcomOS TEST simple item', quantity: 3, unitPriceExclTax: 30.0, taxRate: 0.2 },
          { productId: fx.variable, variationId: fx.variation, sku: 'ECOMOS-TEST-VARIABLE', title: 'EcomOS TEST variable item - Standard', quantity: 2, unitPriceExclTax: 65.0, taxRate: 0.2 },
          { productId: fx.bed, sku: 'ECOMOS-TEST-BED', title: 'EcomOS TEST Lit Medicalise', quantity: 1, unitPriceExclTax: 750.0, taxRate: 0.2 }
        ]
      })
    });
    expect(staffRes.status).toBe(200);

    // 5. Guest reopens quote in browser with token hash: /devis/offer?quoteId=...#token=...
    await page.goto(`${BASE}/devis/offer?quoteId=${encodeURIComponent(quoteId)}#token=${encodeURIComponent(accessSecret)}`);

    // Verify DOM renders the quote number, lines, and totals
    await expect(page.locator(`text=${quoteNumber}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=EcomOS TEST Lit Medicalise')).toBeVisible();
    await expect(page.locator('text=Sous-total HT').first()).toBeVisible();
    await expect(page.locator('text=Total TTC').first()).toBeVisible();

    // 6. Accept button is visible in real browser
    const acceptBtn = page.locator('button:has-text("Accepter le devis")');
    await expect(acceptBtn).toBeVisible();

    // Click "Accepter le devis"
    await acceptBtn.click();

    // Verify confirmation message in DOM
    await expect(page.locator('text=Devis accepté avec succès !')).toBeVisible({ timeout: 10000 });

    // 7. Security barrier in browser: attempt reopen in a new context with invalid token
    const badContext = await page.context().browser()!.newContext();
    const badPage = await badContext.newPage();
    await badPage.goto(`${BASE}/devis/offer?quoteId=${encodeURIComponent(quoteId)}#token=invalid_forged_token`);
    await expect(badPage.locator('[data-testid="offer-access-denied"]')).toBeVisible({ timeout: 10000 });
    await badContext.close();
  });
});
