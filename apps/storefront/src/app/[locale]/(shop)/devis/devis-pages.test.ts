import { describe, it, expect, beforeEach } from 'vitest';
import { AddonRegistry } from '@ecom-os/engine';
import { setStorefrontRegistryForTesting } from '@/lib/addon-capabilities';
import DevisReviewPage from './review/page';
import DevisOfferPage from './offer/page';

async function callPage(page: () => Promise<unknown>): Promise<unknown> {
  try {
    return await page();
  } catch (err) {
    return err;
  }
}

// Next raises notFound() as a control-flow error; the digest is the stable signal
// (`NEXT_HTTP_ERROR_FALLBACK;404` in current Next, `NEXT_NOT_FOUND` historically).
function isNotFound(result: unknown): boolean {
  if (typeof result !== 'object' || result === null) return false;
  const digest = ((result as { digest?: string }).digest ?? '').toString();
  return digest.includes('NEXT_NOT_FOUND') || digest.endsWith(';404');
}

/**
 * The addon gate on the mounted RFQ pages. With `quotes` off, `/devis/review`
 * and `/devis/offer` must not render: they call notFound(), exactly like /devis.
 */
describe('Mounted RFQ pages honour the quotes addon gate (ECO-1005)', () => {
  let registry: AddonRegistry;

  beforeEach(() => {
    registry = new AddonRegistry('1.0.0');
    registry.register({
      id: 'quotes',
      name: 'RFQ Quotes Addon',
      version: '1.0.0',
      ecomOsApiRange: '^1.0.0',
      capabilities: { provided: ['quotes', 'quote_builder'] },
    });
    setStorefrontRegistryForTesting(registry);
  });

  it('serves 404 for both mounted pages while the quotes addon is off', async () => {
    expect(isNotFound(await callPage(() => DevisReviewPage()))).toBe(true);
    expect(
      isNotFound(await callPage(() => DevisOfferPage({ params: Promise.resolve({ locale: 'fr' }), searchParams: Promise.resolve({}) })))
    ).toBe(true);
  });

  it('renders both mounted pages once the quotes addon is enabled', async () => {
    registry.enable('quotes');

    const review = await callPage(() => DevisReviewPage());
    expect(isNotFound(review)).toBe(false);
    expect(review).toBeTruthy();

    const offer = await callPage(() =>
      DevisOfferPage({
        params: Promise.resolve({ locale: 'fr' }),
        searchParams: Promise.resolve({ quoteId: 'quote_abc' }),
      })
    );
    expect(isNotFound(offer)).toBe(false);
    expect(offer).toBeTruthy();
  });
});
