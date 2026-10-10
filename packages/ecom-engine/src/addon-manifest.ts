/**
 * EcomOS Addon Manifest Specification and Validation
 *
 * Defines the canonical contract for all EcomOS modular addons.
 * Controls version compatibility, dependencies, capabilities, slots, and migrations.
 * Separates commercial/billing state from local engine capability enablement.
 */

export interface AddonPhpModule {
  pluginFile: string;
  minPhpVersion?: string;
  minWpVersion?: string;
  minWooVersion?: string;
}

export interface AddonMigration {
  version: string;
  up: string;
  down: string;
}

export interface AddonConfigField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: unknown;
  description?: string;
}

export interface AddonRoute {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler?: string;
  authRequired?: boolean;
}

export interface AddonSlot {
  slot: string;
  component?: string;
  order?: number;
}

export interface AddonAdminSlot {
  slot: string;
  title?: string;
  component?: string;
  requiredCapability?: string;
}

export interface AddonCapabilities {
  required?: string[];
  provided?: string[];
}

export interface AddonBilling {
  /**
   * Billing information is strictly separated from local runtime enablement.
   * A paid license flag does NOT dynamically bypass local capability gates.
   */
  isPaid?: boolean;
  tier?: string;
  licenseKeyConfigKey?: string;
}

export interface AddonManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  ecomOsApiRange: string;
  dependencies?: Record<string, string>;
  capabilities?: AddonCapabilities;
  configSchema?: Record<string, AddonConfigField>;
  routes?: AddonRoute[];
  uiSlots?: AddonSlot[];
  adminSlots?: AddonAdminSlot[];
  phpModule?: AddonPhpModule;
  migrations?: AddonMigration[];
  billing?: AddonBilling;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  manifest?: AddonManifest;
}

export interface CompatibilityResult {
  compatible: boolean;
  issues: string[];
}

/**
 * Basic semantic version parser.
 */
function parseSemver(v: string): { major: number; minor: number; patch: number } | null {
  const match = v.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-[\w.-]+)?$/);
  if (!match || !match[1] || !match[2] || !match[3]) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Checks if a version satisfies a semver range (supports ^, >=, <=, =, exact, and *).
 */
export function satisfiesSemverRange(version: string, range: string): boolean {
  const parsed = parseSemver(version);
  if (!parsed) return false;

  const trimmed = range.trim();
  if (trimmed === '*' || trimmed === '') return true;

  // Caret range ^x.y.z
  if (trimmed.startsWith('^')) {
    const rangeTarget = parseSemver(trimmed.slice(1));
    if (!rangeTarget) return false;
    if (parsed.major !== rangeTarget.major) return false;
    if (parsed.minor < rangeTarget.minor) return false;
    if (parsed.minor === rangeTarget.minor && parsed.patch < rangeTarget.patch) return false;
    return true;
  }

  // Greater than or equal >=x.y.z
  if (trimmed.startsWith('>=')) {
    const rangeTarget = parseSemver(trimmed.slice(2));
    if (!rangeTarget) return false;
    if (parsed.major > rangeTarget.major) return true;
    if (parsed.major === rangeTarget.major && parsed.minor > rangeTarget.minor) return true;
    if (parsed.major === rangeTarget.major && parsed.minor === rangeTarget.minor && parsed.patch >= rangeTarget.patch) return true;
    return false;
  }

  // Exact comparison
  const exact = trimmed.startsWith('=') ? trimmed.slice(1).trim() : trimmed;
  const rangeTarget = parseSemver(exact);
  if (!rangeTarget) return false;
  return parsed.major === rangeTarget.major && parsed.minor === rangeTarget.minor && parsed.patch === rangeTarget.patch;
}

/**
 * Validates an addon manifest against the canonical schema.
 */
export function validateAddonManifest(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Manifest must be a non-null object.'] };
  }

  const raw = input as Record<string, any>;

  // Validate id
  if (typeof raw.id !== 'string' || !/^[a-z0-9-]+$/.test(raw.id)) {
    errors.push('Addon id must be a non-empty string containing only lowercase alphanumeric characters and hyphens.');
  }

  // Validate name
  if (typeof raw.name !== 'string' || !raw.name.trim()) {
    errors.push('Addon name must be a non-empty string.');
  }

  // Validate version
  if (typeof raw.version !== 'string' || !parseSemver(raw.version)) {
    errors.push(`Addon version "${raw.version}" must be valid semantic versioning (X.Y.Z).`);
  }

  // Validate ecomOsApiRange
  if (typeof raw.ecomOsApiRange !== 'string' || !raw.ecomOsApiRange.trim()) {
    errors.push('Addon ecomOsApiRange must be a non-empty semver range string (e.g. "^1.0.0").');
  }

  // Validate dependencies
  if (raw.dependencies !== undefined) {
    if (typeof raw.dependencies !== 'object' || raw.dependencies === null || Array.isArray(raw.dependencies)) {
      errors.push('dependencies must be a key-value record of addon IDs to semver ranges.');
    } else {
      for (const [depId, depRange] of Object.entries(raw.dependencies)) {
        if (!/^[a-z0-9-]+$/.test(depId)) {
          errors.push(`Dependency id "${depId}" is invalid.`);
        }
        if (typeof depRange !== 'string' || !depRange.trim()) {
          errors.push(`Dependency range for "${depId}" must be a non-empty semver range.`);
        }
      }
    }
  }

  // Validate capabilities
  if (raw.capabilities !== undefined) {
    if (typeof raw.capabilities !== 'object' || raw.capabilities === null) {
      errors.push('capabilities must be an object.');
    } else {
      if (raw.capabilities.required && !Array.isArray(raw.capabilities.required)) {
        errors.push('capabilities.required must be an array of capability strings.');
      }
      if (raw.capabilities.provided && !Array.isArray(raw.capabilities.provided)) {
        errors.push('capabilities.provided must be an array of capability strings.');
      }
    }
  }

  // Validate configSchema
  if (raw.configSchema !== undefined) {
    if (typeof raw.configSchema !== 'object' || raw.configSchema === null || Array.isArray(raw.configSchema)) {
      errors.push('configSchema must be an object map.');
    } else {
      const validTypes = ['string', 'number', 'boolean', 'object', 'array'];
      for (const [key, field] of Object.entries(raw.configSchema)) {
        if (!field || typeof field !== 'object' || !validTypes.includes((field as any).type)) {
          errors.push(`configSchema field "${key}" has invalid or missing type.`);
        }
      }
    }
  }

  // Validate phpModule
  if (raw.phpModule !== undefined) {
    if (typeof raw.phpModule !== 'object' || raw.phpModule === null) {
      errors.push('phpModule must be an object.');
    } else if (typeof raw.phpModule.pluginFile !== 'string' || !raw.phpModule.pluginFile.trim()) {
      errors.push('phpModule.pluginFile must specify the WordPress plugin entrypoint file.');
    }
  }

  // Validate migrations
  if (raw.migrations !== undefined) {
    if (!Array.isArray(raw.migrations)) {
      errors.push('migrations must be an array.');
    } else {
      for (let i = 0; i < raw.migrations.length; i++) {
        const m = raw.migrations[i];
        if (!m || typeof m !== 'object' || !m.version || !m.up || !m.down) {
          errors.push(`migration at index ${i} must specify version, up, and down migration steps.`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    manifest: raw as AddonManifest,
  };
}

/**
 * Checks an addon manifest against the running engine version and active peer addons.
 */
export function checkAddonCompatibility(
  manifest: AddonManifest,
  engineVersion: string,
  activeAddons: Record<string, string> = {}
): CompatibilityResult {
  const issues: string[] = [];

  // Check engine API range compatibility
  if (!satisfiesSemverRange(engineVersion, manifest.ecomOsApiRange)) {
    issues.push(
      `Addon "${manifest.id}" (${manifest.version}) requires EcomOS API range "${manifest.ecomOsApiRange}", but runtime engine is "${engineVersion}".`
    );
  }

  // Check peer dependencies
  if (manifest.dependencies) {
    for (const [depId, requiredRange] of Object.entries(manifest.dependencies)) {
      const activeVersion = activeAddons[depId];
      if (!activeVersion) {
        issues.push(`Addon "${manifest.id}" is missing required dependency "${depId}" (${requiredRange}).`);
      } else if (!satisfiesSemverRange(activeVersion, requiredRange)) {
        issues.push(
          `Addon "${manifest.id}" requires "${depId}" version "${requiredRange}", but found "${activeVersion}".`
        );
      }
    }
  }

  return {
    compatible: issues.length === 0,
    issues,
  };
}
