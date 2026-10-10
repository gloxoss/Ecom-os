/**
 * EcomOS Authoritative Addon & Feature Registry
 *
 * Server-side source of truth for enabled addons and capabilities.
 * Guarantees that disabled services return 404/403 and never perform side-effects.
 * Provides client-safe capability projections that cannot be forged.
 */

import type { AddonManifest } from './addon-manifest.js';
import { checkAddonCompatibility, validateAddonManifest } from './addon-manifest.js';

export interface PublicCapabilityProjection {
  features: Record<string, boolean>;
  capabilities: string[];
  activeAddonIds: string[];
}

export interface ServiceGuardResult {
  authorized: boolean;
  statusCode: 200 | 403 | 404;
  reason?: string;
}

export class AddonRegistry {
  private manifests: Map<string, AddonManifest> = new Map();
  private enabledStates: Map<string, boolean> = new Map();
  private configurations: Map<string, Record<string, unknown>> = new Map();
  private engineVersion: string;

  constructor(engineVersion: string = '1.0.0') {
    this.engineVersion = engineVersion;
  }

  /**
   * Register a validated addon manifest in the registry.
   */
  public register(manifest: AddonManifest): void {
    const validation = validateAddonManifest(manifest);
    if (!validation.valid || !validation.manifest) {
      throw new Error(`Cannot register invalid addon manifest: ${validation.errors.join(', ')}`);
    }

    this.manifests.set(manifest.id, validation.manifest);
    if (!this.enabledStates.has(manifest.id)) {
      this.enabledStates.set(manifest.id, false);
    }
  }

  /**
   * Enable an addon with optional configuration.
   * Enforces version compatibility and dependency resolution.
   */
  public enable(id: string, config?: Record<string, unknown>): void {
    const manifest = this.manifests.get(id);
    if (!manifest) {
      throw new Error(`Cannot enable unknown addon "${id}". Must be registered first.`);
    }

    // Build map of currently active addons
    const activeAddons: Record<string, string> = {};
    for (const [addonId, isEnabled] of this.enabledStates.entries()) {
      if (isEnabled && this.manifests.has(addonId)) {
        activeAddons[addonId] = this.manifests.get(addonId)!.version;
      }
    }
    // Tentatively include target version
    activeAddons[id] = manifest.version;

    const compat = checkAddonCompatibility(manifest, this.engineVersion, activeAddons);
    if (!compat.compatible) {
      throw new Error(`Cannot enable addon "${id}": ${compat.issues.join('; ')}`);
    }

    this.enabledStates.set(id, true);
    if (config) {
      this.configurations.set(id, config);
    }
  }

  /**
   * Disable an addon and clear its configuration.
   */
  public disable(id: string): void {
    if (this.manifests.has(id)) {
      this.enabledStates.set(id, false);
      this.configurations.delete(id);
    }
  }

  /**
   * Check whether an addon is actively enabled.
   */
  public isEnabled(id: string): boolean {
    return this.enabledStates.get(id) === true;
  }

  /**
   * Check whether a specific capability is provided by an enabled addon.
   */
  public hasCapability(capability: string): boolean {
    for (const [id, isEnabled] of this.enabledStates.entries()) {
      if (isEnabled) {
        const manifest = this.manifests.get(id);
        if (manifest?.capabilities?.provided?.includes(capability)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Retrieve all currently active addon manifests.
   */
  public getEnabledAddons(): AddonManifest[] {
    const result: AddonManifest[] = [];
    for (const [id, isEnabled] of this.enabledStates.entries()) {
      if (isEnabled && this.manifests.has(id)) {
        result.push(this.manifests.get(id)!);
      }
    }
    return result;
  }

  /**
   * Guard a service or route request against the server-side registry.
   * Returns 404 if the addon is unknown or disabled, and 403 if capability is rejected.
   */
  public guardService(serviceId: string, requiredCapability?: string): ServiceGuardResult {
    // If checking by specific addon ID
    if (this.manifests.has(serviceId)) {
      if (!this.isEnabled(serviceId)) {
        return {
          authorized: false,
          statusCode: 404,
          reason: `Service "${serviceId}" is disabled.`,
        };
      }
    } else if (requiredCapability) {
      if (!this.hasCapability(requiredCapability)) {
        return {
          authorized: false,
          statusCode: 404,
          reason: `Required capability "${requiredCapability}" is unavailable.`,
        };
      }
    } else {
      return {
        authorized: false,
        statusCode: 404,
        reason: `Service "${serviceId}" does not exist.`,
      };
    }

    if (requiredCapability && !this.hasCapability(requiredCapability)) {
      return {
        authorized: false,
        statusCode: 403,
        reason: `Capability "${requiredCapability}" is not authorized.`,
      };
    }

    return {
      authorized: true,
      statusCode: 200,
    };
  }

  /**
   * Project client-safe capability flags for frontend consumption.
   * Strips all internal server secrets, database options, and administrative configs.
   */
  public projectCapabilities(): PublicCapabilityProjection {
    const features: Record<string, boolean> = {};
    const capabilities: string[] = [];
    const activeAddonIds: string[] = [];

    for (const [id, isEnabled] of this.enabledStates.entries()) {
      features[id] = isEnabled;
      if (isEnabled) {
        activeAddonIds.push(id);
        const manifest = this.manifests.get(id);
        if (manifest?.capabilities?.provided) {
          for (const cap of manifest.capabilities.provided) {
            if (!capabilities.includes(cap)) {
              capabilities.push(cap);
            }
          }
        }
      }
    }

    return {
      features,
      capabilities,
      activeAddonIds,
    };
  }
}
