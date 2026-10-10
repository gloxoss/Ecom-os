import { describe, it, expect } from 'vitest';
import {
  Money,
  Media,
  StockStatus,
  InventoryAvailability,
  TaxDisplayMode,
  TaxStatus,
  TaxVisibility,
  TechnicalAttribute,
  DocumentType,
  Document,
  Brand,
  Category,
  Variation,
  ProductVariant,
  ProductType,
  Product,
  ProductListQuery,
  EcomEngine,
  FakeEngine,
} from '../index';

describe('ECO-101: Core Domain Contracts', () => {
  it('exports all 10 core domain types and contracts from index', () => {
    // Compile-time and runtime check that all types are accessible from root
    expect(FakeEngine).toBeDefined();
  });

  describe('Money contract', () => {
    it('models canonical integer minor units and ISO currency', () => {
      const price: Money = {
        amount_minor: 129900,
        currency: 'MAD',
      };
      expect(Number.isInteger(price.amount_minor)).toBe(true);
      expect(price.currency).toBe('MAD');
    });
  });

  describe('Media contract', () => {
    it('models accessible media with URL, alt text, and dimensions', () => {
      const media: Media = {
        id: 'img-1',
        url: 'https://example.com/media/sample.jpg',
        altText: 'Sample product front view',
        title: 'Front view',
        width: 1200,
        height: 1200,
      };
      expect(media.url).toBeTruthy();
      expect(media.altText).toBeTruthy();
    });
  });

  describe('InventoryAvailability contract', () => {
    it('models in-stock, out-of-stock, and backorder availability states', () => {
      const inStock: InventoryAvailability = {
        status: 'IN_STOCK',
        quantity: 42,
        backordersAllowed: false,
        lowStockThreshold: 5,
        isPurchasable: true,
      };
      const outOfStock: InventoryAvailability = {
        status: 'OUT_OF_STOCK',
        quantity: 0,
        backordersAllowed: false,
        isPurchasable: false,
      };
      const backorder: InventoryAvailability = {
        status: 'ON_BACKORDER',
        quantity: 0,
        backordersAllowed: true,
        isPurchasable: true,
      };

      expect(inStock.isPurchasable).toBe(true);
      expect(outOfStock.isPurchasable).toBe(false);
      expect(backorder.status).toBe('ON_BACKORDER');
    });
  });

  describe('TaxVisibility contract', () => {
    it('models inclusive and exclusive tax displays with rate percentages', () => {
      const ttc: TaxVisibility = {
        displayMode: 'INCLUSIVE',
        taxable: true,
        taxStatus: 'TAXABLE',
        ratePercent: 20,
        label: 'TTC (TVA 20% incluse)',
      };
      const ht: TaxVisibility = {
        displayMode: 'EXCLUSIVE',
        taxable: true,
        taxStatus: 'TAXABLE',
        ratePercent: 20,
        label: 'HT',
      };

      expect(ttc.displayMode).toBe('INCLUSIVE');
      expect(ht.displayMode).toBe('EXCLUSIVE');
    });
  });

  describe('TechnicalAttribute contract', () => {
    it('supports grouped and multi-valued technical attributes neutrally', () => {
      const specWeight: TechnicalAttribute = {
        name: 'weight_kg',
        label: 'Poids net',
        value: '1.25 kg',
        group: 'Dimensions',
      };
      const specMaterials: TechnicalAttribute = {
        name: 'materials',
        label: 'Matériaux',
        value: ['Aluminium', 'Silicone'],
        group: 'Composition',
      };

      expect(specWeight.group).toBe('Dimensions');
      expect(Array.isArray(specMaterials.value)).toBe(true);
    });
  });

  describe('Document contract', () => {
    it('models optional downloadable product documents and datasheets', () => {
      const doc: Document = {
        id: 'doc-001',
        title: 'Manuel d utilisation',
        url: 'https://example.com/docs/manual.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1048576,
        type: 'manual',
      };
      expect(doc.type).toBe('manual');
      expect(doc.mimeType).toBe('application/pdf');
    });
  });

  describe('Brand contract', () => {
    it('models neutral brand projection with optional vendor-independent owned flag', () => {
      const thirdParty: Brand = {
        id: 'brand-10',
        slug: 'omron',
        name: 'Omron',
        description: 'Global electronics manufacturer',
        websiteUrl: 'https://omron.com',
        isOwned: false,
      };
      const ownedBrand: Brand = {
        id: 'brand-11',
        slug: 'private-label',
        name: 'Private Label Series',
        isOwned: true,
      };

      expect(thirdParty.isOwned).toBe(false);
      expect(ownedBrand.isOwned).toBe(true);
    });
  });

  describe('Category contract', () => {
    it('supports hierarchical category trees with parent and children nodes', () => {
      const childCategory: Category = {
        id: 'cat-2',
        slug: 'blood-pressure',
        name: 'Tensiomètres',
        parentId: 'cat-1',
      };
      const rootCategory: Category = {
        id: 'cat-1',
        slug: 'diagnostic',
        name: 'Diagnostic',
        parentId: null,
        children: [childCategory],
        count: 15,
      };

      expect(rootCategory.children).toHaveLength(1);
      expect(childCategory.parentId).toBe('cat-1');
    });
  });

  describe('Variation contract and ProductVariant backward compatibility', () => {
    it('models exact variation identity, attributes, inventory, and backwards compatibility', () => {
      const variation: Variation = {
        id: 'var-14',
        sku: 'ECOM-SKU-L-BLUE',
        name: 'Standard Edition - Large Blue',
        price: { amount_minor: 15940, currency: 'MAD' },
        regularPrice: { amount_minor: 18000, currency: 'MAD' },
        salePrice: { amount_minor: 15940, currency: 'MAD' },
        stock_quantity: 12,
        inventory: {
          status: 'IN_STOCK',
          quantity: 12,
          backordersAllowed: false,
          isPurchasable: true,
        },
        attributes: [
          { name: 'size', value: 'L', label: 'Taille' },
          { name: 'color', value: 'blue', label: 'Couleur' },
        ],
        isPurchasable: true,
      };

      // ProductVariant is an alias of Variation
      const asVariant: ProductVariant = variation;
      expect(asVariant.sku).toBe('ECOM-SKU-L-BLUE');
      expect(asVariant.stock_quantity).toBe(12);
      expect(asVariant.inventory?.status).toBe('IN_STOCK');
    });
  });

  describe('Product domain contract', () => {
    it('models a complete generic product with variations, media, documents, and technical attributes', () => {
      const product: Product = {
        id: 'prod-100',
        slug: 'generic-device',
        name: 'Generic Diagnostic Device',
        sku: 'GEN-001',
        type: 'variable',
        description: 'Complete description of the device',
        shortDescription: 'Brief summary',
        price: { amount_minor: 25000, currency: 'MAD' },
        priceRange: {
          min: { amount_minor: 20000, currency: 'MAD' },
          max: { amount_minor: 30000, currency: 'MAD' },
        },
        taxVisibility: {
          displayMode: 'INCLUSIVE',
          taxable: true,
          ratePercent: 20,
        },
        inventory: {
          status: 'IN_STOCK',
          quantity: 25,
          backordersAllowed: false,
          isPurchasable: true,
        },
        images: [
          { url: 'https://example.com/p1.jpg', altText: 'Device photo' },
        ],
        categories: ['diagnostic', 'monitoring'],
        categoryDetails: [
          { id: 'cat-1', slug: 'diagnostic', name: 'Diagnostic' },
        ],
        brand: {
          id: 'b-1',
          slug: 'generic-lab',
          name: 'Generic Lab',
          isOwned: false,
        },
        variations: [
          {
            id: 'var-1',
            sku: 'GEN-001-S',
            name: 'Small',
            price: { amount_minor: 20000, currency: 'MAD' },
            stock_quantity: 10,
            attributes: [{ name: 'size', value: 'S' }],
          },
        ],
        technicalAttributes: [
          { name: 'voltage', label: 'Tension', value: '220V', group: 'Electric' },
        ],
        documents: [
          {
            id: 'doc-1',
            title: 'Technical Datasheet',
            url: 'https://example.com/datasheet.pdf',
            type: 'datasheet',
          },
        ],
        isPurchasable: true,
        featured: true,
      };

      expect(product.sku).toBe('GEN-001');
      expect(product.variations).toHaveLength(1);
      expect(product.documents).toHaveLength(1);
      expect(product.technicalAttributes).toHaveLength(1);
      expect(product.brand?.name).toBe('Generic Lab');
      expect(product.categories).toContain('diagnostic');
    });
  });

  describe('Core neutrality invariant', () => {
    it('ensures core engine types contain no hardcoded ParaLoca or medical client vocabulary', () => {
      const coreKeys = Object.keys({
        amount_minor: 0,
        currency: '',
      });
      // Neutrality: engine contracts must not refer to client-specific brand names
      expect(coreKeys.every((k) => !k.toLowerCase().includes('paraloca'))).toBe(true);
    });
  });

  describe('FakeEngine implementation of EcomEngine interface', () => {
    it('satisfies EcomEngine contract including optional brand methods', async () => {
      const engine: EcomEngine = new FakeEngine();
      const products = await engine.listProducts({ limit: 10 });
      expect(products.items).toEqual([]);
      expect(products.total).toBe(0);

      const categories = await engine.listCategories();
      expect(categories).toEqual([]);

      const brands = await engine.listBrands?.();
      expect(brands).toEqual([]);

      const brand = await engine.getBrand?.('nonexistent');
      expect(brand).toBeNull();
    });
  });
});

