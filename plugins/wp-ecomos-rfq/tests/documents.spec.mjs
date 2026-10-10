import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const documentsPhpPath = path.resolve(__dirname, '../documents.php');

test('wp-ecomos-rfq documents.php access protection and HTML escaping', () => {
  const code = fs.readFileSync(documentsPhpPath, 'utf8');

  // Verify functions
  assert.ok(code.includes('function ecomos_rfq_verify_document_access'), 'Must define ecomos_rfq_verify_document_access');
  assert.ok(code.includes('function ecomos_rfq_generate_document_html'), 'Must define ecomos_rfq_generate_document_html');

  // Check guest token verification
  assert.ok(code.includes('ecomos_rfq_verify_guest_access($quote, $provided_token)'), 'Must verify guest HMAC access token');

  // Check staff privilege authorization
  assert.ok(code.includes('ecomos_operator'), 'Must allow ecomos_operator capability');
  assert.ok(code.includes('manage_woocommerce'), 'Must allow manage_woocommerce capability');

  // Check HTML escaping for anti-injection
  assert.ok(code.includes('htmlspecialchars'), 'Must use htmlspecialchars for output sanitization');
  assert.ok(code.includes('ENT_QUOTES'), 'Must quote both double and single quotes');
  assert.ok(code.includes('UTF-8'), 'Must enforce UTF-8 charset');

  // Check honest stock disclaimer in generated document
  assert.ok(code.includes('ne réserve aucun inventaire physique'), 'Must include stock reservation disclaimer');
});
