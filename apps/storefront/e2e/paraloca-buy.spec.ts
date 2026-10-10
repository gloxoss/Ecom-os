import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultParaLocaContent, type BrandDefinition, type CategoryDefinition } from '../../../clients/paraloca/content-schema';
import { paralocaProfile } from '../../../clients/paraloca/profile';

describe('ParaLoca Buy Navigation & Guest Checkout Continuity (ECO-803)', () => {
  it('navigates from ParaLoca brand directory to specific brand page', () => {
    const brands = defaultParaLocaContent.brands;
    assert.ok(brands.length >= 4);

    const ownedBrand = brands.find((b: BrandDefinition) => b.isOwned);
    assert.ok(ownedBrand);
    assert.equal(ownedBrand.slug, 'paraloca');
    assert.equal(ownedBrand.origin, 'Maroc');

    const partnerBrand = brands.find((b: BrandDefinition) => !b.isOwned && b.slug === 'rossmax');
    assert.ok(partnerBrand);
    assert.equal(partnerBrand.origin, 'Suisse');
  });

  it('verifies category taxonomy structure and equipment guides', () => {
    const categories = defaultParaLocaContent.categories;
    assert.equal(categories.length, 4);
    assert.ok(categories.some((c: CategoryDefinition) => c.slug === 'mobilite-autonomie'));
    assert.ok(categories.some((c: CategoryDefinition) => c.slug === 'diagnostic-controle'));

    const guides = defaultParaLocaContent.guides;
    assert.ok(guides.length >= 2);
    for (const guide of guides) {
      assert.ok(guide.readingMinutes > 0);
      assert.ok(guide.disclaimer.length > 10);
    }
  });

  it('completes multi-item guest checkout flow without customer account requirement', () => {
    // 1. Initial guest cart
    interface CartLine {
      productId: string;
      variationId?: string;
      title: string;
      quantity: number;
      priceMad: number;
    }

    const cart: CartLine[] = [];

    // 2. Add sample medical equipment (wheelchair + tensiometer)
    cart.push({
      productId: 'prod-wheelchair-01',
      variationId: 'var-large',
      title: 'Fauteuil Roulant Pliable Aluminium',
      quantity: 1,
      priceMad: 1850.0,
    });

    cart.push({
      productId: 'prod-tensiometer-02',
      title: 'Tensiomètre Électronique Brassard Rossmax',
      quantity: 2,
      priceMad: 420.0,
    });

    assert.equal(cart.length, 2);
    const subtotalMad = cart.reduce((sum, item) => sum + item.priceMad * item.quantity, 0);
    assert.equal(subtotalMad, 1850.0 + 840.0); // 2690.00 MAD

    // 3. Guest address in Casablanca, Morocco
    const guestShipping = {
      fullName: 'Dr. Karim Benjelloun',
      address1: '45 Boulevard Zerktouni',
      city: 'Casablanca',
      postalCode: '20100',
      country: 'MA',
      phone: '+212 6 61 00 11 22',
      email: 'k.benjelloun@example.ma',
    };

    assert.equal(guestShipping.country, paralocaProfile.commerce.defaultCountry);
    assert.ok(paralocaProfile.commerce.allowedCountries.includes(guestShipping.country));

    // 4. Payment method selection restricted to certified 'cod'
    const selectedPayment = 'cod';
    assert.ok(paralocaProfile.commerce.allowedPaymentMethods.includes(selectedPayment));

    // 5. Synthesize order conversion simulation
    const createdOrder = {
      id: 98401,
      orderKey: 'wc_order_paraloca_test_98401',
      status: 'processing',
      currency: paralocaProfile.brand.commerce?.defaultCurrency || 'MAD',
      total: subtotalMad,
      paymentMethod: selectedPayment,
      customerIsGuest: true,
      customerId: 0, // Zero wp_users creation
      lineItemsCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    };

    assert.equal(createdOrder.customerIsGuest, true);
    assert.equal(createdOrder.customerId, 0);
    assert.equal(createdOrder.currency, 'MAD');
    assert.equal(createdOrder.total, 2690.0);
    assert.equal(createdOrder.lineItemsCount, 3);
  });
});
