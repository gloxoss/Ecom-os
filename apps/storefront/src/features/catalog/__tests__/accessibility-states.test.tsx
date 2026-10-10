import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { ProductGridAnimated } from '../ui/product-grid-client';
import { ProductCard } from '../ui/product-card';
import type { Product } from '@ecom-os/engine';

// Mock GSAP and matchMedia for node environment
vi.mock('@gsap/react', () => ({
  useGSAP: vi.fn(),
}));

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    from: vi.fn(),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

const sampleProduct: Product = {
  id: 'prod-1',
  slug: 'chocolat-chaud-africain',
  name: 'Chocolat Chaud L’Africain',
  description: 'Le célèbre chocolat chaud à l’ancienne.',
  shortDescription: 'Dense et onctueux',
  price: { amount_minor: 1200, currency: 'EUR' },
  type: 'simple',
  images: [
    {
      id: 'img-1',
      url: '/assets/hot-chocolate.jpg',
      altText: 'Tasse de chocolat chaud L’Africain',
    },
  ],
  categories: ['chocolats'],
  inventory: {
    status: 'IN_STOCK',
    quantity: 50,
    backordersAllowed: false,
    isPurchasable: true,
  },
};

const outOfStockProduct: Product = {
  ...sampleProduct,
  id: 'prod-2',
  slug: 'mont-blanc-signature',
  name: 'Mont-Blanc Signature',
  inventory: {
    status: 'OUT_OF_STOCK',
    quantity: 0,
    backordersAllowed: false,
    isPurchasable: false,
  },
};

describe('Catalog & Shopping Templates Accessibility (ECO-404)', () => {
  describe('ProductGrid States', () => {
    it('renders loading state with aria-busy and accessible status announcement', () => {
      const html = renderToString(
        React.createElement(ProductGridAnimated, {
          products: [],
          isLoading: true,
        })
      );

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain('Chargement du catalogue de produits');
    });

    it('renders error state with role="alert" and actionable retry button', () => {
      const html = renderToString(
        React.createElement(ProductGridAnimated, {
          products: [],
          isError: true,
          errorMessage: 'Impossible de contacter le serveur WooCommerce.',
          onRetry: () => {},
        })
      );

      expect(html).toContain('role="alert"');
      expect(html).toContain('Impossible de contacter le serveur WooCommerce.');
      expect(html).toContain('Réessayer');
      expect(html).toContain('min-h-[44px]');
    });

    it('renders empty state with role="status" and polite live region', () => {
      const html = renderToString(
        React.createElement(ProductGridAnimated, {
          products: [],
          emptyText: 'Aucun produit ne correspond à vos critères.',
        })
      );

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('Aucun produit ne correspond à vos critères.');
    });
  });

  describe('ProductCard Semantic Structure and Image Accessibility', () => {
    it('renders product in a semantic article landmark with labelled title', () => {
      const html = renderToString(
        React.createElement(ProductCard, {
          product: sampleProduct,
        })
      );

      expect(html).toContain('<article');
      expect(html).toContain('aria-labelledby="product-title-prod-1"');
      expect(html).toContain('href="/product/chocolat-chaud-africain"');
      expect(html).toContain('Chocolat Chaud L’Africain');
    });

    it('displays out-of-stock badge with accessible status role', () => {
      const html = renderToString(
        React.createElement(ProductCard, {
          product: outOfStockProduct,
        })
      );

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-label="Produit en rupture de stock"');
      expect(html).toContain('Épuisé');
    });

    it('provides accessible quick view button outside the main product link with min 44px touch targets', () => {
      const html = renderToString(
        React.createElement(ProductCard, {
          product: sampleProduct,
        })
      );

      expect(html).toContain('aria-label="Aperçu rapide de Chocolat Chaud L’Africain"');
      expect(html).toContain('min-h-[44px]');
      expect(html).toContain('min-w-[44px]');
      expect(html).toContain('focus-visible:ring-2');
    });
  });
});
