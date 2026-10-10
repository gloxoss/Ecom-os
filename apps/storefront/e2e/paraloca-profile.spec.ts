import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getActiveClientProfile,
  getActivePublicClientProfile,
  getActiveClientTheme,
} from '../src/lib/client-profile';

describe('ParaLoca Client Profile & Theme Selection Contract (ECO-801)', () => {
  const originalEnv = process.env.ECOM_CLIENT_PROFILE;

  beforeEach(() => {
    delete process.env.ECOM_CLIENT_PROFILE;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ECOM_CLIENT_PROFILE = originalEnv;
    } else {
      delete process.env.ECOM_CLIENT_PROFILE;
    }
  });

  it('resolves ParaLoca profile by default when ECOM_CLIENT_PROFILE is unset', () => {
    const profile = getActiveClientProfile();
    assert.equal(profile.id, 'paraloca');
    assert.equal(profile.name, 'ParaLoca');
    assert.equal(profile.brand.name, 'ParaLoca');
    assert.equal(profile.brand.slug, 'paraloca');
    assert.equal(profile.environment.storefrontUrl, 'https://paraloca.ma');
  });

  it('guarantees French/Morocco regional rules and MAD currency', () => {
    const profile = getActiveClientProfile();
    assert.equal(profile.brand.commerce?.defaultCurrency, 'MAD');
    assert.equal(profile.brand.commerce?.defaultLocale, 'fr');
    assert.ok(profile.brand.commerce?.supportedLocales?.includes('fr'));
    assert.ok(profile.brand.commerce?.supportedLocales?.includes('ar'));
    assert.equal(profile.commerce.defaultCountry, 'MA');
    assert.deepEqual(profile.commerce.allowedCountries, ['MA']);
  });

  it('restricts payments to certified COD and leaves customer accounts disabled', () => {
    const profile = getActiveClientProfile();
    assert.deepEqual(profile.commerce.allowedPaymentMethods, ['cod']);
    assert.equal(profile.capabilities.customerAccounts, false);
    assert.equal(profile.capabilities.guestCheckout, true);
  });

  it('safely projects public client profile scrubbing backend topology', () => {
    const publicProfile = getActivePublicClientProfile();
    assert.equal(publicProfile.id, 'paraloca');
    assert.equal(publicProfile.name, 'ParaLoca');
    assert.equal((publicProfile.environment as any).wooCommerceUrl, undefined);
    assert.equal((publicProfile.environment as any).wordpressUrl, undefined);
    assert.equal(publicProfile.environment.storefrontUrl, 'https://paraloca.ma');
  });

  it('resolves approved ParaLoca theme tokens from references/PARALOCA_DESIGN_REFERENCE.md', () => {
    const theme = getActiveClientTheme();
    assert.equal(theme.config.name, 'paraloca');
    assert.equal(theme.config.colors.background, '0 0% 100%');
    assert.equal(theme.config.colors.foreground, '120 2% 9%');
    assert.equal(theme.config.colors.primary, '120 2% 9%');
    assert.equal(theme.config.colors.accent, '170 47% 28.8%');
    assert.equal(theme.config.colors.border, '84 8% 88.4%');
    assert.equal(theme.config.radii?.md, '12px');
    assert.equal(theme.config.slots?.header, 'standard');
    assert.equal(theme.config.slots?.productGrid, '3-column');
  });

  it('switches dynamically between client profiles via environment seam without engine changes', () => {
    process.env.ECOM_CLIENT_PROFILE = 'demo-2';
    const demoProfile = getActiveClientProfile();
    assert.equal(demoProfile.id, 'demo-2');
    assert.equal(demoProfile.name, 'Nordic Craft Supplies');

    const demoTheme = getActiveClientTheme('demo-2');
    assert.equal(demoTheme.config.name, 'demo-2');

    // Restore to default
    delete process.env.ECOM_CLIENT_PROFILE;
    const defaultProfile = getActiveClientProfile();
    assert.equal(defaultProfile.id, 'paraloca');
  });
});
