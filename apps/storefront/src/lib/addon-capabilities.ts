/**
 * Storefront Addon Capabilities & Feature Gating
 *
 * Provides authoritative server-side capability resolution for storefront routes and components.
 * Rejects client-side flag tampering or URL query overrides.
 */

import { AddonRegistry, type PublicCapabilityProjection } from '@ecom-os/engine';

// Singleton registry for storefront runtime
let storefrontRegistry: AddonRegistry | null = null;

export function getStorefrontRegistry(): AddonRegistry {
  if (!storefrontRegistry) {
    storefrontRegistry = new AddonRegistry('1.0.0');

    // Register active addons from environment
    const rawAddons = process.env.ADDONS || '';
    const activeList = rawAddons
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    for (const addonId of activeList) {
      // Register standard known addon manifests
      storefrontRegistry.register({
        id: addonId,
        name: addonId,
        version: '1.0.0',
        ecomOsApiRange: '^1.0.0',
        capabilities: {
          provided: [addonId],
        },
      });
      storefrontRegistry.enable(addonId);
    }
  }
  return storefrontRegistry;
}

/**
 * Resets the registry (useful for testing different on/off environments).
 */
export function setStorefrontRegistryForTesting(registry: AddonRegistry | null): void {
  storefrontRegistry = registry;
}

/**
 * Server-authoritative check for addon enablement.
 */
export function isAddonActive(addonId: string): boolean {
  return getStorefrontRegistry().isEnabled(addonId);
}

/**
 * Server-authoritative check for a specific capability.
 */
export function hasAddonCapability(capability: string): boolean {
  return getStorefrontRegistry().hasCapability(capability);
}

/**
 * Returns safe projection of active capabilities for UI rendering.
 */
export function getPublicAddonCapabilities(): PublicCapabilityProjection {
  return getStorefrontRegistry().projectCapabilities();
}
