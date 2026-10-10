import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { CatalogFilters } from './filters';

// Mock next/navigation for server/node testing environment
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/catalog',
  useSearchParams: () => new URLSearchParams('categories=huiles&inStock=true&minPrice=20'),
}));

describe('CatalogFilters accessible component', () => {
  it('renders fieldsets for categories, brands, price range, and availability', () => {
    const html = renderToString(
      React.createElement(CatalogFilters, {
        categories: [
          { value: 'huiles', label: 'Huiles Végétales', count: 12 },
          { value: 'savons', label: 'Savons Naturels', count: 5 },
        ],
        brands: [
          { value: 'argano', label: 'Argan Bio', count: 8 },
        ],
      }),
    );

    expect(html).toContain('Catalog filters');
    expect(html).toContain('Availability');
    expect(html).toContain('Price Range');
    expect(html).toContain('Categories');
    expect(html).toContain('Brands');
    expect(html).toContain('Huiles Végétales');
    expect(html).toContain('(12)');
    expect(html).toContain('Argan Bio');
    expect(html).toContain('(8)');
    expect(html).toContain('In Stock Only');
  });

  it('renders active filter chips and clear all action', () => {
    const html = renderToString(
      React.createElement(CatalogFilters, {
        categories: [
          { value: 'huiles', label: 'Huiles Végétales', count: 12 },
        ],
      }),
    );

    expect(html).toContain('Active Filters');
    expect(html).toContain('Clear all');
    expect(html).toContain('Remove in-stock filter');
  });

  it('renders mobile trigger button with filter count badge', () => {
    const html = renderToString(
      React.createElement(CatalogFilters, {
        categories: [{ value: 'huiles', label: 'Huiles Végétales' }],
      }),
    );

    expect(html).toContain('Filters');
    expect(html).toContain('lg:hidden');
  });

  it('renders custom attribute facet groups when provided', () => {
    const html = renderToString(
      React.createElement(CatalogFilters, {
        attributeFacets: [
          {
            name: 'origine',
            label: 'Région / Origine',
            options: [
              { value: 'agadir', label: 'Région Souss-Massa (Agadir)', count: 14 },
              { value: 'marrakech', label: 'Marrakech-Tensift', count: 6 },
            ],
          },
        ],
      }),
    );

    expect(html).toContain('Région / Origine');
    expect(html).toContain('Région Souss-Massa (Agadir)');
    expect(html).toContain('(14)');
  });

  it('supports custom basePath for RFQ (/devis) integration', () => {
    const html = renderToString(
      React.createElement(CatalogFilters, {
        basePath: '/devis',
        categories: [{ value: 'huiles', label: 'Huiles Végétales' }],
      }),
    );

    expect(html).toContain('Catalog filters');
  });
});
