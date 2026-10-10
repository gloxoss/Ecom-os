import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const pluginDir = path.resolve(currentDir, '..');

test('admin-page.php menu registration and capability gating contract', () => {
  const adminPagePath = path.join(pluginDir, 'admin-page.php');
  assert.ok(fs.existsSync(adminPagePath), 'admin-page.php must exist');

  const content = fs.readFileSync(adminPagePath, 'utf8');
  assert.match(content, /add_menu_page\s*\(/, 'Must register menu page with add_menu_page');
  assert.match(content, /'edit_shop_orders'/, 'Must require edit_shop_orders capability to view menu');
  assert.match(content, /'ecomos-operations'/, 'Must register menu slug ecomos-operations');
  assert.match(content, /current_user_can\s*\(\s*['"]edit_shop_orders['"]\s*\)/, 'Must check capability server-side in render function');
  assert.match(content, /wp_die\s*\([\s\S]*?,\s*403\s*\)/, 'Must terminate with HTTP 403 when capability is missing');
});

test('admin-page.php WooCommerce HPOS integration & zero second backend', () => {
  const adminPagePath = path.join(pluginDir, 'admin-page.php');
  const content = fs.readFileSync(adminPagePath, 'utf8');

  assert.match(content, /wc_get_orders|wc_orders_count/, 'Must query orders via native WooCommerce API');
  assert.match(content, /wc_get_products/, 'Must query products via native WooCommerce API');
  assert.match(content, /page=wc-orders&action=edit&id=/, 'Must link directly to native HPOS order edit screen');
  assert.match(content, /post\.php\?post=.*&action=edit/, 'Must link directly to native product edit screen');
  
  // Anti-patterns: no secondary custom databases or remote microservices
  assert.doesNotMatch(content, /CREATE\s+TABLE/i, 'Must not create duplicate reporting tables');
  assert.doesNotMatch(content, /localhost:3000|localhost:4000/i, 'Must not call secondary Next.js merchant backend');
});

test('admin-page.php dynamic addon slot isolation', () => {
  const adminPagePath = path.join(pluginDir, 'admin-page.php');
  const content = fs.readFileSync(adminPagePath, 'utf8');

  assert.match(content, /do_action\s*\(\s*['"]ecomos_operations_addon_slots['"]\s*\)/, 'Must declare dynamic addon slot action hook');
  assert.match(content, /get_option\s*\(\s*['"]ecomos_addon_quotes_enabled['"]/, 'Must inspect quote addon enabled flag');
  assert.match(content, /if\s*\(\s*\$addon_enabled\s*!==\s*['"]yes['"]\s*\)\s*\{[\s\S]*?return;/, 'Must return early if quote addon is disabled');
});

test('wp-ecomos-operations.php includes admin-page.php', () => {
  const mainPluginPath = path.join(pluginDir, 'wp-ecomos-operations.php');
  const content = fs.readFileSync(mainPluginPath, 'utf8');
  assert.match(content, /require_once.*admin-page\.php/, 'Main plugin must require admin-page.php');
});
