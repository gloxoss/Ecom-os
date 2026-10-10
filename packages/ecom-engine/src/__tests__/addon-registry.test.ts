import { describe, it, expect, beforeEach } from 'vitest';
import { AddonRegistry } from '../addon-registry.js';
import type { AddonManifest } from '../addon-manifest.js';

describe('AddonRegistry Authoritative Feature Registry', () => {
  let registry: AddonRegistry;

  const quoteManifest: AddonManifest = {
    id: 'quotes',
    name: 'RFQ Quote Addon',
    version: '1.0.0',
    ecomOsApiRange: '^1.0.0',
    capabilities: {
      provided: ['quotes', 'rfq_submission'],
    },
  };

  const giftWrapManifest: AddonManifest = {
    id: 'gift-wrap',
    name: 'Gift Wrap Addon',
    version: '1.2.0',
    ecomOsApiRange: '^1.0.0',
    capabilities: {
      provided: ['custom_gift_wrap'],
    },
  };

  beforeEach(() => {
    registry = new AddonRegistry('1.0.0');
    registry.register(quoteManifest);
    registry.register(giftWrapManifest);
  });

  it('initializes registered addons in a strictly disabled state', () => {
    expect(registry.isEnabled('quotes')).toBe(false);
    expect(registry.isEnabled('gift-wrap')).toBe(false);
    expect(registry.hasCapability('quotes')).toBe(false);
    expect(registry.hasCapability('rfq_submission')).toBe(false);
    expect(registry.getEnabledAddons()).toEqual([]);
  });

  it('enables an addon and provides its declared capabilities', () => {
    registry.enable('quotes');
    expect(registry.isEnabled('quotes')).toBe(true);
    expect(registry.hasCapability('quotes')).toBe(true);
    expect(registry.hasCapability('rfq_submission')).toBe(true);
    // Other addons remain disabled
    expect(registry.isEnabled('gift-wrap')).toBe(false);
    expect(registry.hasCapability('custom_gift_wrap')).toBe(false);
  });

  it('disables an addon and revokes its capabilities', () => {
    registry.enable('quotes');
    expect(registry.isEnabled('quotes')).toBe(true);

    registry.disable('quotes');
    expect(registry.isEnabled('quotes')).toBe(false);
    expect(registry.hasCapability('quotes')).toBe(false);
    expect(registry.hasCapability('rfq_submission')).toBe(false);
  });

  it('guards service requests with 404 when addon is disabled', () => {
    const result = registry.guardService('quotes');
    expect(result.authorized).toBe(false);
    expect(result.statusCode).toBe(404);
    expect(result.reason).toContain('disabled');
  });

  it('guards unknown service requests with 404', () => {
    const result = registry.guardService('unknown-addon');
    expect(result.authorized).toBe(false);
    expect(result.statusCode).toBe(404);
    expect(result.reason).toContain('does not exist');
  });

  it('permits authorized requests when service is enabled and capability matches', () => {
    registry.enable('quotes');
    const result = registry.guardService('quotes', 'rfq_submission');
    expect(result.authorized).toBe(true);
    expect(result.statusCode).toBe(200);
  });

  it('returns 403 when service is enabled but required capability is missing', () => {
    registry.enable('quotes');
    const result = registry.guardService('quotes', 'nonexistent_cap');
    expect(result.authorized).toBe(false);
    expect(result.statusCode).toBe(403);
  });

  it('projects safe client capability map immune to client-side forgery', () => {
    registry.enable('quotes');
    const projection = registry.projectCapabilities();

    expect(projection.features).toEqual({
      quotes: true,
      'gift-wrap': false,
    });
    expect(projection.capabilities).toContain('quotes');
    expect(projection.capabilities).toContain('rfq_submission');
    expect(projection.capabilities).not.toContain('custom_gift_wrap');
    expect(projection.activeAddonIds).toEqual(['quotes']);

    // If client attempts to forge "gift-wrap: true"
    const forgedClientState = { ...projection.features, 'gift-wrap': true };
    // Authoritative check must still consult registry, not client payload
    expect(registry.isEnabled('gift-wrap')).toBe(false);
    expect(registry.guardService('gift-wrap').statusCode).toBe(404);
  });
});
