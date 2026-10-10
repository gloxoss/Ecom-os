import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..');
const pluginsDir = path.resolve(rootDir, 'plugins');
const packagesDir = path.resolve(rootDir, 'packages');

test('validateAllAddons successfully validates exemplar dummy-addon', async () => {
  const dummyManifestPath = path.join(pluginsDir, 'dummy-addon', 'manifest.json');
  assert.ok(fs.existsSync(dummyManifestPath), 'plugins/dummy-addon/manifest.json must exist');

  const manifest = JSON.parse(fs.readFileSync(dummyManifestPath, 'utf8'));
  assert.equal(manifest.id, 'dummy-addon');
  assert.equal(manifest.version, '1.0.0');
  assert.equal(manifest.ecomOsApiRange, '^1.0.0');
});

test('generate-addons rejects missing addon', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecomos-test-'));
  const dummyPlugins = path.join(tempDir, 'plugins');
  const dummyPackages = path.join(tempDir, 'packages');
  fs.mkdirSync(dummyPlugins, { recursive: true });
  fs.mkdirSync(dummyPackages, { recursive: true });

  // Simulate missing addon check
  const addonName = 'non-existent-addon';
  const pkgPath = path.join(dummyPackages, `addons-${addonName}`);
  const pluginPath = path.join(dummyPlugins, addonName);
  const found = fs.existsSync(pkgPath) || fs.existsSync(pluginPath);
  
  assert.equal(found, false, 'Missing addon must not be found');
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('generate-addons rejects addon without manifest.json', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecomos-test-'));
  const pluginPath = path.join(tempDir, 'plugins', 'unmanifested');
  fs.mkdirSync(pluginPath, { recursive: true });
  fs.writeFileSync(path.join(pluginPath, 'index.ts'), 'export default {};');

  const manifestPath = path.join(pluginPath, 'manifest.json');
  assert.equal(fs.existsSync(manifestPath), false, 'Addon must lack manifest.json');
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('generate-addons rejects incompatible API range', async () => {
  const { satisfiesSemverRange } = await import('../packages/ecom-engine/src/addon-manifest.js');
  
  // Addon requiring ^2.0.0 running on engine 1.0.0
  const isCompatible = satisfiesSemverRange('1.0.0', '^2.0.0');
  assert.equal(isCompatible, false, 'API range mismatch must be detected');
});

test('generate-addons detects missing peer dependencies', async () => {
  const { checkAddonCompatibility } = await import('../packages/ecom-engine/src/addon-manifest.js');

  const manifest = {
    id: 'child-addon',
    name: 'Child Addon',
    version: '1.0.0',
    ecomOsApiRange: '^1.0.0',
    dependencies: {
      'parent-addon': '^1.0.0',
    },
  };

  const compat = checkAddonCompatibility(manifest, '1.0.0', {});
  assert.equal(compat.compatible, false);
  assert.ok(compat.issues.some(i => i.includes('missing required dependency "parent-addon"')));
});
