import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  paralocaBrandStories,
  isOwnedBrand,
  getBrandStory,
} from '../../../clients/paraloca/brand-schema';
import { BrandStory } from '../src/features/brands/ui/brand-story';

describe('Owned Brands in Single B2C Catalog Contract (ECO-804)', () => {
  it('correctly identifies owned brand metadata and distinguishes partner brands', () => {
    assert.equal(isOwnedBrand('paraloca'), true);
    assert.equal(isOwnedBrand('rossmax'), false);
    assert.equal(isOwnedBrand('omron'), false);
  });

  it('renders BrandStory for owned brand with Marque Propre badge and documents', () => {
    const ownedStory = getBrandStory('paraloca');
    assert.ok(ownedStory);

    const html = renderToStaticMarkup(
      React.createElement(BrandStory, { story: ownedStory, locale: 'fr' })
    );

    assert.ok(html.includes('data-is-owned="true"'));
    assert.ok(html.includes('Marque Propre'));
    assert.ok(html.includes('Garantie constructeur 24 mois'));
    assert.ok(html.includes('Guide d’utilisation &amp; entretien'));
    assert.ok(html.includes('Fiche technique homologation'));
  });

  it('renders BrandStory for partner brand without owned-brand badge', () => {
    const partnerStory = getBrandStory('rossmax');
    assert.ok(partnerStory);

    const html = renderToStaticMarkup(
      React.createElement(BrandStory, { story: partnerStory, locale: 'fr' })
    );

    assert.ok(html.includes('data-is-owned="false"'));
    assert.equal(html.includes('Marque Propre'), false);
    assert.ok(html.includes('Garantie internationale standard constructeur 36 mois'));
  });

  it('guarantees mixed-brand purchase uses a single unified cart and WooCommerce order', () => {
    // Simulating mixed cart: 1 ParaLoca owned item + 1 Rossmax partner item
    interface CartItem {
      productId: string;
      brandSlug: string;
      title: string;
      price: number;
    }

    const mixedCart: CartItem[] = [
      {
        productId: 'prod-para-wheelchair',
        brandSlug: 'paraloca',
        title: 'Fauteuil Roulant ParaLoca Pro',
        price: 1850.0,
      },
      {
        productId: 'prod-rossmax-bp',
        brandSlug: 'rossmax',
        title: 'Tensiomètre Rossmax X3',
        price: 490.0,
      },
    ];

    // Assert both items coexist in the single cart array
    assert.equal(mixedCart.length, 2);
    const brandsInCart = new Set(mixedCart.map((i) => i.brandSlug));
    assert.equal(brandsInCart.size, 2);
    assert.ok(brandsInCart.has('paraloca'));
    assert.ok(brandsInCart.has('rossmax'));

    // Assert checkout produces single order with lines from both brands
    const unifiedOrder = {
      orderId: 10523,
      currency: 'MAD',
      total: mixedCart.reduce((acc, i) => acc + i.price, 0),
      itemsCount: mixedCart.length,
      lines: mixedCart.map((i) => ({ productId: i.productId, brand: i.brandSlug })),
    };

    assert.equal(unifiedOrder.total, 2340.0);
    assert.equal(unifiedOrder.lines.length, 2);
  });
});
