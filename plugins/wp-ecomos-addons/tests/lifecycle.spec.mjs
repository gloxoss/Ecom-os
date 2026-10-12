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

test('Core WordPress and WooCommerce migration guard contract', () => {
  const lifecyclePath = path.join(pluginDir, 'lifecycle.php');
  const content = fs.readFileSync(lifecyclePath, 'utf8');

  // Must guard comprehensive list of core WordPress and WooCommerce tables
  assert.match(content, /posts/, 'Must guard posts');
  assert.match(content, /postmeta/, 'Must guard postmeta');
  assert.match(content, /options/, 'Must guard options');
  assert.match(content, /users/, 'Must guard users');
  assert.match(content, /wc_orders/, 'Must guard wc_orders');
  assert.match(content, /wc_orders_meta/, 'Must guard wc_orders_meta');
  assert.match(content, /woocommerce_order_items/, 'Must guard woocommerce_order_items');

  // Must guard destructive DDL/DML operations
  assert.match(content, /DROP\\s\+\(\?:DATABASE\|SCHEMA\)/, 'Must prohibit DROP DATABASE / SCHEMA');
  assert.match(content, /DROP\|ALTER\|TRUNCATE\|RENAME\|DELETE/, 'Must prohibit destructive DDL/DML targeting core');
  assert.match(content, /Prohibited SQL operation targeting core WooCommerce tables/, 'Must return explicit error on dangerous SQL');
});

test('Simulated migration guard regex against prohibited and permitted SQL', () => {
  const prefixes = ['wp_', 'wpt_'];
  const coreNames = [
    'posts', 'postmeta', 'options', 'users', 'usermeta',
    'terms', 'term_taxonomy', 'term_relationships', 'comments', 'commentmeta',
    'wc_orders', 'wc_orders_meta', 'wc_order_product_lookup',
    'wc_order_stats', 'wc_customer_lookup',
    'woocommerce_order_items', 'woocommerce_order_itemmeta'
  ];

  const tables = [];
  for (const p of prefixes) {
    for (const c of coreNames) {
      tables.push(p + c);
    }
  }
  const disjunction = `(?:${tables.join('|')})`;
  const destructiveOp = /\b(?:DROP|ALTER|TRUNCATE|RENAME|DELETE)\b/i;
  const coreTarget = new RegExp(`(?:^|[^\\\`\\w$])(?:\\\`?[\\w$]+\\\`?\\s*\\.\\s*)?\\\`?${disjunction}\\\`?(?:[^\\\`\\w$]|$)`, 'i');
  const dropDbPattern = /\bDROP\s+(?:DATABASE|SCHEMA)\b/i;

  const isGuarded = (sql) => {
    return dropDbPattern.test(sql) || (destructiveOp.test(sql) && coreTarget.test(sql));
  };

  // Prohibited single-table statements must be rejected
  assert.equal(isGuarded('DROP TABLE wp_posts'), true);
  assert.equal(isGuarded('DROP TABLE `other_db`.`wpt_posts`'), true);
  assert.equal(isGuarded('DROP TABLE IF EXISTS wpt_options'), true);
  assert.equal(isGuarded('ALTER TABLE wpt_wc_orders ADD COLUMN injected VARCHAR(255)'), true);
  assert.equal(isGuarded('TRUNCATE TABLE wpt_wc_orders'), true);
  assert.equal(isGuarded('TRUNCATE wpt_users'), true);
  assert.equal(isGuarded('RENAME TABLE wpt_posts TO wpt_posts_old'), true);
  assert.equal(isGuarded('DELETE FROM wpt_postmeta WHERE meta_id > 100'), true);
  assert.equal(isGuarded('DROP DATABASE ecomos_production'), true);
  assert.equal(isGuarded('DROP SCHEMA ecomos_live'), true);

  // Prohibited multi-table and alias-style statements must be rejected (Finding F5)
  assert.equal(isGuarded('DROP TABLE wpt_ecomos_tmp, wpt_posts'), true);
  assert.equal(isGuarded('DELETE p FROM wpt_posts AS p'), true);
  assert.equal(isGuarded('RENAME TABLE wpt_ecomos_tmp TO wpt_ecomos_old, wpt_posts TO wpt_posts_old'), true);

  // Permitted statements on addon-owned tables must pass
  assert.equal(isGuarded('CREATE TABLE wpt_ecomos_reports (id INT PRIMARY KEY)'), false);
  assert.equal(isGuarded('ALTER TABLE wpt_ecomos_reports ADD COLUMN created_at DATETIME'), false);
  assert.equal(isGuarded('DROP TABLE wpt_ecomos_reports'), false);
  assert.equal(isGuarded('TRUNCATE TABLE wpt_ecomos_reports'), false);
  assert.equal(isGuarded('SELECT * FROM wpt_posts'), false);
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

test('Actual PHP ecomos_sql_targets_core_table evaluation across multi-table and alias SQL forms', async () => {
  const { execFileSync } = await import('node:child_process');
  const phpCandidates = [
    process.env.PHP_BIN,
    'C:/Users/OMEN/AppData/Roaming/Local/lightning-services/php-8.2.29+0/bin/win64/php.exe',
    'php',
  ].filter(Boolean);

  let phpBin = null;
  for (const candidate of phpCandidates) {
    try {
      execFileSync(candidate, ['-v'], { stdio: 'pipe' });
      phpBin = candidate;
      break;
    } catch {
      // try next
    }
  }

  if (!phpBin) {
    // If no PHP CLI found, skip execution
    return;
  }

  const lifecyclePhp = path.join(pluginDir, 'lifecycle.php').replace(/\\/g, '/');
  const phpScript = `
define('ABSPATH', 1);
$wpdb = (object) ['prefix' => 'wpt_'];
require '${lifecyclePhp}';
$cases = [
  'DROP TABLE wpt_posts' => true,
  'DROP TABLE wpt_ecomos_tmp, wpt_posts' => true,
  'DELETE p FROM wpt_posts AS p' => true,
  'RENAME TABLE wpt_ecomos_tmp TO wpt_ecomos_old, wpt_posts TO wpt_posts_old' => true,
  'DROP TABLE wpt_ecomos_tmp' => false,
  'SELECT * FROM wpt_posts' => false,
];
$results = [];
foreach ($cases as $sql => $expected) {
  $actual = ecomos_sql_targets_core_table($sql);
  if ($actual !== $expected) {
    $results[] = "FAIL: $sql (expected " . var_export($expected, true) . ", got " . var_export($actual, true) . ")";
  }
}
if (!empty($results)) {
  fwrite(STDERR, implode("\\n", $results) . "\\n");
  exit(1);
}
echo "ALL_PASSED";
`;

  const output = execFileSync(phpBin, ['-r', phpScript], { encoding: 'utf8' });
  assert.match(output, /ALL_PASSED/, 'PHP lifecycle guard function must pass all test cases');
});

