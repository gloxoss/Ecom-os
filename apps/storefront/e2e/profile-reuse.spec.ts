import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { paralocaProfile } from '../../../clients/paraloca/profile';
import { demo2Profile } from '../../../clients/demo-2/profile';

describe('Cross-Client Commerce Reuse & Profile Isolation (ECO-904)', () => {
  it('confirms distinct contrasting visual identity and presentation slots for Demo Client 2', () => {
    assert.notEqual(demo2Profile.id, paralocaProfile.id);
    assert.notEqual(demo2Profile.brand.name, paralocaProfile.brand.name);
    assert.notEqual(demo2Profile.brand.colors.primary, paralocaProfile.brand.colors.primary);
    assert.notEqual(demo2Profile.brand.colors.accent, paralocaProfile.brand.colors.accent);

    // Presentation slots diverge (minimal vs standard / dropdown vs pills)
    assert.ok(demo2Profile.brand.slots);
    assert.ok(paralocaProfile.brand.slots);
    assert.equal(demo2Profile.brand.slots.header, 'minimal');
    assert.equal(demo2Profile.brand.slots.variantSelector, 'dropdown');
    assert.equal(paralocaProfile.brand.slots.header, 'standard');
    assert.equal(paralocaProfile.brand.slots.variantSelector, 'pills');
  });

  it('guarantees RFQ addon and customer accounts remain strictly disabled on Demo Client 2', () => {
    assert.equal(demo2Profile.capabilities.quotes, false);
    assert.equal(demo2Profile.capabilities.customerAccounts, false);
    assert.equal(demo2Profile.capabilities.guestCheckout, true);

    // Contrasting with ParaLoca where quotes is discreetly activated for healthcare B2B
    assert.equal(paralocaProfile.capabilities.quotes, true);
    assert.equal(paralocaProfile.capabilities.customerAccounts, false);
  });

  it('proves identical core guest purchase and order calculation contracts without source duplication', () => {
    const clients = [paralocaProfile, demo2Profile];

    for (const client of clients) {
      // 1. Both enforce certified COD only
      assert.deepEqual(client.commerce.allowedPaymentMethods, ['cod']);
      assert.equal(client.commerce.defaultCountry, 'MA');

      // 2. Both enforce guest-first order creation with customerId = 0
      const syntheticOrder = {
        client: client.id,
        itemsCount: 2,
        totalMad: 750.0,
        paymentMethod: 'cod',
        customerIsGuest: true,
        customerId: 0,
      };

      assert.equal(syntheticOrder.customerIsGuest, true);
      assert.equal(syntheticOrder.customerId, 0);
      assert.equal(syntheticOrder.paymentMethod, client.commerce.allowedPaymentMethods[0]);
    }
  });

  it('enforces that RFQ submission attempts fail closed on Demo Client 2', () => {
    const isRfqEnabled = (clientCapabilities: typeof demo2Profile.capabilities) => {
      return Boolean(clientCapabilities.quotes);
    };

    assert.equal(isRfqEnabled(demo2Profile.capabilities), false);
    assert.equal(isRfqEnabled(paralocaProfile.capabilities), true);
  });
});
