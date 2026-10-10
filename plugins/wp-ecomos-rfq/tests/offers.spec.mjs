import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const offersPhpPath = path.resolve(__dirname, '../offers.php');

test('wp-ecomos-rfq offers.php function definitions and server pricing logic', () => {
  const code = fs.readFileSync(offersPhpPath, 'utf8');

  // Verify functions
  assert.ok(code.includes('function ecomos_rfq_calculate_offer_line'), 'Must define ecomos_rfq_calculate_offer_line');
  assert.ok(code.includes('function ecomos_rfq_calculate_offer_totals'), 'Must define ecomos_rfq_calculate_offer_totals');
  assert.ok(code.includes('function ecomos_rfq_validate_offer_payload'), 'Must define ecomos_rfq_validate_offer_payload');
  assert.ok(code.includes('function ecomos_rfq_create_staff_offer'), 'Must define ecomos_rfq_create_staff_offer');
  assert.ok(code.includes('function ecomos_rfq_can_accept_revision'), 'Must define ecomos_rfq_can_accept_revision');

  // Tax calculation precision
  assert.ok(code.includes('round($unit_price * $qty, 2)'), 'Must round total excl tax to 2 decimals');
  assert.ok(code.includes('round($total_excl_tax * $tax_rate, 2)'), 'Must round tax amount to 2 decimals');

  // Expiration boundary check
  assert.ok(code.includes('$expires_at <= $current_time'), 'Must reject past expiration timestamp');
  assert.ok(code.includes('expiration_past'), 'Must return expiration_past error code');

  // Terminal quote state guard
  assert.ok(code.includes("'cancelled', 'rejected', 'converted_to_order'"), 'Must guard against modifying terminal quotes');

  // Stale revision invariant
  assert.ok(code.includes('$revision_id !== $quote[\'current_revision_id\']'), 'Must prevent accepting superseded revisions');
  assert.ok(code.includes('stale_revision'), 'Must emit stale_revision error code');
});
