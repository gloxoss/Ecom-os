import { describe, it, expect, vi } from 'vitest';
import {
  mapStockStatus,
  mapInventory,
  mapImages,
  mapVariations,
  mapCategory,
  buildCategoryTree,
  mapProduct,
  WCProduct,
  WCCategory,
} from '../mappers';
import { fetchProducts, fetchCategories, fetchProductBySlug } from '../products';
import { gqlClient } from '../graphql';

describe('ECO-102: WooCommerce Catalog & Category Mapping', () => {
  describe('Stock status and Inventory Availability mapping', () => {
    it('normalizes WooCommerce stock statuses correctly', () => {
      expect(mapStockStatus('IN_STOCK')).toBe('IN_STOCK');
      expect(mapStockStatus('instock')).toBe('IN_STOCK');
      expect(mapStockStatus('ON_BACKORDER')).toBe('ON_BACKORDER');
      expect(mapStockStatus('onbackorder')).toBe('ON_BACKORDER');
      expect(mapStockStatus('outofstock')).toBe('OUT_OF_STOCK');
      expect(mapStockStatus('OUT_OF_STOCK')).toBe('OUT_OF_STOCK');
      expect(mapStockStatus(null)).toBe('OUT_OF_STOCK');
      expect(mapStockStatus(undefined)).toBe('OUT_OF_STOCK');
    });

    it('maps inventory availability with purchasable and backorder flags', () => {
      const inStock = mapInventory({ stockStatus: 'instock', stockQuantity: 45 });
      expect(inStock.status).toBe('IN_STOCK');
      expect(inStock.quantity).toBe(45);
      expect(inStock.backordersAllowed).toBe(false);
      expect(inStock.isPurchasable).toBe(true);

      const outOfStock = mapInventory({ stockStatus: 'outofstock', stockQuantity: 0 });
      expect(outOfStock.status).toBe('OUT_OF_STOCK');
      expect(outOfStock.quantity).toBe(0);
      expect(outOfStock.isPurchasable).toBe(false);

      const backorder = mapInventory({ stockStatus: 'onbackorder', stockQuantity: 0 });
      expect(backorder.status).toBe('ON_BACKORDER');
      expect(backorder.backordersAllowed).toBe(true);
      expect(backorder.isPurchasable).toBe(true);
    });
  });

  describe('Images and Gallery mapping', () => {
    it('maps primary image and gallery images without duplicates', () => {
      const primary = { sourceUrl: 'https://example.com/img1.jpg', altText: 'Primary image', title: 'Main' };
      const gallery = {
        nodes: [
          { sourceUrl: 'https://example.com/img1.jpg', altText: 'Duplicate' },
          { sourceUrl: 'https://example.com/img2.jpg', altText: 'Gallery 2', title: 'Detail' },
          { sourceUrl: 'https://example.com/img3.jpg', altText: 'Gallery 3' },
        ],
      };

      const images = mapImages(primary, gallery);
      expect(images).toHaveLength(3);
      expect(images[0]).toEqual({
        url: 'https://example.com/img1.jpg',
        altText: 'Primary image',
        title: 'Main',
      });
      expect(images[1]?.url).toBe('https://example.com/img2.jpg');
      expect(images[2]?.url).toBe('https://example.com/img3.jpg');
    });

    it('handles products with no images gracefully', () => {
      const images = mapImages(null, null);
      expect(images).toEqual([]);
    });
  });

  describe('Variation mapping', () => {
    it('maps variation attributes, stock, pricing, and backward-compatible fields', () => {
      const rawVariations = [
        {
          databaseId: 101,
          sku: 'VAR-S-RED',
          name: 'Item - Small Red',
          price: '45.00',
          regularPrice: '50.00',
          salePrice: '45.00',
          stockStatus: 'instock',
          stockQuantity: 12,
          image: { sourceUrl: 'https://example.com/red.jpg', altText: 'Red variant' },
          attributes: {
            nodes: [
              { name: 'size', value: 'S', label: 'Taille' },
              { name: 'color', value: 'red', label: 'Couleur' },
            ],
          },
        },
      ];

      const variations = mapVariations(rawVariations, 'MAD');
      expect(variations).toHaveLength(1);
      const v = variations[0]!;
      expect(v.id).toBe('101');
      expect(v.sku).toBe('VAR-S-RED');
      expect(v.price).toEqual({ amount_minor: 4500, currency: 'MAD' });
      expect(v.regularPrice).toEqual({ amount_minor: 5000, currency: 'MAD' });
      expect(v.salePrice).toEqual({ amount_minor: 4500, currency: 'MAD' });
      expect(v.stock_quantity).toBe(12);
      expect(v.inventory?.status).toBe('IN_STOCK');
      expect(v.attributes).toEqual([
        { name: 'size', value: 'S', label: 'Taille' },
        { name: 'color', value: 'red', label: 'Couleur' },
      ]);
      expect(v.image?.url).toBe('https://example.com/red.jpg');
      expect(v.isPurchasable).toBe(true);
    });
  });

  describe('Category tree resolution', () => {
    it('maps categories and builds hierarchical parent-child trees', () => {
      const flatRaw: WCCategory[] = [
        {
          databaseId: 1,
          slug: 'equipment',
          name: 'Équipement',
          description: 'Catégorie principale',
          parentDatabaseId: null,
          count: 20,
        },
        {
          databaseId: 2,
          slug: 'monitoring',
          name: 'Monitoring',
          parentDatabaseId: 1,
          count: 8,
        },
        {
          databaseId: 3,
          slug: 'pulse-oximeters',
          name: 'Oxymètres',
          parentDatabaseId: 2,
          count: 5,
        },
      ];

      const categories = flatRaw.map(mapCategory);
      expect(categories[0]?.id).toBe('1');
      expect(categories[1]?.parentId).toBe('1');
      expect(categories[2]?.parentId).toBe('2');

      const tree = buildCategoryTree(categories);
      expect(tree).toHaveLength(3); // All categories are present in the list
      const root = tree.find((c) => c.id === '1')!;
      expect(root.children).toHaveLength(1);
      const child1 = root.children?.[0];
      expect(child1?.id).toBe('2');
      const child2 = child1?.children?.[0];
      expect(child2?.id).toBe('3');
    });
  });

  describe('Product mapping', () => {
    it('maps simple products with sku, inventory, and categories', () => {
      const raw: WCProduct = {
        databaseId: 12,
        slug: 'ecomos-test-simple',
        name: 'EcomOS TEST simple item',
        sku: 'ECOMOS-TEST-SIMPLE',
        __typename: 'SimpleProduct',
        description: '<p>A simple product</p>',
        shortDescription: 'Short desc',
        price: '39.95',
        regularPrice: '45.00',
        stockStatus: 'instock',
        stockQuantity: 18,
        image: { sourceUrl: 'https://example.com/p12.jpg', altText: 'Photo' },
        productCategories: {
          nodes: [
            { databaseId: 16, slug: 'ecomos-test-fixtures', name: 'EcomOS test fixtures' },
          ],
        },
      };

      const product = mapProduct(raw, 'MAD');
      expect(product.id).toBe('12');
      expect(product.slug).toBe('ecomos-test-simple');
      expect(product.sku).toBe('ECOMOS-TEST-SIMPLE');
      expect(product.type).toBe('simple');
      expect(product.price).toEqual({ amount_minor: 3995, currency: 'MAD' });
      expect(product.regularPrice).toEqual({ amount_minor: 4500, currency: 'MAD' });
      expect(product.inventory?.status).toBe('IN_STOCK');
      expect(product.inventory?.quantity).toBe(18);
      expect(product.categories).toEqual(['ecomos-test-fixtures']);
      expect(product.categoryDetails?.[0]?.name).toBe('EcomOS test fixtures');
      expect(product.isPurchasable).toBe(true);
    });

    it('maps variable products with variations and calculated priceRange', () => {
      const raw: WCProduct = {
        databaseId: 13,
        slug: 'ecomos-test-variable',
        name: 'EcomOS TEST variable item',
        sku: 'ECOMOS-TEST-VARIABLE',
        __typename: 'VariableProduct',
        price: '79.50',
        stockStatus: 'instock',
        stockQuantity: 19,
        variations: {
          nodes: [
            {
              databaseId: 14,
              sku: 'ECOMOS-VAR-STD',
              name: 'Standard',
              price: '79.50',
              stockStatus: 'instock',
              stockQuantity: 10,
              attributes: { nodes: [{ name: 'size', value: 'Standard' }] },
            },
            {
              databaseId: 15,
              sku: 'ECOMOS-VAR-PRO',
              name: 'Pro',
              price: '119.50',
              stockStatus: 'instock',
              stockQuantity: 9,
              attributes: { nodes: [{ name: 'size', value: 'Pro' }] },
            },
          ],
        },
      };

      const product = mapProduct(raw, 'MAD');
      expect(product.type).toBe('variable');
      expect(product.variations).toHaveLength(2);
      expect(product.variants).toHaveLength(2); // backward compat alias
      expect(product.priceRange).toEqual({
        min: { amount_minor: 7950, currency: 'MAD' },
        max: { amount_minor: 11950, currency: 'MAD' },
      });
    });

    it('maps related products correctly', () => {
      const raw: WCProduct = {
        databaseId: 20,
        slug: 'main-item',
        name: 'Main Item',
        price: '100.00',
        related: {
          nodes: [
            {
              databaseId: 21,
              slug: 'related-item',
              name: 'Related Item',
              price: '50.00',
              image: { sourceUrl: 'https://example.com/rel.jpg', altText: 'Rel' },
            },
          ],
        },
      };

      const product = mapProduct(raw, 'MAD');
      expect(product.relatedProducts).toHaveLength(1);
      const rel = product.relatedProducts?.[0];
      expect(rel?.id).toBe('21');
      expect(rel?.price).toEqual({ amount_minor: 5000, currency: 'MAD' });
    });
  });

  describe('Explicit upstream error handling in GraphQL queries', () => {
    it('throws explicit error when fetchProducts encounters upstream failure', async () => {
      vi.spyOn(gqlClient, 'request').mockRejectedValueOnce(new Error('Network connection refused (ECONNREFUSED)'));
      await expect(fetchProducts()).rejects.toThrow(/Failed to fetch products from WooCommerce: Network connection refused/);
    });

    it('throws explicit error when fetchCategories encounters upstream failure', async () => {
      vi.spyOn(gqlClient, 'request').mockRejectedValueOnce(new Error('Upstream timeout 504 Gateway Timeout'));
      await expect(fetchCategories()).rejects.toThrow(/Failed to fetch categories from WooCommerce: Upstream timeout/);
    });

    it('throws explicit error when fetchProductBySlug is called with invalid slug', async () => {
      await expect(fetchProductBySlug('')).rejects.toThrow(/A valid product slug must be provided/);
    });

    it('throws explicit error when fetchProductBySlug encounters upstream failure', async () => {
      vi.spyOn(gqlClient, 'request').mockRejectedValueOnce(new Error('GraphQL query syntax error'));
      await expect(fetchProductBySlug('test-slug')).rejects.toThrow(/Failed to fetch product 'test-slug' from WooCommerce/);
    });
  });
});

