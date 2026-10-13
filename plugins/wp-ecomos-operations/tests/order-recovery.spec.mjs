import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const pluginDir = path.resolve(currentDir, '..');
const orderRecoveryPhp = path.join(pluginDir, 'order-recovery.php');
const mainPluginPhp = path.join(pluginDir, 'wp-ecomos-operations.php');
const testPhpPath = path.join(currentDir, 'order-recovery.test.php');

test('order-recovery.php file exists and is required by wp-ecomos-operations.php', () => {
  assert.ok(fs.existsSync(orderRecoveryPhp), 'order-recovery.php must exist');
  const mainContent = fs.readFileSync(mainPluginPhp, 'utf8');
  assert.match(
    mainContent,
    /require_once.*order-recovery\.php/,
    'wp-ecomos-operations.php must require order-recovery.php'
  );
});

test('order-recovery.php order attempt metadata sync contract', () => {
  const content = fs.readFileSync(orderRecoveryPhp, 'utf8');

  // Verify attempt marker pattern matching
  assert.match(
    content,
    /\[ecomos-attempt:([^\]\r\n]+)\]/,
    'Must match exact [ecomos-attempt:<id>] correlation marker'
  );

  // Verify meta key is _ecomos_attempt_id
  assert.match(
    content,
    /'_ecomos_attempt_id'/,
    'Must store attempt in _ecomos_attempt_id meta key'
  );

  // Verify WC CRUD usage (HPOS and legacy safe)
  assert.match(
    content,
    /\$order->update_meta_data\s*\(\s*'_ecomos_attempt_id'/,
    'Must update meta via $order->update_meta_data'
  );
  assert.match(
    content,
    /\$order->save\s*\(/,
    'Must persist order via $order->save'
  );

  // Verify hook registrations
  assert.match(
    content,
    /add_action\s*\(\s*['"]woocommerce_store_api_checkout_order_processed['"]/,
    'Must hook Store API checkout processing'
  );
  assert.match(
    content,
    /add_action\s*\(\s*['"]woocommerce_checkout_order_processed['"]/,
    'Must hook standard checkout processing'
  );
  assert.match(
    content,
    /add_action\s*\(\s*['"]woocommerce_new_order['"]/,
    'Must hook new order creation'
  );
});

test('order-recovery.php REST route registration and security contract', () => {
  const content = fs.readFileSync(orderRecoveryPhp, 'utf8');

  // Verify REST namespace and route
  assert.match(
    content,
    /register_rest_route\s*\(\s*['"]ecomos\/v1['"]\s*,\s*['"]\/orders\/by-attempt\//,
    'Must register route GET /wp-json/ecomos/v1/orders/by-attempt/<id>'
  );

  // Verify permission callback enforces read_private_shop_orders and rejects guests
  assert.match(
    content,
    /is_user_logged_in\s*\(\s*\)/,
    'Must check if user is logged in'
  );
  assert.match(
    content,
    /current_user_can\s*\(\s*['"]read_private_shop_orders['"]\s*\)/,
    'Must enforce read_private_shop_orders capability'
  );
  assert.match(
    content,
    /401/,
    'Must return HTTP 401 for unauthenticated caller'
  );
  assert.match(
    content,
    /403/,
    'Must return HTTP 403 for non-capable caller'
  );

  // Verify route is never public
  assert.doesNotMatch(
    content,
    /'permission_callback'\s*=>\s*'__return_true'/,
    'Order attempt lookup route must NEVER be public (__return_true)'
  );

  // Verify minimal response boundary: only orderId, orderKey, billingEmail
  assert.match(
    content,
    /'orderId'\s*=>/,
    'Response must contain orderId'
  );
  assert.match(
    content,
    /'orderKey'\s*=>/,
    'Response must contain orderKey'
  );
  assert.match(
    content,
    /'billingEmail'\s*=>/,
    'Response must contain billingEmail'
  );

  // Data leakage guards: must not expose sensitive details
  assert.doesNotMatch(content, /'payment_method'/i, 'Must not leak payment method');
  assert.doesNotMatch(content, /'line_items'/i, 'Must not leak line items');
  assert.doesNotMatch(content, /'shipping_address'/i, 'Must not leak shipping address');
  assert.doesNotMatch(content, /'customer_note'/i, 'Must not leak customer note in response');
});

test('order-recovery.test.php standalone PHP contract suite execution', () => {
  const phpBin = fs.existsSync('C:/Users/OMEN/AppData/Roaming/Local/lightning-services/php-8.2.29+0/bin/win64/php.exe')
    ? 'C:/Users/OMEN/AppData/Roaming/Local/lightning-services/php-8.2.29+0/bin/win64/php.exe'
    : 'php';

  const output = execFileSync(phpBin, [testPhpPath], {
    encoding: 'utf8',
    windowsHide: true,
  });

  assert.match(output, /All PHP order recovery contract tests passed/);
});
