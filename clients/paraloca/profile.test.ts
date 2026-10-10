import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { paralocaProfile } from './profile';
import {
  ClientProfileSchema,
  toPublicClientProfile,
  loadClientProfile,
  CERTIFIED_PAYMENT_METHODS,
} from '../../packages/brand-config/src/client-profile';

describe('ParaLoca Client Profile Contract (ECO-801)', () => {
  it('validates strictly against ClientProfileSchema', () => {
    const parseResult = ClientProfileSchema.safeParse(paralocaProfile);
    assert.equal(parseResult.success, true);
  });

  it('enforces exact approved brand name spelling and domain', () => {
    assert.equal(paralocaProfile.id, 'paraloca');
    assert.equal(paralocaProfile.name, 'ParaLoca');
    assert.equal(paralocaProfile.brand.name, 'ParaLoca');
    assert.equal(paralocaProfile.brand.slug, 'paraloca');
    assert.equal(paralocaProfile.environment.storefrontUrl, 'https://paraloca.ma');
  });

  it('enforces Moroccan regional currency and locale settings', () => {
    assert.equal(paralocaProfile.brand.commerce?.defaultCurrency, 'MAD');
    assert.equal(paralocaProfile.brand.commerce?.defaultLocale, 'fr');
    assert.ok(paralocaProfile.brand.commerce?.supportedLocales?.includes('fr'));
    assert.ok(paralocaProfile.brand.commerce?.supportedLocales?.includes('ar'));
    assert.equal(paralocaProfile.commerce.defaultCountry, 'MA');
    assert.deepEqual(paralocaProfile.commerce.allowedCountries, ['MA']);
  });

  it('permits only certified payment methods and rejects uncertified gateways', () => {
    assert.deepEqual(paralocaProfile.commerce.allowedPaymentMethods, ['cod']);
    for (const method of paralocaProfile.commerce.allowedPaymentMethods) {
      assert.ok((CERTIFIED_PAYMENT_METHODS as readonly string[]).includes(method));
    }

    const invalidProfile = {
      ...paralocaProfile,
      commerce: {
        ...paralocaProfile.commerce,
        allowedPaymentMethods: ['uncertified_cmi_gateway'],
      },
    };
    assert.throws(() => loadClientProfile(invalidProfile), /Only certified payment methods are permitted/);
  });

  it('enforces architectural invariant: customer accounts remain disabled', () => {
    assert.equal(paralocaProfile.capabilities.customerAccounts, false);

    const invalidAccountsProfile = {
      ...paralocaProfile,
      capabilities: {
        ...paralocaProfile.capabilities,
        customerAccounts: true,
      },
    };
    assert.throws(() => loadClientProfile(invalidAccountsProfile), /Customer accounts are disabled by architectural invariant/);
  });

  it('scrubs internal backend URLs and credentials from public client projection', () => {
    const publicProfile = toPublicClientProfile(paralocaProfile);
    assert.equal(publicProfile.id, 'paraloca');
    assert.equal(publicProfile.name, 'ParaLoca');
    assert.equal((publicProfile.environment as any).wooCommerceUrl, undefined);
    assert.equal((publicProfile.environment as any).wordpressUrl, undefined);
    assert.equal(publicProfile.environment.storefrontUrl, 'https://paraloca.ma');
  });

  it('rejects URLs containing embedded credentials or invalid protocol', () => {
    const maliciousProfile = {
      ...paralocaProfile,
      environment: {
        ...paralocaProfile.environment,
        wooCommerceUrl: 'https://admin:secret123@woo.paraloca.ma',
      },
    };
    assert.throws(() => loadClientProfile(maliciousProfile), /Invalid or insecure wooCommerceUrl/);
  });
});
