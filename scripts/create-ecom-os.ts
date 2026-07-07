#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const projectName = args[0];
const engineFlag = args.find(a => a.startsWith('--engine='))?.split('=')[1] ?? 'woocommerce';

if (!projectName) {
  console.error('Usage: npx create-ecom-os <project-name> [--engine=woocommerce|fake]');
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(projectName)) {
  console.error('Project name must be lowercase alphanumeric with hyphens only');
  process.exit(1);
}

const validEngines = ['woocommerce', 'fake'];
if (!validEngines.includes(engineFlag)) {
  console.error(`Unknown engine: "${engineFlag}". Valid: ${validEngines.join(', ')}`);
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), projectName);
if (fs.existsSync(targetDir)) {
  console.error(`Directory "${projectName}" already exists`);
  process.exit(1);
}

const templateDir = path.join(__dirname, '../templates/deployment');
if (!fs.existsSync(templateDir)) {
  console.error('Template directory not found. Is this run from the Ecom OS monorepo?');
  process.exit(1);
}

console.log(`Creating Ecom OS project: ${projectName} (engine: ${engineFlag})`);

// Copy template
copyDir(templateDir, targetDir);

// Substitute placeholders
substitutePlaceholders(targetDir, { PROJECT_NAME: projectName, BRAND_NAME: projectName });

// Write .env with engine
const envExample = path.join(targetDir, '.env.example');
const envOut = path.join(targetDir, '.env');
let envContent = fs.readFileSync(envExample, 'utf-8');
envContent = envContent.replace('ECOM_ENGINE=woocommerce', `ECOM_ENGINE=${engineFlag}`);
fs.writeFileSync(envOut, envContent);

console.log('Template copied. Installing dependencies...');
try {
  execSync('pnpm install', { cwd: targetDir, stdio: 'inherit' });
} catch (e) {
  console.log('pnpm install finished (with potential ignored scripts warnings).');
}

console.log(`
✅ Done! Your Ecom OS project is ready:

  cd ${projectName}
  cp .env.example .env   (already copied — fill in your WC credentials)
  pnpm dev

Documentation: https://github.com/gloxoss/Ecom-os
`);

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function substitutePlaceholders(dir: string, vars: Record<string, string>) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) { substitutePlaceholders(fullPath, vars); continue; }
    if (!['.ts', '.tsx', '.json', '.md', '.env', '.env.example'].some(ext => entry.name.endsWith(ext))) continue;
    let content = fs.readFileSync(fullPath, 'utf-8');
    for (const [k, v] of Object.entries(vars)) {
      content = content.replaceAll(`{{${k}}}`, v);
    }
    fs.writeFileSync(fullPath, content);
  }
}
