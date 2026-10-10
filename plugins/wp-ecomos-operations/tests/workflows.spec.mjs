import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const pluginDir = path.resolve(currentDir, '..');
const adminDir = path.resolve(pluginDir, '../../docs/ecomos/admin');
const evidenceDir = path.resolve(pluginDir, '../../docs/ecomos/evidence/ECO-504');

test('MERCHANT_RUNBOOK.md completeness and workflow guidance', () => {
  const runbookPath = path.join(adminDir, 'MERCHANT_RUNBOOK.md');
  assert.ok(fs.existsSync(runbookPath), 'MERCHANT_RUNBOOK.md must exist');

  const content = fs.readFileSync(runbookPath, 'utf8');
  assert.match(content, /Daily Operations/i, 'Must specify daily morning operations');
  assert.match(content, /Order Fulfillment Workflow/i, 'Must specify order fulfillment steps');
  assert.match(content, /HPOS/i, 'Must reference WooCommerce HPOS order screens');
  assert.match(content, /Product Catalog & Inventory Management/i, 'Must specify product and stock workflows');
  assert.match(content, /Promotions & Discount Coupons/i, 'Must specify coupon promotions');
  assert.match(content, /Optional Addon Off-State Behavior/i, 'Must document addon off-state behavior');
  assert.match(content, /Escalation Paths/i, 'Must provide clear escalation matrix');
});

test('PLATFORM_RUNBOOK.md technical boundaries and secrets containment', () => {
  const platformRunbookPath = path.join(adminDir, 'PLATFORM_RUNBOOK.md');
  assert.ok(fs.existsSync(platformRunbookPath), 'PLATFORM_RUNBOOK.md must exist');

  const content = fs.readFileSync(platformRunbookPath, 'utf8');
  assert.match(content, /Least Privilege Architecture/i, 'Must specify least privilege architecture');
  assert.match(content, /Secrets & Payment Gateway Credentials/i, 'Must specify secrets management');
  assert.match(content, /Zero Hardcoded Secrets/i, 'Must enforce zero hardcoded secrets invariant');
  assert.match(content, /Plugin Lifecycle/i, 'Must define plugin lifecycle and staging procedures');
  assert.match(content, /Emergency Triage/i, 'Must document emergency restoration procedures');
});

test('Role capability and negative permission matrices', () => {
  const capabilitiesPath = path.join(pluginDir, 'capabilities.php');
  const content = fs.readFileSync(capabilitiesPath, 'utf8');

  // Verify non-admins denied critical platform capabilities
  const deniedCaps = ['manage_options', 'activate_plugins', 'edit_plugins', 'edit_themes', 'edit_files'];
  for (const cap of deniedCaps) {
    // Assert denied caps are NOT in operator or fulfillment capabilities lists
    assert.match(content, new RegExp(`['"]${cap}['"]\\s*=>\\s*false`), `Capability ${cap} must be explicitly mapped to false for staff roles`);
  }
});
