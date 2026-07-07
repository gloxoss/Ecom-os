import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

function walk(dir: string, fileList: string[] = []): string[] {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (statSync(filePath).isDirectory()) {
        walk(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    }
  } catch (e) {
    // Ignore if directory doesn't exist
  }
  return fileList;
}

console.log("Checking for illegal direct engine imports...");
let illegalCount = 0;
const storefrontFiles = walk('apps/storefront/src');
for (const file of storefrontFiles) {
  if (file.replace(/\\/g, '/').endsWith('lib/engine.ts')) continue;
  const content = readFileSync(file, 'utf-8');
  if (/import .* from '.*engine-(woocommerce|vendure)/.test(content)) {
    console.error(`❌ Illegal direct engine import in ${file}`);
    illegalCount++;
  }
}

if (illegalCount > 0) process.exit(1);
console.log("✅ Engine imports clean.");

console.log("Checking addon exports...");
try {
  const packagesDir = 'packages';
  const packages = readdirSync(packagesDir);
  for (const pkg of packages) {
    if (pkg.startsWith('addons-')) {
      const index = path.join(packagesDir, pkg, 'src/index.ts');
      try {
        const content = readFileSync(index, 'utf-8');
        if (!content.includes('export function register') && !content.includes('export const register')) {
          console.error(`❌ ${index} is missing export 'register'`);
          process.exit(1);
        }
        if (!content.includes('export function disable') && !content.includes('export const disable')) {
          console.error(`❌ ${index} is missing export 'disable'`);
          process.exit(1);
        }
      } catch (err) {
        // file doesn't exist
      }
    }
  }
} catch (e) {}

console.log("✅ Addon exports clean.");
process.exit(0);
