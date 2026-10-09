import fs from 'fs';
import path from 'path';

// Parse .env files manually so tsx doesn't need external env loaders
function loadEnv() {
  const envFiles = [
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '../apps/storefront', '.env.local'),
    path.join(__dirname, '../apps/storefront', '.env')
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
loadEnv();

const addonsEnv = process.env.ADDONS || '';
const activeAddons = addonsEnv.split(',').map(name => name.trim()).filter(Boolean);
const pluginsDir = path.join(__dirname, '../plugins');
const packagesDir = path.join(__dirname, '../packages');
const outPath = path.join(__dirname, '../apps/storefront/src/addons.generated.ts');

function resolveAddon(name: string): { importPath: string } | null {
  // Try packages/addons-{name} first (formal packages)
  const pkgPath = path.join(packagesDir, `addons-${name}`);
  if (fs.existsSync(pkgPath)) {
    return { importPath: `@ecom-os/addons-${name}` };
  }
  // Fall back to plugins/{name} (legacy plugins)
  const pluginPath = path.join(pluginsDir, name);
  if (fs.existsSync(pluginPath)) {
    return { importPath: `../../../plugins/${name}` };
  }
  return null;
}

const resolvedAddons = activeAddons.map(name => {
  const resolved = resolveAddon(name);
  if (!resolved) {
    console.error(`Error: Addon '${name}' not found in packages/addons-${name}/ or plugins/${name}/`);
    process.exit(1);
  }
  return { name, ...resolved };
});

const imports = resolvedAddons
  .map((a, i) => `import * as addon${i} from '${a.importPath}';`)
  .join('\n');
const exportsArr = `export const registeredAddons: EcomAddon[] = [${resolvedAddons.map((_, i) => `addon${i}`).join(', ')}];`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `import type { EcomAddon } from '@ecom-os/engine';\n${imports}\n\n${exportsArr}\n`);
console.log(`Generated addons.generated.ts with ${resolvedAddons.length} addons: ${resolvedAddons.map(a => a.name).join(', ')}`);
