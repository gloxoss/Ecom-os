import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const convPhpPath = path.resolve(__dirname, '../conversion.php');
const routesPhpPath = path.resolve(__dirname, '../routes.php');

test('wp-ecomos-rfq conversion.php WooCommerce order creation & idempotency contracts', () => {
  const code = fs.readFileSync(convPhpPath, 'utf8');

  // Verify core function
  assert.ok(code.includes('function ecomos_rfq_convert_quote_to_order'), 'Must define ecomos_rfq_convert_quote_to_order');
  assert.ok(code.includes('function ecomos_rfq_reset_mock_orders'), 'Must define ecomos_rfq_reset_mock_orders');
  assert.ok(code.includes('function ecomos_rfq_get_mock_orders'), 'Must define ecomos_rfq_get_mock_orders');

  // Acceptance state gate
  assert.ok(code.includes("$quote['state'] !== 'accepted'"), 'Must strictly enforce that quote state is accepted');
  assert.ok(code.includes('invalid_conversion_state'), 'Must emit invalid_conversion_state code');

  // Idempotency: duplicate conversion returns existing order without creating new one
  assert.ok(code.includes("!empty($quote['converted_order_id'])"), 'Must check if quote was already converted');
  assert.ok(code.includes("'isDuplicate' => true"), 'Must flag idempotent replay as duplicate');

  // Cross-audit metadata references
  assert.ok(code.includes('_ecomos_rfq_quote_id'), 'Must store quote ID audit metadata on order');
  assert.ok(code.includes('_ecomos_rfq_quote_number'), 'Must store quote number audit metadata on order');
  assert.ok(code.includes('_ecomos_rfq_revision_id'), 'Must store accepted revision ID audit metadata on order');
  assert.ok(code.includes('_ecomos_conversion_timestamp'), 'Must store conversion timestamp audit metadata on order');

  // Stock reservation policy check
  assert.ok(code.includes('ecomos_rfq_stock_reservation'), 'Must read configurable stock reservation policy');
  assert.ok(code.includes("'on_acceptance'"), 'Must support on_acceptance stock reservation mode');

  // State transition on quote table
  assert.ok(code.includes("'state'              => 'converted_to_order'"), 'Must transition quote state to converted_to_order');
  assert.ok(code.includes("'converted_order_id' => (string) $order_id"), 'Must link converted order ID on quote record');

  // Event emission hook
  assert.ok(code.includes("do_action('ecomos_rfq_quote_converted'"), 'Must emit ecomos_rfq_quote_converted action hook');

  // Atomic single-conversion locking & cleanup
  assert.ok(code.includes('function ecomos_rfq_claim_quote_for_conversion'), 'Must define atomic conversion claim');
  assert.ok(code.includes('function ecomos_rfq_release_conversion_claim'), 'Must define conversion claim release');
  assert.ok(code.includes('function ecomos_rfq_discard_unlinked_order'), 'Must discard unlinked orders on write failure');
  assert.ok(code.includes("'conversion_in_progress'"), 'Must reject concurrent in-progress conversion');
});

test('wp-ecomos-rfq routes.php includes /convert endpoint with permission guard', () => {
  const routesCode = fs.readFileSync(routesPhpPath, 'utf8');

  assert.ok(routesCode.includes("'/quotes/(?P<id>[\\w-]+)/convert'"), 'Must register /convert REST route');
  assert.ok(routesCode.includes('ecomos_rfq_rest_convert_quote'), 'Must define conversion route callback');
  assert.ok(routesCode.includes('ecomos_rfq_convert_quote_to_order($quote_id'), 'Must invoke conversion engine');
});
