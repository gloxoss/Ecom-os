import { describe, it, expect } from 'vitest';
import type { Product, Variation } from '../../types';
import {
  projectProduct,
  projectVariation,
  projectCatalog,
} from '../projection';
import {
  computeRelevanceScore,
  isTechnicalIdentifier,
  allowsTypoCorrection,
  normalizeSku,
  normalizeText,
} from '../ranking';
import { NativeWooSearchProvider } from '../native-woo-provider';

describe('ECO-302: Safe Product Search Projection & Exact SKU Ranking', () => {
  const sampleVariations: Variation[] = [
    {
      id: 'var_50ml',
      sku: 'CREME-HYDRA-50ML',
      name: '50ml',
      price: { amount_minor: 18000, currency: 'MAD' },
      stock_quantity: 15,
      inventory: {
        status: 'IN_STOCK',
        quantity: 15,
        backordersAllowed: false,
        isPurchasable: true,
      },
      attributes: [{ name: 'Contenance', value: '50ml' }],
      image: {
        url: 'https://cdn.example.com/creme-50ml.jpg',
        altText: 'Crème 50ml flacon',
      },
    },
    {
      id: 'var_100ml',
      sku: 'CREME-HYDRA-100ML',
      name: '100ml',
      price: { amount_minor: 29000, currency: 'MAD' },
      stock_quantity: 0,
      inventory: {
        status: 'OUT_OF_STOCK',
        quantity: 0,
        backordersAllowed: false,
        isPurchasable: false,
      },
      attributes: [{ name: 'Contenance', value: '100ml' }],
    },
  ];

  const sampleProduct: Product = {
    id: 'prod_creme_hydra',
    slug: 'creme-hydratante-bio',
    name: 'Crème Hydratante Bio Éclat',
    sku: 'CREME-HYDRA-PARENT',
    description: 'Une crème hydratante enrichie à l’huile d’argan biologique du Maroc.',
    shortDescription: 'Crème visage bio régénérante.',
    price: { amount_minor: 18000, currency: 'MAD' },
    inventory: {
      status: 'IN_STOCK',
      quantity: 15,
      backordersAllowed: false,
      isPurchasable: true,
    },
    images: [
      {
        url: 'https://cdn.example.com/creme-main.jpg',
        altText: 'Crème Hydratante Pot',
      },
    ],
    categories: ['soins-visage', 'bio'],
    categoryDetails: [
      { id: 'cat_visage', name: 'Soins du Visage', slug: 'soins-visage' },
      { id: 'cat_bio', name: 'Produits Bio', slug: 'bio' },
    ],
    brand: {
      id: 'brand_argania',
      name: 'Argania Prestige',
      slug: 'argania-prestige',
    },
    variations: sampleVariations,
    attributes: [
      { name: 'Texture', options: ['Onctueuse'], visible: true },
      { name: 'Application', options: ['Matin', 'Soir'], visible: true },
    ],
    technicalAttributes: [
      { name: 'Volume_Base', label: 'Volume Base', value: '50ml' },
      { name: 'Certification', label: 'Certification', value: 'Ecocert Bio' },
    ],
  };

  describe('1. Product Search Projection (projectProduct)', () => {
    it('projects authoritative Product into a normalized SearchDocument with public fields', () => {
      const doc = projectProduct(sampleProduct);

      expect(doc.id).toBe('prod_creme_hydra');
      expect(doc.slug).toBe('creme-hydratante-bio');
      expect(doc.title).toBe('Crème Hydratante Bio Éclat');
      expect(doc.sku).toBe('CREME-HYDRA-PARENT');
      expect(doc.priceMinor).toBe(18000);
      expect(doc.currency).toBe('MAD');
      expect(doc.inStock).toBe(true);
      expect(doc.availabilityStatus).toBe('IN_STOCK');
      expect(doc.isPurchasable).toBe(true);
      expect(doc.thumbnail).toBe('https://cdn.example.com/creme-main.jpg');
      expect(doc.image?.url).toBe('https://cdn.example.com/creme-main.jpg');
      expect(doc.image?.alt).toBe('Crème Hydratante Pot');
      expect(doc.brand?.name).toBe('Argania Prestige');
      expect(doc.categories).toHaveLength(2);
      expect(doc.categories[0]?.name).toBe('Soins du Visage');
    });

    it('projects nested variation metadata preserving variation SKUs, pricing and stock', () => {
      const doc = projectProduct(sampleProduct);

      expect(doc.variationCount).toBe(2);
      expect(doc.variations).toHaveLength(2);

      const var50 = doc.variations?.[0];
      expect(var50?.id).toBe('var_50ml');
      expect(var50?.sku).toBe('CREME-HYDRA-50ML');
      expect(var50?.priceMinor).toBe(18000);
      expect(var50?.inStock).toBe(true);
      expect(var50?.attributes?.['Contenance']).toBe('50ml');

      const var100 = doc.variations?.[1];
      expect(var100?.id).toBe('var_100ml');
      expect(var100?.sku).toBe('CREME-HYDRA-100ML');
      expect(var100?.priceMinor).toBe(29000);
      expect(var100?.inStock).toBe(false);
    });

    it('maps safe technical and public attributes while preserving types', () => {
      const doc = projectProduct(sampleProduct);

      expect(doc.attributes?.['Texture']).toBe('Onctueuse');
      expect(doc.attributes?.['Application']).toEqual(['Matin', 'Soir']);
      expect(doc.attributes?.['Certification']).toBe('Ecocert Bio');
    });

    it('handles minimal product without variations, brand, or images deterministically', () => {
      const minimalProduct: Product = {
        id: 'prod_simple',
        slug: 'savon-noir',
        name: 'Savon Noir Traditionnel',
        description: 'Savon noir beldi.',
        price: { amount_minor: 4500, currency: 'MAD' },
        images: [],
        categories: ['hammam'],
      };

      const doc = projectProduct(minimalProduct);
      expect(doc.id).toBe('prod_simple');
      expect(doc.sku).toBeUndefined();
      expect(doc.brand).toBeUndefined();
      expect(doc.thumbnail).toBeUndefined();
      expect(doc.variations).toBeUndefined();
      expect(doc.categories[0]?.slug).toBe('hammam');
    });
  });

  describe('2. Standalone Variation Projection (projectVariation & projectCatalog)', () => {
    it('projects standalone variation document with parent reference and dedicated SKU/image', () => {
      const varDoc = projectVariation(sampleProduct, sampleVariations[0]!);

      expect(varDoc.id).toBe('prod_creme_hydra:var_50ml');
      expect(varDoc.parentId).toBe('prod_creme_hydra');
      expect(varDoc.isVariation).toBe(true);
      expect(varDoc.title).toBe('Crème Hydratante Bio Éclat - 50ml');
      expect(varDoc.sku).toBe('CREME-HYDRA-50ML');
      expect(varDoc.priceMinor).toBe(18000);
      expect(varDoc.thumbnail).toBe('https://cdn.example.com/creme-50ml.jpg');
      expect(varDoc.inStock).toBe(true);
      expect(varDoc.attributes?.['Contenance']).toBe('50ml');
    });

    it('projectCatalog batches products and optional standalone variation documents', () => {
      const docsWithoutVars = projectCatalog([sampleProduct], {
        includeVariationsAsSeparateDocuments: false,
      });
      expect(docsWithoutVars).toHaveLength(1);

      const docsWithVars = projectCatalog([sampleProduct], {
        includeVariationsAsSeparateDocuments: true,
      });
      // 1 parent + 2 variations = 3 documents
      expect(docsWithVars).toHaveLength(3);
      expect(docsWithVars.filter((d) => d.isVariation)).toHaveLength(2);
    });
  });

  describe('3. Security Invariants & Private Data Containment', () => {
    it('strictly rejects any private customer or session tokens in projection input', () => {
      const taintedProduct = {
        ...sampleProduct,
        customerEmail: 'admin@example.com',
      } as unknown as Product;

      expect(() => projectProduct(taintedProduct)).toThrow(/private field "customerEmail"/);
    });

    it('strictly rejects private quotes, RFQs and secret tokens', () => {
      const taintedQuote = {
        ...sampleProduct,
        quoteSecret: 'rfq-secret-token-xyz',
      } as unknown as Product;

      expect(() => projectProduct(taintedQuote)).toThrow(/private field "quoteSecret"/);

      const taintedRfq = {
        ...sampleProduct,
        rfqId: 'rfq_12345',
      } as unknown as Product;

      expect(() => projectProduct(taintedRfq)).toThrow(/private field "rfqId"/);
    });
  });

  describe('4. SKU Exact-Match Priority Ranking', () => {
    it('ranks exact SKU matches with score 1000 over partial title matches', () => {
      const targetDoc = projectProduct(sampleProduct);
      const otherDoc = projectProduct({
        id: 'prod_other',
        slug: 'autre-creme-hydra-parent',
        name: 'CREME-HYDRA-PARENT Mentioned In Title',
        description: 'Notice this is not the sku.',
        price: { amount_minor: 10000, currency: 'MAD' },
        images: [],
        categories: [],
      });

      const scoreTarget = computeRelevanceScore(targetDoc, 'CREME-HYDRA-PARENT');
      const scoreOther = computeRelevanceScore(otherDoc, 'CREME-HYDRA-PARENT');

      expect(scoreTarget.matchType).toBe('exact_sku');
      expect(scoreTarget.score).toBe(1000);

      // Other doc only matched in title prefix (score 400 vs 1000)
      expect(scoreOther.score).toBeLessThan(scoreTarget.score);
      expect(scoreOther.matchType).toBe('title_prefix');
    });

    it('ranks variation SKU match with score 950 ahead of general text matches', () => {
      const doc = projectProduct(sampleProduct);
      const score = computeRelevanceScore(doc, 'CREME-HYDRA-100ML');

      expect(score.matchType).toBe('variation_sku');
      expect(score.score).toBe(950);
    });

    it('integrates exact SKU priority into NativeWooSearchProvider search results', async () => {
      const productWithSkuMatch = projectProduct({
        id: 'prod_exact_sku',
        slug: 'piece-detachee-iso',
        name: 'Vanne Papillon Inox',
        sku: 'VAL-ISO-204',
        description: 'Vanne industrielle.',
        price: { amount_minor: 50000, currency: 'MAD' },
        images: [],
        categories: [],
      });

      const productWithTitleMatch = projectProduct({
        id: 'prod_title_mention',
        slug: 'joint-pour-val-iso-204',
        name: 'VAL-ISO-204 Joint d’étanchéité',
        sku: 'JOINT-001',
        description: 'Joint pour vanne.',
        price: { amount_minor: 5000, currency: 'MAD' },
        images: [],
        categories: [],
      });

      const provider = new NativeWooSearchProvider([
        productWithTitleMatch, // inserted first
        productWithSkuMatch,   // inserted second
      ]);

      const result = await provider.search({ term: 'VAL-ISO-204', sort: 'relevance' });

      // The item with exact SKU VAL-ISO-204 MUST be ranked first!
      expect(result.items[0]?.id).toBe('prod_exact_sku');
      expect(result.items[1]?.id).toBe('prod_title_mention');
    });
  });

  describe('5. Technical Reference Typo Correction Disabling', () => {
    it('correctly classifies technical SKU references vs natural French words', () => {
      // Technical identifiers: letters+numbers, delimiters, uppercase part numbers
      expect(isTechnicalIdentifier('VAL-102')).toBe(true);
      expect(isTechnicalIdentifier('ARGAN-PURE-50ML')).toBe(true);
      expect(isTechnicalIdentifier('REF_987')).toBe(true);
      expect(isTechnicalIdentifier('ISO-9001')).toBe(true);
      expect(isTechnicalIdentifier('SKU12345')).toBe(true);
      expect(isTechnicalIdentifier('M12')).toBe(true);

      // Natural words: no numbers, standard dictionary words
      expect(isTechnicalIdentifier('creme')).toBe(false);
      expect(isTechnicalIdentifier('hydratante')).toBe(false);
      expect(isTechnicalIdentifier('shampoing')).toBe(false);
      expect(isTechnicalIdentifier('huile')).toBe(false);
      expect(isTechnicalIdentifier('bio')).toBe(false);
    });

    it('disables typo correction for technical references and allows it for natural terms', () => {
      expect(allowsTypoCorrection('VAL-102')).toBe(false);
      expect(allowsTypoCorrection('ARGAN-PURE-50ML')).toBe(false);
      expect(allowsTypoCorrection('P-204')).toBe(false);

      expect(allowsTypoCorrection('creme hydratante')).toBe(true);
      expect(allowsTypoCorrection('argan')).toBe(true);
    });
  });

  describe('6. French Diacritic Folding & Localized Search', () => {
    it('folds French diacritics so unaccented queries match accented titles and brands', () => {
      expect(normalizeText('Crème Hydratante Bio')).toBe('creme hydratante bio');
      expect(normalizeText('Éclat & Pureté')).toBe('eclat & purete');
      expect(normalizeText('À l’huile d’argan')).toBe('a l’huile d’argan');

      const doc = projectProduct({
        id: 'prod_creme',
        slug: 'creme-visage',
        name: 'Crème Hydratante Bio',
        sku: 'SOIN-001',
        description: 'Soin bio.',
        price: { amount_minor: 12000, currency: 'MAD' },
        images: [],
        categories: [],
      });
      // Query without accents matches accented title
      const score = computeRelevanceScore(doc, 'creme');
      expect(score.score).toBe(400); // title_prefix
      expect(score.matchType).toBe('title_prefix');
    });

    it('searches and finds French accented catalog items in NativeWooSearchProvider with unaccented queries', async () => {
      const doc = projectProduct(sampleProduct);
      const provider = new NativeWooSearchProvider([doc]);

      // Query without accents: "creme" matches "Crème"
      const result = await provider.search({ term: 'creme' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.id).toBe('prod_creme_hydra');

      // Query without accents: "eclat" matches "Éclat"
      const result2 = await provider.search({ term: 'eclat' });
      expect(result2.items).toHaveLength(1);
    });
  });
});
