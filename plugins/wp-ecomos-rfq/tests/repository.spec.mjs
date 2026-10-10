import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPhpPath = path.resolve(__dirname, '../schema.php');
const repoPhpPath = path.resolve(__dirname, '../repository.php');

test('wp-ecomos-rfq schema.php contract and table structure', () => {
  const schemaCode = fs.readFileSync(schemaPhpPath, 'utf8');

  // Verify custom tables
  assert.ok(schemaCode.includes('ecomos_rfq_quotes'), 'Must define ecomos_rfq_quotes table');
  assert.ok(schemaCode.includes('ecomos_rfq_revisions'), 'Must define ecomos_rfq_revisions table');

  // Verify key fields in quotes table
  assert.ok(schemaCode.includes('id varchar(64) NOT NULL'), 'Must define quote id column');
  assert.ok(schemaCode.includes('quote_number varchar(32) NOT NULL'), 'Must define quote_number column');
  assert.ok(schemaCode.includes('state varchar(32) NOT NULL'), 'Must define state column');
  assert.ok(schemaCode.includes('customer_email varchar(128) NOT NULL'), 'Must define customer_email column');
  assert.ok(schemaCode.includes('access_secret_hash varchar(64) NOT NULL'), 'Must define access_secret_hash column');
  assert.ok(schemaCode.includes('current_revision_id varchar(32)'), 'Must define current_revision_id column');

  // Verify key fields in revisions table
  assert.ok(schemaCode.includes('revision_id varchar(32) NOT NULL'), 'Must define revision_id column');
  assert.ok(schemaCode.includes('revision_number int unsigned NOT NULL'), 'Must define revision_number column');
  assert.ok(schemaCode.includes('lines_data longtext NOT NULL'), 'Must define lines_data column');
  assert.ok(schemaCode.includes('subtotal_excl_tax decimal(12,2)'), 'Must define subtotal column');
  assert.ok(schemaCode.includes('total_tax decimal(12,2)'), 'Must define tax column');
  assert.ok(schemaCode.includes('total_incl_tax decimal(12,2)'), 'Must define total column');
  assert.ok(schemaCode.includes('is_current tinyint(1)'), 'Must define is_current flag');
  assert.ok(schemaCode.includes('UNIQUE KEY uq_quote_revision'), 'Must enforce unique quote revision constraint');

  // Verify data retention contract
  assert.ok(schemaCode.includes('ecomos_rfq_uninstall_schema($drop_tables = false)'), 'Must retain data by default on uninstall');
});

test('wp-ecomos-rfq repository.php functions and revision immutability', () => {
  const repoCode = fs.readFileSync(repoPhpPath, 'utf8');

  // Core CRUD functions
  assert.ok(repoCode.includes('function ecomos_rfq_create_quote'), 'Must define ecomos_rfq_create_quote');
  assert.ok(repoCode.includes('function ecomos_rfq_get_quote'), 'Must define ecomos_rfq_get_quote');
  assert.ok(repoCode.includes('function ecomos_rfq_get_revisions'), 'Must define ecomos_rfq_get_revisions');
  assert.ok(repoCode.includes('function ecomos_rfq_add_revision'), 'Must define ecomos_rfq_add_revision');
  assert.ok(repoCode.includes('function ecomos_rfq_update_state'), 'Must define ecomos_rfq_update_state');
  assert.ok(repoCode.includes('function ecomos_rfq_verify_guest_access'), 'Must define ecomos_rfq_verify_guest_access');

  // Verify revision immutability logic: prior revisions deactivated, new revision stamped
  assert.ok(repoCode.includes("'is_current' => 0"), 'Must deactivate prior revisions atomically');
  assert.ok(repoCode.includes("'is_current'           => 1"), 'Must set newly added revision as current');

  // Verify constant-time guest token hash verification
  assert.ok(repoCode.includes('hash_equals'), 'Must use hash_equals to protect against timing attacks');
  assert.ok(repoCode.includes("hash('sha256'"), 'Must compute sha256 hash of provided guest secret');
});
