import fs from 'fs';
import path from 'path';
import {
  validateAddonManifest,
  checkAddonCompatibility,
  type AddonManifest,
} from '../packages/ecom-engine/src/addon-manifest';

// Parse .env files manually so tsx doesn't need external env loaders
export function loadEnv(rootDir: string = path.join(__dirname, '..')) {
  const envFiles = [
    path.join(rootDir, '.env.local'),
    path.join(rootDir, '.env'),
    path.join(rootDir, 'apps/storefront', '.env.local'),
    path.join(rootDir, 'apps/storefront', '.env'),
  ];
  for (const fullPath of envFiles) {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].split(' #')[0].trim();
        }
      }
    }
  }
}

export interface ResolvedAddon {
  name: string;
  importPath: string;
  dirPath: string;
  manifest: AddonManifest;
}

/**
 * An addon's `ADDONS` name is its feature flag, which need not match its
 * directory: the RFQ addon lives at packages/addons-rfq but is toggled as
 * `quotes` (that is the id the storefront route guard checks). Resolve by the
 * declared flag before falling back to directory naming.
 */
export function resolveAddonByFlag(
  name: string,
  packagesDir: string
): { importPath: string; dirPath: string } | null {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(packagesDir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(packagesDir, entry.name, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (pkg?.['ecom-os']?.addon === true && pkg['ecom-os'].flag === name && typeof pkg.name === 'string') {
        return { importPath: pkg.name, dirPath: path.join(packagesDir, entry.name) };
      }
    } catch {
      // Unreadable package.json is not an addon we can resolve; keep looking.
    }
  }
  return null;
}

export function resolveAddon(
  name: string,
  pluginsDir: string,
  packagesDir: string
): { importPath: string; dirPath: string } | null {
  // Try packages/addons-{name} first (formal packages)
  const pkgPath = path.join(packagesDir, `addons-${name}`);
  if (fs.existsSync(pkgPath)) {
    return { importPath: `@ecom-os/addons-${name}`, dirPath: pkgPath };
  }
  // Then any package that declares this name as its addon flag
  const byFlag = resolveAddonByFlag(name, packagesDir);
  if (byFlag) return byFlag;
  // Fall back to plugins/{name}
  const pluginPath = path.join(pluginsDir, name);
  if (fs.existsSync(pluginPath)) {
    return { importPath: `../../../plugins/${name}`, dirPath: pluginPath };
  }
  return null;
}

export function loadAndValidateAddon(
  name: string,
  pluginsDir: string,
  packagesDir: string
): ResolvedAddon {
  const resolved = resolveAddon(name, pluginsDir, packagesDir);
  if (!resolved) {
    throw new Error(`Addon '${name}' not found in packages/addons-${name}/ or plugins/${name}/`);
  }

  const manifestPath = path.join(resolved.dirPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Addon '${name}' at ${resolved.dirPath} is missing required manifest.json file.`
    );
  }

  let rawManifest: unknown;
  try {
    rawManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err: any) {
    throw new Error(`Addon '${name}' has invalid manifest.json JSON: ${err.message}`);
  }

  const validation = validateAddonManifest(rawManifest);
  if (!validation.valid || !validation.manifest) {
    throw new Error(
      `Addon '${name}' manifest validation failed:\n  - ${validation.errors.join('\n  - ')}`
    );
  }

  return {
    name,
    importPath: resolved.importPath,
    dirPath: resolved.dirPath,
    manifest: validation.manifest,
  };
}

export function validateAllAddons(
  addonNames: string[],
  pluginsDir: string,
  packagesDir: string,
  engineApiVersion: string = process.env.ECOMOS_API_VERSION || '1.0.0'
): ResolvedAddon[] {
  const resolvedList: ResolvedAddon[] = [];
  const activeVersions: Record<string, string> = {};

  // First pass: load and schema-validate each manifest
  for (const name of addonNames) {
    const resolved = loadAndValidateAddon(name, pluginsDir, packagesDir);
    resolvedList.push(resolved);
    activeVersions[resolved.manifest.id] = resolved.manifest.version;
  }

  // Second pass: check engine API compatibility and cross-addon dependencies
  const allIssues: string[] = [];
  for (const resolved of resolvedList) {
    const compat = checkAddonCompatibility(resolved.manifest, engineApiVersion, activeVersions);
    if (!compat.compatible) {
      allIssues.push(...compat.issues);
    }
  }

  if (allIssues.length > 0) {
    throw new Error(`Addon compatibility checks failed:\n  - ${allIssues.join('\n  - ')}`);
  }

  return resolvedList;
}

export function generateAddonsFile(
  resolvedAddons: ResolvedAddon[],
  outPath: string
): void {
  const imports = resolvedAddons
    .map((a, i) => `import * as addon${i} from '${a.importPath}';`)
    .join('\n');
  const exportsArr = `export const registeredAddons: EcomAddon[] = [${resolvedAddons.map((_, i) => `addon${i}`).join(', ')}];`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    `import type { EcomAddon } from '@ecom-os/engine';\n${imports}\n\n${exportsArr}\n`
  );
}

// Execute when invoked directly from CLI
if (require.main === module || (process.argv[1] && process.argv[1].endsWith('generate-addons.ts'))) {
  loadEnv();
  const addonsEnv = process.env.ADDONS || '';
  const activeAddons = addonsEnv
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);

  const pluginsDir = path.join(__dirname, '../plugins');
  const packagesDir = path.join(__dirname, '../packages');
  const outPath = path.join(__dirname, '../apps/storefront/src/addons.generated.ts');

  try {
    const resolved = validateAllAddons(activeAddons, pluginsDir, packagesDir);
    generateAddonsFile(resolved, outPath);
    console.log(
      `Generated addons.generated.ts with ${resolved.length} validated addons: ${resolved.map(a => a.name).join(', ')}`
    );
  } catch (err: any) {
    console.error(`Error generating addons: ${err.message}`);
    process.exit(1);
  }
}
