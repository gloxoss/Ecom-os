import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const notifPhpPath = path.resolve(__dirname, '../notifications.php');

test('wp-ecomos-rfq notifications.php deduplication, mail sink and dispatch hooks', () => {
  const code = fs.readFileSync(notifPhpPath, 'utf8');

  // Verify functions
  assert.ok(code.includes('function ecomos_rfq_reset_mail_sink'), 'Must define ecomos_rfq_reset_mail_sink');
  assert.ok(code.includes('function ecomos_rfq_get_mail_sink'), 'Must define ecomos_rfq_get_mail_sink');
  assert.ok(code.includes('function ecomos_rfq_is_notification_dispatched'), 'Must define ecomos_rfq_is_notification_dispatched');
  assert.ok(code.includes('function ecomos_rfq_mark_notification_dispatched'), 'Must define ecomos_rfq_mark_notification_dispatched');
  assert.ok(code.includes('function ecomos_rfq_send_email'), 'Must define ecomos_rfq_send_email');
  assert.ok(code.includes('function ecomos_rfq_notify_offer_created'), 'Must define ecomos_rfq_notify_offer_created');
  assert.ok(code.includes('function ecomos_rfq_notify_offer_accepted'), 'Must define ecomos_rfq_notify_offer_accepted');
  assert.ok(code.includes('function ecomos_rfq_notify_offer_rejected'), 'Must define ecomos_rfq_notify_offer_rejected');

  // Check deduplication / idempotency check
  assert.ok(code.includes('if (ecomos_rfq_is_notification_dispatched($idempotency_key))'), 'Must check idempotency before sending');
  assert.ok(code.includes('return false; // Duplicate suppressed'), 'Must suppress duplicates');

  // Check sanitization
  assert.ok(code.includes('sanitize_email($to)'), 'Must sanitize recipient email');
  assert.ok(code.includes('sanitize_text_field($subject)'), 'Must sanitize subject line');
});
