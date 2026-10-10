import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const adminDir = path.resolve(currentDir, '..');
const evidenceDir = path.resolve(currentDir, '../../evidence/ECO-502');

test('SHELL_DECISION.md architecture and evaluation contract', () => {
  const decisionPath = path.join(adminDir, 'SHELL_DECISION.md');
  assert.ok(fs.existsSync(decisionPath), 'SHELL_DECISION.md must exist');
  
  const content = fs.readFileSync(decisionPath, 'utf8');
  assert.match(content, /WP Adminify/i, 'Must evaluate WP Adminify');
  assert.match(content, /White Label CMS/i, 'Must evaluate White Label CMS');
  assert.match(content, /Native WordPress Core/i, 'Must evaluate Native WordPress Core');
  assert.match(content, /HPOS/i, 'Must evaluate High-Performance Order Storage (HPOS)');
  assert.match(content, /Licensing/i, 'Must evaluate Licensing implications');
  assert.match(content, /Accessibility/i, 'Must evaluate Accessibility');
  assert.match(content, /AD-502/i, 'Must record architectural decision AD-502');
  assert.match(content, /Prohibit Stacking Competing Admin Shells/i, 'Must prohibit stacking competing admin shells');
});

test('SHELL_RUNBOOK.md operational and rollback procedures', () => {
  const runbookPath = path.join(adminDir, 'SHELL_RUNBOOK.md');
  assert.ok(fs.existsSync(runbookPath), 'SHELL_RUNBOOK.md must exist');
  
  const content = fs.readFileSync(runbookPath, 'utf8');
  assert.match(content, /Pre-Deployment Staging Verification/i, 'Must include pre-deployment staging checklist');
  assert.match(content, /Competing Shell Prevention/i, 'Must include competing shell prevention rule');
  assert.match(content, /Rollback & Disaster Recovery/i, 'Must include rollback procedures');
  assert.match(content, /wp plugin deactivate/i, 'Must document deactivation command');
  assert.match(content, /HPOS/i, 'Must include HPOS order check');
});

test('ECO-502 evidence documentation completeness', () => {
  const compatPath = path.join(evidenceDir, 'compatibility.md');
  const rollbackPath = path.join(evidenceDir, 'rollback.md');
  
  assert.ok(fs.existsSync(compatPath), 'compatibility.md evidence must exist');
  assert.ok(fs.existsSync(rollbackPath), 'rollback.md evidence must exist');
  
  const compatContent = fs.readFileSync(compatPath, 'utf8');
  assert.match(compatContent, /wc_orders/i, 'Must verify wc_orders table compatibility');
  assert.match(compatContent, /WCAG AA/i, 'Must document WCAG AA accessibility audit');
  assert.match(compatContent, /Native Selected/i, 'Must conclude with native option selected');

  const rollbackContent = fs.readFileSync(rollbackPath, 'utf8');
  assert.match(rollbackContent, /Deactivation/i, 'Must document deactivation test');
  assert.match(rollbackContent, /Database State & Hygiene/i, 'Must verify database hygiene post-rollback');
  assert.match(rollbackContent, /Zero-Risk Rollback/i, 'Must confirm zero-risk rollback guarantee');
});
