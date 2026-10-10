import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesPhpPath = path.resolve(__dirname, '../routes.php');
const notifPhpPath = path.resolve(__dirname, '../notifications.php');
const convPhpPath = path.resolve(__dirname, '../conversion.php');
const offersPhpPath = path.resolve(__dirname, '../offers.php');

test('wp-ecomos-rfq off-state isolation contracts', () => {
  const routesCode = fs.readFileSync(routesPhpPath, 'utf8');
  const notifCode = fs.readFileSync(notifPhpPath, 'utf8');
  const convCode = fs.readFileSync(convPhpPath, 'utf8');
  const offersCode = fs.readFileSync(offersPhpPath, 'utf8');

  // 1. Authoritative active check in routes.php
  assert.ok(routesCode.includes('function ecomos_rfq_is_active'), 'Must define ecomos_rfq_is_active');
  assert.ok(routesCode.includes('ecomos_addon_quotes_active'), 'Must read ecomos_addon_quotes_active option');
  assert.ok(routesCode.includes("'addon_disabled'"), 'Must return addon_disabled error when inactive');

  // 2. All routes wire permission callback to check active
  assert.ok(routesCode.includes('ecomos_rfq_rest_check_active'), 'Must define ecomos_rfq_rest_check_active gate');

  // 3. Notification suppression when disabled
  assert.ok(
    notifCode.includes("function_exists('ecomos_rfq_is_active') && !ecomos_rfq_is_active()"),
    'Must suppress notification dispatches when RFQ is disabled'
  );

  // 4. Conversion blocked when disabled
  assert.ok(
    convCode.includes("function_exists('ecomos_rfq_is_active') && !ecomos_rfq_is_active()"),
    'Must block order conversion when RFQ is disabled'
  );

  // 5. Offer creation blocked when disabled
  assert.ok(
    offersCode.includes("function_exists('ecomos_rfq_is_active') && !ecomos_rfq_is_active()"),
    'Must block offer creation when RFQ is disabled'
  );
});
