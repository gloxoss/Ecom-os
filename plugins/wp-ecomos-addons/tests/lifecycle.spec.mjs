import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const pluginDir = path.resolve(currentDir, '..');

test('lifecycle.php functions and contracts', () => {
  const lifecyclePath = path.join(pluginDir, 'lifecycle.php');
  assert.ok(fs.existsSync(lifecyclePath), 'lifecycle.php must exist');

  const content = fs.readFileSync(lifecyclePath, 'utf8');
  assert.match(content, /function\s+ecomos_addon_install\s*\(/, 'Must define ecomos_addon_install');
  assert.match(content, /function\s+ecomos_addon_migrate_up\s*\(/, 'Must define ecomos_addon_migrate_up');
  assert.match(content, /function\s+ecomos_addon_rollback_down\s*\(/, 'Must define ecomos_addon_rollback_down');
  assert.match(content, /function\s+ecomos_addon_deactivate\s*\(/, 'Must define ecomos_addon_deactivate');
  assert.match(content, /function\s+ecomos_addon_verify_integrity\s*\(/, 'Must define ecomos_addon_verify_integrity');
});

test('Core WooCommerce data protection invariant', () => {
  const lifecyclePath = path.join(pluginDir, 'lifecycle.php');
  const content = fs.readFileSync(lifecyclePath, 'utf8');

  // Must detect and block DROP / ALTER on core tables
  assert.match(content, /posts|postmeta|wc_orders/, 'Must guard core WooCommerce tables');
  assert.match(content, /Prohibited SQL operation targeting core WooCommerce tables/, 'Must return explicit error on dangerous SQL');
});

test('Data retention on deactivation contract', () => {
  const lifecyclePath = path.join(pluginDir, 'lifecycle.php');
  const content = fs.readFileSync(lifecyclePath, 'utf8');

  // Must retain data by default ($retain_data = true)
  assert.match(content, /\$retain_data\s*=\s*true/, 'Must default $retain_data to true');
  assert.match(content, /update_option\(\s*['"]ecomos_active_addons['"]/, 'Must remove from active addons upon deactivation');
});

test('wp-ecomos-addons.php entrypoint includes lifecycle.php', () => {
  const mainPluginPath = path.join(pluginDir, 'wp-ecomos-addons.php');
  assert.ok(fs.existsSync(mainPluginPath), 'wp-ecomos-addons.php must exist');

  const content = fs.readFileSync(mainPluginPath, 'utf8');
  assert.match(content, /require_once.*lifecycle\.php/, 'Main plugin must require lifecycle.php');
});
