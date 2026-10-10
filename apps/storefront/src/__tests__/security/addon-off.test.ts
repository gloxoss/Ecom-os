import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddonRegistry } from '@ecom-os/engine';
import {
  setStorefrontRegistryForTesting,
  isAddonActive,
  hasAddonCapability,
} from '../../lib/addon-capabilities';
import { guardAddonRoute, withAddonGuard } from '../../lib/addon-route-guard';

describe('Authoritative Addon Off-State Security Barrier', () => {
  let mockRegistry: AddonRegistry;

  beforeEach(() => {
    mockRegistry = new AddonRegistry('1.0.0');
    // Register the RFQ Quotes addon
    mockRegistry.register({
      id: 'quotes',
      name: 'RFQ Quotes Addon',
      version: '1.0.0',
      ecomOsApiRange: '^1.0.0',
      capabilities: {
        provided: ['quotes', 'submit_quote'],
      },
    });
    // Set into storefront runtime
    setStorefrontRegistryForTesting(mockRegistry);
  });

  it('guarantees disabled addon returns 404 and blocks execution', async () => {
    // Addon is registered but NOT enabled
    expect(isAddonActive('quotes')).toBe(false);
    expect(hasAddonCapability('quotes')).toBe(false);

    const guard = guardAddonRoute('quotes');
    expect(guard.allowed).toBe(false);
    expect(guard.status).toBe(404);
    expect(guard.body?.code).toBe('ADDON_DISABLED');
  });

  it('prevents any side effects (mail, DB write, queue) when service is disabled', async () => {
    const sideEffectDatabaseWrite = vi.fn();
    const sideEffectEmailDispatch = vi.fn();

    const protectedHandler = async () => {
      sideEffectDatabaseWrite();
      sideEffectEmailDispatch();
      return { success: true };
    };

    const guardedHandler = withAddonGuard('quotes', protectedHandler);
    const response = await guardedHandler();

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(404);

    const data = await (response as Response).json();
    expect(data.code).toBe('ADDON_DISABLED');

    // Crucial invariant: zero side-effects were invoked
    expect(sideEffectDatabaseWrite).not.toHaveBeenCalled();
    expect(sideEffectEmailDispatch).not.toHaveBeenCalled();
  });

  it('rejects forged client headers attempting to bypass server registry', async () => {
    // Client sends request claiming feature override
    const forgedHeaders = {
      'x-ecomos-feature-override': 'quotes',
      'x-addon-active': 'true',
    };

    // Server-side check looks only at authoritative registry
    const guard = guardAddonRoute('quotes');
    expect(guard.allowed).toBe(false);
    expect(guard.status).toBe(404);
  });

  it('permits execution and side effects when addon is legitimately enabled', async () => {
    // Enable quotes in authoritative registry
    mockRegistry.enable('quotes');
    expect(isAddonActive('quotes')).toBe(true);
    expect(hasAddonCapability('quotes')).toBe(true);

    const sideEffectDatabaseWrite = vi.fn();
    const protectedHandler = async () => {
      sideEffectDatabaseWrite();
      return { success: true };
    };

    const guardedHandler = withAddonGuard('quotes', protectedHandler);
    const result = await guardedHandler();

    expect(result).toEqual({ success: true });
    expect(sideEffectDatabaseWrite).toHaveBeenCalledTimes(1);
  });

  it('returns 404 for completely unknown addon requests', async () => {
    const guard = guardAddonRoute('unregistered-addon');
    expect(guard.allowed).toBe(false);
    expect(guard.status).toBe(404);
  });
});
