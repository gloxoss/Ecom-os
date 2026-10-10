import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const capabilitiesPhpPath = path.resolve(__dirname, '../capabilities.php');
const roleMatrixDocPath = path.resolve(__dirname, '../../../docs/ecomos/admin/ROLE_MATRIX.md');

test('EcomOS capabilities.php source and structure contract', () => {
  const phpCode = fs.readFileSync(capabilitiesPhpPath, 'utf8');

  // Verify role definitions
  assert.ok(phpCode.includes("'ecomos_operator'"), 'Must define ecomos_operator role');
  assert.ok(phpCode.includes("'ecomos_fulfillment'"), 'Must define ecomos_fulfillment role');

  // Verify key capabilities for operator
  assert.ok(phpCode.includes("'edit_products'"), 'Must map edit_products capability');
  assert.ok(phpCode.includes("'edit_shop_orders'"), 'Must map edit_shop_orders capability');
  assert.ok(phpCode.includes("'edit_shop_coupons'"), 'Must map edit_shop_coupons capability');
  assert.ok(phpCode.includes("'ecomos_manage_inventory'"), 'Must map ecomos_manage_inventory capability');
  assert.ok(phpCode.includes("'ecomos_manage_quotes'"), 'Must map ecomos_manage_quotes capability');

  // Verify forbidden capabilities for operator
  assert.ok(/'manage_options'\s*=>\s*false/.test(phpCode), 'Operator must be denied manage_options');
  assert.ok(/'activate_plugins'\s*=>\s*false/.test(phpCode), 'Operator must be denied activate_plugins');
  assert.ok(/'edit_plugins'\s*=>\s*false/.test(phpCode), 'Operator must be denied edit_plugins');

  // Verify fulfillment capability boundaries
  assert.ok(/'edit_products'\s*=>\s*false/.test(phpCode), 'Fulfillment must be denied edit_products');
  assert.ok(/'edit_shop_coupons'\s*=>\s*false/.test(phpCode), 'Fulfillment must be denied edit_shop_coupons');

  // Verify REST permission callback and 403 status code
  assert.ok(phpCode.includes("'rest_forbidden'"), 'Must return rest_forbidden code on unauthorized access');
  assert.ok(phpCode.includes("403"), 'Must emit HTTP 403 status on unauthorized access');

  // Verify dynamic quote addon gating
  assert.ok(phpCode.includes("ecomos_is_quote_addon_active"), 'Must gate quotes by addon activation');

  // Verify direct admin url protection
  assert.ok(phpCode.includes("admin_init"), 'Must hook admin_init for direct URL interception');
  assert.ok(phpCode.includes("options-general.php"), 'Must block options-general.php');
  assert.ok(phpCode.includes("plugins.php"), 'Must block plugins.php');
});

test('ROLE_MATRIX.md specification completeness', () => {
  const doc = fs.readFileSync(roleMatrixDocPath, 'utf8');

  assert.ok(doc.includes('ecomos_operator'), 'Document must define ecomos_operator');
  assert.ok(doc.includes('ecomos_fulfillment'), 'Document must define ecomos_fulfillment');
  assert.ok(doc.includes('read_private_shop_orders'), 'Document must cover order queue');
  assert.ok(doc.includes('edit_products'), 'Document must cover products');
  assert.ok(doc.includes('ecomos_manage_quotes'), 'Document must cover quotes');
  assert.ok(doc.includes('manage_options'), 'Document must cover technical options isolation');
});
