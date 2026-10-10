import { describe, it, expect } from 'vitest';
import {
  validateAddonManifest,
  checkAddonCompatibility,
  satisfiesSemverRange,
  type AddonManifest,
} from '../addon-manifest.js';

describe('AddonManifest schema validation', () => {
  const validManifest: AddonManifest = {
    id: 'sample-addon',
    name: 'Sample Addon',
    version: '1.2.0',
    description: 'A compliant test addon',
    ecomOsApiRange: '^1.0.0',
    dependencies: {
      'core-commerce': '^1.0.0',
    },
    capabilities: {
      required: ['read_products'],
      provided: ['custom_gift_wrap'],
    },
    configSchema: {
      enableGiftWrap: { type: 'boolean', default: true },
      maxMessageLength: { type: 'number', default: 250 },
    },
    routes: [
      { path: '/api/gift-wrap', method: 'POST', authRequired: false },
    ],
    uiSlots: [
      { slot: 'cart_item_options', component: 'GiftWrapSelector', order: 10 },
    ],
    adminSlots: [
      { slot: 'operations_overview', title: 'Gift Wrap Queue', requiredCapability: 'edit_shop_orders' },
    ],
    phpModule: {
      pluginFile: 'wp-sample-addon/wp-sample-addon.php',
      minPhpVersion: '8.1',
      minWpVersion: '6.2',
    },
    migrations: [
      { version: '1.0.0', up: 'CREATE TABLE wp_sample (id INT);', down: 'DROP TABLE wp_sample;' },
    ],
    billing: {
      isPaid: true,
      tier: 'pro',
    },
  };

  it('validates a complete, compliant addon manifest', () => {
    const result = validateAddonManifest(validManifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.manifest?.id).toBe('sample-addon');
  });

  it('rejects manifest with invalid ID characters', () => {
    const invalid = { ...validManifest, id: 'Sample_Addon!' };
    const result = validateAddonManifest(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Addon id'))).toBe(true);
  });

  it('rejects non-semver version strings', () => {
    const invalid = { ...validManifest, version: '1.0' };
    const result = validateAddonManifest(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('valid semantic versioning'))).toBe(true);
  });

  it('rejects missing or empty API range', () => {
    const invalid = { ...validManifest, ecomOsApiRange: ' ' };
    const result = validateAddonManifest(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ecomOsApiRange'))).toBe(true);
  });

  it('rejects malformed config schema fields', () => {
    const invalid = {
      ...validManifest,
      configSchema: {
        invalidField: { type: 'invalid_type' as any },
      },
    };
    const result = validateAddonManifest(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('configSchema field'))).toBe(true);
  });

  it('rejects incomplete migration definitions', () => {
    const invalid = {
      ...validManifest,
      migrations: [{ version: '1.0.0', up: 'SELECT 1;' } as any],
    };
    const result = validateAddonManifest(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('migration at index 0'))).toBe(true);
  });

  it('strictly separates billing metadata from validation and enablement', () => {
    const unpaidManifest: AddonManifest = {
      ...validManifest,
      id: 'free-addon',
      billing: { isPaid: false },
    };
    const paidManifest: AddonManifest = {
      ...validManifest,
      id: 'paid-addon',
      billing: { isPaid: true, tier: 'enterprise' },
    };

    const freeRes = validateAddonManifest(unpaidManifest);
    const paidRes = validateAddonManifest(paidManifest);

    expect(freeRes.valid).toBe(true);
    expect(paidRes.valid).toBe(true);
    // Billing tier presence has zero effect on schema validity
    expect(freeRes.errors).toEqual([]);
    expect(paidRes.errors).toEqual([]);
  });
});

describe('satisfiesSemverRange helper', () => {
  it('correctly tests caret ranges', () => {
    expect(satisfiesSemverRange('1.0.0', '^1.0.0')).toBe(true);
    expect(satisfiesSemverRange('1.4.2', '^1.0.0')).toBe(true);
    expect(satisfiesSemverRange('2.0.0', '^1.0.0')).toBe(false);
    expect(satisfiesSemverRange('0.9.0', '^1.0.0')).toBe(false);
  });

  it('correctly tests greater-than-or-equal ranges', () => {
    expect(satisfiesSemverRange('1.5.0', '>=1.0.0')).toBe(true);
    expect(satisfiesSemverRange('2.0.0', '>=1.0.0')).toBe(true);
    expect(satisfiesSemverRange('0.9.9', '>=1.0.0')).toBe(false);
  });

  it('handles exact matches and wildcard', () => {
    expect(satisfiesSemverRange('1.2.3', '1.2.3')).toBe(true);
    expect(satisfiesSemverRange('1.2.4', '1.2.3')).toBe(false);
    expect(satisfiesSemverRange('1.2.3', '*')).toBe(true);
  });
});

describe('checkAddonCompatibility check', () => {
  const manifest: AddonManifest = {
    id: 'analytics-addon',
    name: 'Analytics Addon',
    version: '1.0.0',
    ecomOsApiRange: '^1.0.0',
    dependencies: {
      'reporting-core': '^1.0.0',
    },
  };

  it('passes when runtime engine and peer dependencies match', () => {
    const result = checkAddonCompatibility(manifest, '1.3.0', {
      'reporting-core': '1.1.0',
    });
    expect(result.compatible).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('fails when engine version is outside required API range', () => {
    const result = checkAddonCompatibility(manifest, '2.0.0', {
      'reporting-core': '1.0.0',
    });
    expect(result.compatible).toBe(false);
    expect(result.issues.some(i => i.includes('requires EcomOS API range'))).toBe(true);
  });

  it('fails when required dependency is missing', () => {
    const result = checkAddonCompatibility(manifest, '1.0.0', {});
    expect(result.compatible).toBe(false);
    expect(result.issues.some(i => i.includes('missing required dependency "reporting-core"'))).toBe(true);
  });

  it('fails when peer dependency version is incompatible', () => {
    const result = checkAddonCompatibility(manifest, '1.0.0', {
      'reporting-core': '0.9.0',
    });
    expect(result.compatible).toBe(false);
    expect(result.issues.some(i => i.includes('requires "reporting-core" version "^1.0.0"'))).toBe(true);
  });
});
