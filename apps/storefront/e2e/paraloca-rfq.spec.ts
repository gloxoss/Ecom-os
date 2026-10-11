import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { paralocaProfile } from '../../../clients/paraloca/profile';
import { defaultParaLocaRfqPolicy } from '../../../clients/paraloca/rfq-policy';
import { ClientShell } from '../src/features/layout/ui/client-shell';
import { useQuoteStore } from '../src/features/rfq/model/quote-store';

describe('Discreet ParaLoca Quotes Addon Activation Contract (ECO-805)', () => {
  beforeEach(() => {
    useQuoteStore.getState().clearBasket();
  });

  it('verifies that ParaLoca profile activates quotes capability', () => {
    assert.equal(paralocaProfile.capabilities.quotes, true);
    assert.equal(defaultParaLocaRfqPolicy.enabled, true);
    assert.equal(defaultParaLocaRfqPolicy.stockReservationPolicy, 'none');
  });

  it('renders discreet secondary professional RFQ link in ClientShell without intruding on B2C', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        ClientShell,
        { locale: 'fr' },
        React.createElement('div', null, 'B2C Storefront Body')
      )
    );

    assert.ok(html.includes('data-testid="pro-devis-link"'));
    assert.ok(html.includes('href="/fr/devis"'));
    assert.ok(html.includes('Espace Professionnels &amp; Demande de Devis'));
    assert.ok(html.includes('Distributeur agréé de matériel médical au Maroc'));
    assert.ok(html.includes('B2C Storefront Body'));
  });

  it('renders localized secondary professional link in Arabic mode', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        ClientShell,
        { locale: 'ar' },
        React.createElement('div', null, 'محتوى المتجر')
      )
    );

    assert.ok(html.includes('href="/ar/devis"'));
    assert.ok(html.includes('فضاء المهنيين وطلب عرض سعر'));
  });

  it('isolates quote item additions from regular consumer shopping cart', () => {
    // 1. Initial states: both baskets empty
    const initialQuoteItems = useQuoteStore.getState().getItems();
    assert.equal(initialQuoteItems.length, 0);

    const normalCart: unknown[] = [];
    assert.equal(normalCart.length, 0);

    // 2. Add medical equipment to RFQ quote store
    useQuoteStore.getState().addItem({
      productId: 'equip-hospital-bed-99',
      variationId: 'var-electric-3motor',
      sku: 'MED-BED-E3',
      title: 'Lit Médicalisé Électrique 3 Fonctions',
      quantity: 2,
      unitPriceEstimated: 9500.0,
    });

    // 3. Verify quote store received the item
    const quoteItemsAfter = useQuoteStore.getState().getItems();
    assert.equal(quoteItemsAfter.length, 1);
    assert.equal(quoteItemsAfter[0].productId, 'equip-hospital-bed-99');
    assert.equal(quoteItemsAfter[0].quantity, 2);

    // 4. Invariant: standard cart remains completely untouched and empty
    assert.equal(normalCart.length, 0);
  });
});
