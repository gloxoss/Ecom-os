import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolveSiteUrl,
  buildCanonicalUrl,
  hasFacetOrFilterParams,
  resolveRobotsPolicy,
} from '../config';
import {
  buildProductMetadata,
  buildProductJsonLd,
  buildCategoryJsonLd,
} from '../product';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import type { Product } from '@ecom-os/engine';

describe('SEO & Canonical URL configuration (ECO-405)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('resolves site URL correctly, stripping trailing slashes and ensuring valid protocol', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://paraloca.ma/';
    expect(resolveSiteUrl()).toBe('https://paraloca.ma');

    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    expect(resolveSiteUrl()).toBe('http://localhost:3000');

    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;
    expect(resolveSiteUrl()).toBe('http://localhost:3000');

    expect(() => resolveSiteUrl('ftp://invalid-protocol.com')).toThrow(
      /Insecure or unsupported protocol/
    );
    expect(() => resolveSiteUrl('not-a-valid-url')).toThrow(/Invalid canonical site URL/);
  });

  it('builds canonical URLs stripping query parameters, facets, and hashes', () => {
    const siteUrl = 'https://paraloca.ma';
    expect(
      buildCanonicalUrl('/product/macaron-paris?ref=social&utm_source=ad#specs', { siteUrl })
    ).toBe('https://paraloca.ma/product/macaron-paris');

    expect(
      buildCanonicalUrl('/catalog/chocolat?page=2&sort=price_asc', { siteUrl })
    ).toBe('https://paraloca.ma/catalog/chocolat');

    expect(buildCanonicalUrl('/', { siteUrl })).toBe('https://paraloca.ma');
  });

  it('detects facet filters and search query parameters accurately', () => {
    expect(hasFacetOrFilterParams({})).toBe(false);
    expect(hasFacetOrFilterParams({ page: '1' })).toBe(false);
    expect(hasFacetOrFilterParams(new URLSearchParams())).toBe(false);

    expect(hasFacetOrFilterParams({ q: 'chocolat' })).toBe(true);
    expect(hasFacetOrFilterParams({ category: 'patisserie' })).toBe(true);
    expect(hasFacetOrFilterParams({ brand: 'angelina' })).toBe(true);
    expect(hasFacetOrFilterParams({ min_price: '50' })).toBe(true);
    expect(hasFacetOrFilterParams({ sort: 'price_desc' })).toBe(true);
    expect(hasFacetOrFilterParams({ page: '2' })).toBe(true);
    expect(hasFacetOrFilterParams({ filter_color: 'red' })).toBe(true);

    const usp = new URLSearchParams('search=the&page=3');
    expect(hasFacetOrFilterParams(usp)).toBe(true);
  });

  it('enforces correct robots indexing policy for clean, faceted, and private content', () => {
    // Normal public content -> index, follow
    expect(resolveRobotsPolicy()).toEqual({ index: true, follow: true });

    // Faceted search / filter pages -> noindex, follow (allow spidering products without indexing permutations)
    expect(resolveRobotsPolicy({ hasFacetFilters: true })).toEqual({
      index: false,
      follow: true,
    });

    // Private checkout / cart / out-of-catalog -> noindex, nofollow
    expect(resolveRobotsPolicy({ isPrivate: true })).toEqual({
      index: false,
      follow: false,
    });
  });
});

describe('Product & Category Schema.org Structured Data (ECO-405)', () => {
  const sampleProduct: Product = {
    id: 'prod-101',
    slug: 'macaron-vanille',
    name: 'Macaron Vanille de Madagascar',
    description: '<p>Délicat macaron garni d’une ganache onctueuse.</p>',
    shortDescription: 'Délicat macaron vanille',
    sku: 'ANG-MAC-VAN',
    price: {
      amount_minor: 4500,
      currency: 'MAD',
    },
    inventory: {
      status: 'IN_STOCK',
      quantity: 15,
      backordersAllowed: false,
      isPurchasable: true,
    },
    images: [
      {
        url: 'https://cdn.paraloca.ma/macaron-vanille.jpg',
        altText: 'Macaron Vanille',
      },
    ],
    categories: ['patisseries'],
    brand: {
      id: 'brand-1',
      slug: 'angelina',
      name: 'Angelina Paris',
    },
    isPurchasable: true,
  };

  it('builds truthful product metadata with canonical link and open graph', () => {
    const meta = buildProductMetadata(sampleProduct, {
      siteUrl: 'https://paraloca.ma',
      brandName: 'Angelina Paris',
    });

    expect(meta.title).toBe('Macaron Vanille de Madagascar | Angelina Paris');
    expect(meta.description).toBe('Délicat macaron vanille');
    expect(meta.alternates?.canonical).toBe('https://paraloca.ma/product/macaron-vanille');
    expect(meta.openGraph?.url).toBe('https://paraloca.ma/product/macaron-vanille');
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it('noindexes missing or removed products to prevent false indexing', () => {
    const notFoundMeta = buildProductMetadata(null);
    expect(notFoundMeta.title).toBe('Product Not Found');
    expect(notFoundMeta.robots).toEqual({ index: false, follow: false });

    const removedProduct: Product = {
      ...sampleProduct,
      isPurchasable: false,
      inventory: {
        status: 'OUT_OF_STOCK',
        quantity: 0,
        backordersAllowed: false,
        isPurchasable: false,
      },
    };
    const removedMeta = buildProductMetadata(removedProduct, { siteUrl: 'https://paraloca.ma' });
    expect(removedMeta.robots).toEqual({ index: false, follow: false });
  });

  it('generates Schema.org Product JSON-LD with genuine pricing and stock availability', () => {
    const jsonLd = buildProductJsonLd(sampleProduct, {
      canonicalUrl: 'https://paraloca.ma/product/macaron-vanille',
      brandName: 'Angelina Paris',
    });

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('Product');
    expect(jsonLd.name).toBe('Macaron Vanille de Madagascar');
    expect(jsonLd.sku).toBe('ANG-MAC-VAN');
    expect(jsonLd.brand).toEqual({ '@type': 'Brand', name: 'Angelina Paris' });

    const offers = jsonLd.offers as Record<string, unknown>;
    expect(offers['@type']).toBe('Offer');
    expect(offers.price).toBe('45.00'); // 4500 minor / 100
    expect(offers.priceCurrency).toBe('MAD');
    expect(offers.availability).toBe('https://schema.org/InStock');
    expect(offers.url).toBe('https://paraloca.ma/product/macaron-vanille');
  });

  it('reflects out-of-stock truthfully in Schema.org offers', () => {
    const outOfStockProduct: Product = {
      ...sampleProduct,
      inventory: {
        status: 'OUT_OF_STOCK',
        quantity: 0,
        backordersAllowed: false,
        isPurchasable: false,
      },
    };

    const jsonLd = buildProductJsonLd(outOfStockProduct, {
      canonicalUrl: 'https://paraloca.ma/product/macaron-vanille',
    });

    const offers = jsonLd.offers as Record<string, unknown>;
    expect(offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('generates Schema.org Category BreadcrumbList JSON-LD', () => {
    const breadcrumbs = buildCategoryJsonLd(
      { name: 'Pâtisseries', slug: 'patisseries' },
      {
        siteUrl: 'https://paraloca.ma',
        canonicalUrl: 'https://paraloca.ma/catalog/patisseries',
      }
    );

    expect(breadcrumbs['@context']).toBe('https://schema.org');
    expect(breadcrumbs['@type']).toBe('BreadcrumbList');
    expect(breadcrumbs.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://paraloca.ma' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Pâtisseries',
        item: 'https://paraloca.ma/catalog/patisseries',
      },
    ]);
  });
});

describe('Robots and Sitemap routes (ECO-405)', () => {
  it('generates robots.txt rules protecting private endpoints and specifying sitemap URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://paraloca.ma';
    const rules = robots();

    expect(rules.sitemap).toBe('https://paraloca.ma/sitemap.xml');
    expect(Array.isArray(rules.rules)).toBe(true);

    const mainRule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
    expect(mainRule.userAgent).toBe('*');
    expect(mainRule.allow).toBe('/');

    const disallow = Array.isArray(mainRule.disallow) ? mainRule.disallow : [mainRule.disallow];
    expect(disallow).toContain('/api/');
    expect(disallow).toContain('/cart');
    expect(disallow).toContain('/checkout');
    expect(disallow).toContain('/order');
    expect(disallow).toContain('/quote');
    expect(disallow).toContain('/search');
  });

  it('generates sitemap entries with public static pages, categories, and products', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://paraloca.ma';
    const entries = await sitemap();

    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);

    const urls = entries.map((e) => e.url);

    // Public static routes are present
    expect(urls).toContain('https://paraloca.ma');
    expect(urls).toContain('https://paraloca.ma/catalog');
    expect(urls).toContain('https://paraloca.ma/about-us');
    expect(urls).toContain('https://paraloca.ma/contact-us');

    // Private routes are never present
    expect(urls.some((u) => u.includes('/cart'))).toBe(false);
    expect(urls.some((u) => u.includes('/checkout'))).toBe(false);
    expect(urls.some((u) => u.includes('/order'))).toBe(false);
    expect(urls.some((u) => u.includes('/quote'))).toBe(false);
    expect(urls.some((u) => u.includes('/api/'))).toBe(false);
  });
});
