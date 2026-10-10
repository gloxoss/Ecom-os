import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WooCommerceEngine } from '../client';
import {
  checkBrandsCapability,
  fetchBrands,
  fetchBrandBySlug,
  resetBrandsCapabilityCache,
} from '../brands';
import { mapBrand, mapProduct } from '../mappers';
import { gqlClient } from '../graphql';
import * as restModule from '../rest';

describe('WooCommerce native brands capability and mapping', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetBrandsCapabilityCache();
  });

  describe('checkBrandsCapability', () => {
    it('detects GraphQL support when productBrands query succeeds', async () => {
      vi.spyOn(gqlClient, 'request').mockResolvedValueOnce({
        productBrands: { nodes: [] },
      });

      const capability = await checkBrandsCapability();
      expect(capability.supported).toBe(true);
      expect(capability.source).toBe('graphql');
    });

    it('falls back to REST when GraphQL schema rejects productBrands field', async () => {
      vi.spyOn(gqlClient, 'request').mockRejectedValueOnce(
        new Error('Cannot query field "productBrands" on type "RootQuery".')
      );
      vi.spyOn(restModule, 'restFetch').mockResolvedValueOnce([
        { id: 1, name: 'Brand A', slug: 'brand-a' },
      ]);

      const capability = await checkBrandsCapability();
      expect(capability.supported).toBe(true);
      expect(capability.source).toBe('rest');
    });

    it('reports unsupported when both GraphQL and REST fail', async () => {
      vi.spyOn(gqlClient, 'request').mockRejectedValueOnce(
        new Error('Cannot query field "productBrands" on type "RootQuery".')
      );
      vi.spyOn(restModule, 'restFetch').mockRejectedValueOnce(
        new Error('WooCommerce REST request failed with HTTP 404')
      );

      const capability = await checkBrandsCapability();
      expect(capability.supported).toBe(false);
      expect(capability.reason).toMatch(/not available/i);
    });

    it('distinguishes unsupported capability from an empty brand catalog', async () => {
      // Empty catalog: GraphQL supported, but returns 0 brands
      vi.spyOn(gqlClient, 'request')
        .mockResolvedValueOnce({ productBrands: { nodes: [] } }) // capability check probe
        .mockResolvedValueOnce({ productBrands: { nodes: [] } }); // fetchBrands query

      const capability = await checkBrandsCapability();
      expect(capability.supported).toBe(true);

      const brands = await fetchBrands();
      expect(brands).toEqual([]);
    });
  });

  describe('mapBrand neutrality and contract compliance', () => {
    it('maps raw brand to neutral domain Brand contract', () => {
      const raw = {
        databaseId: 42,
        slug: 'stethotech',
        name: 'StethoTech',
        description: 'Precision diagnostic acoustics',
        websiteUrl: 'https://example.com/stethotech',
        isOwned: true,
        image: {
          sourceUrl: 'https://example.com/images/stetho.png',
          altText: 'StethoTech Logo',
        },
      };

      const mapped = mapBrand(raw);
      expect(mapped.id).toBe('42');
      expect(mapped.slug).toBe('stethotech');
      expect(mapped.name).toBe('StethoTech');
      expect(mapped.description).toBe('Precision diagnostic acoustics');
      expect(mapped.websiteUrl).toBe('https://example.com/stethotech');
      expect(mapped.isOwned).toBe(true);
      expect(mapped.logo).toEqual({
        url: 'https://example.com/images/stetho.png',
        altText: 'StethoTech Logo',
      });
    });

    it('preserves third-party brand with optional fields omitted', () => {
      const raw = {
        id: 'external-99',
        slug: 'generi-care',
        name: 'GeneriCare',
      };

      const mapped = mapBrand(raw);
      expect(mapped.id).toBe('external-99');
      expect(mapped.slug).toBe('generi-care');
      expect(mapped.name).toBe('GeneriCare');
      expect(mapped.description).toBeUndefined();
      expect(mapped.logo).toBeUndefined();
      expect(mapped.isOwned).toBeUndefined();
    });
  });

  describe('mapProduct brand projection', () => {
    it('attaches primary brand to product when productBrands is present', () => {
      const rawProduct = {
        databaseId: 501,
        slug: 'diagnostic-kit',
        name: 'Complete Diagnostic Kit',
        price: '350.00',
        productBrands: {
          nodes: [
            {
              databaseId: 10,
              slug: 'omron',
              name: 'Omron Healthcare',
            },
            {
              databaseId: 11,
              slug: 'secondary-brand',
              name: 'Secondary',
            },
          ],
        },
      };

      const mapped = mapProduct(rawProduct as any, 'MAD');
      expect(mapped.brand).toBeDefined();
      expect(mapped.brand?.id).toBe('10');
      expect(mapped.brand?.slug).toBe('omron');
      expect(mapped.brand?.name).toBe('Omron Healthcare');
    });

    it('leaves product brand undefined when product has no brands', () => {
      const rawProduct = {
        databaseId: 502,
        slug: 'unbranded-gauze',
        name: 'Sterile Gauze',
        price: '15.00',
      };

      const mapped = mapProduct(rawProduct as any, 'MAD');
      expect(mapped.brand).toBeUndefined();
    });
  });

  describe('WooCommerceEngine brand methods', () => {
    it('listBrands returns mapped Brand items', async () => {
      vi.spyOn(gqlClient, 'request')
        .mockResolvedValueOnce({ productBrands: { nodes: [] } }) // capability check probe
        .mockResolvedValueOnce({
          productBrands: {
            nodes: [
              { databaseId: 1, slug: 'b1', name: 'Brand One' },
              { databaseId: 2, slug: 'b2', name: 'Brand Two' },
            ],
          },
        });

      const engine = new WooCommerceEngine();
      const brands = await engine.listBrands();
      expect(brands.length).toBe(2);
      expect(brands[0]!.slug).toBe('b1');
      expect(brands[1]!.slug).toBe('b2');
    });

    it('getBrand returns mapped Brand by slug', async () => {
      vi.spyOn(gqlClient, 'request')
        .mockResolvedValueOnce({ productBrands: { nodes: [] } }) // capability check
        .mockResolvedValueOnce({
          productBrand: { databaseId: 77, slug: 'specialist', name: 'Specialist Equipment' },
        });

      const engine = new WooCommerceEngine();
      const brand = await engine.getBrand('specialist');
      expect(brand).not.toBeNull();
      expect(brand?.id).toBe('77');
      expect(brand?.name).toBe('Specialist Equipment');
    });

    it('getBrand returns null when brand does not exist', async () => {
      vi.spyOn(gqlClient, 'request')
        .mockResolvedValueOnce({ productBrands: { nodes: [] } }) // capability check
        .mockResolvedValueOnce({ productBrand: null });

      const engine = new WooCommerceEngine();
      const brand = await engine.getBrand('nonexistent');
      expect(brand).toBeNull();
    });
  });
});
