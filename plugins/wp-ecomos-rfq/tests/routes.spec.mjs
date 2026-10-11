import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesPhpPath = path.resolve(__dirname, '../routes.php');
const entrypointPhpPath = path.resolve(__dirname, '../wp-ecomos-rfq.php');
const decisionDocPath = path.resolve(__dirname, '../../../docs/ecomos/rfq/BACKEND_DECISION.md');

test('wp-ecomos-rfq routes.php endpoint definitions and security callbacks', () => {
  const routesCode = fs.readFileSync(routesPhpPath, 'utf8');

  // Verify REST namespace
  assert.ok(routesCode.includes("'ecomos/v1/rfq'"), 'Must register ecomos/v1/rfq namespace');

  // Verify route endpoints
  assert.ok(routesCode.includes("register_rest_route($namespace, '/quotes'"), 'Must register /quotes endpoint');
  assert.ok(routesCode.includes("register_rest_route($namespace, '/quotes/(?P<id>[\\w-]+)'"), 'Must register GET /quotes/{id} endpoint');
  assert.ok(routesCode.includes("register_rest_route($namespace, '/quotes/(?P<id>[\\w-]+)/offers'"), 'Must register POST /quotes/{id}/offers endpoint');
  assert.ok(routesCode.includes("register_rest_route($namespace, '/quotes/(?P<id>[\\w-]+)/accept'"), 'Must register POST /quotes/{id}/accept endpoint');
  assert.ok(routesCode.includes("register_rest_route($namespace, '/quotes/(?P<id>[\\w-]+)/reject'"), 'Must register POST /quotes/{id}/reject endpoint');

  // Verify off-state gate
  assert.ok(routesCode.includes('ecomos_rfq_is_active'), 'Must check addon active status');
  assert.ok(routesCode.includes("'addon_disabled'"), 'Must emit addon_disabled on off-state');
  assert.ok(routesCode.includes('404'), 'Must emit HTTP 404 when addon is disabled');

  // Verify staff role check on offers
  assert.ok(routesCode.includes("current_user_can('ecomos_operator')"), 'Must check ecomos_operator capability for offers');

  // Verify guest token verification
  assert.ok(routesCode.includes("'x-quote-token'"), 'Must read x-quote-token header for guest authentication');
  assert.ok(routesCode.includes('ecomos_rfq_verify_guest_access'), 'Must invoke guest access verification');

  // Verify guest/staff decoupling: accept and revise require guest token and reject staff substitution
  assert.ok(routesCode.includes('Guest access token required to accept offer'), 'Accept offer requires guest token');
  assert.ok(routesCode.includes('Guest access token required to request revision'), 'Request revision requires guest token');

  // Verify stale revision rejection (HTTP 409)
  assert.ok(routesCode.includes("'stale_revision'"), 'Must reject stale revision acceptance');
  assert.ok(routesCode.includes('409'), 'Must emit HTTP 409 status on stale revision attempt');

  // Verify expired quote rejection (HTTP 410)
  assert.ok(routesCode.includes("'quote_expired'"), 'Must reject expired quote acceptance');
  assert.ok(routesCode.includes('410'), 'Must emit HTTP 410 status on expired quote attempt');

  // Verify no-store privacy header
  assert.ok(routesCode.includes("'no-store, private'"), 'Must include no-store, private header on responses');

  // Verify terminal and protected state guards on offer and guest actions
  assert.ok(routesCode.includes('Cannot add or amend offer for quote in protected state'), 'Must protect quotes from offer amendment');
  assert.ok(routesCode.includes('$allowed_accept_states = array(\'offer_created\', \'revised\')'), 'Must limit accept to valid offer states');
  assert.ok(routesCode.includes('$allowed_reject_states = array(\'submitted\', \'verified\', \'offer_created\', \'revised\', \'revision_requested\')'), 'Must protect terminal quotes from rejection');
  assert.ok(routesCode.includes('$allowed_revise_states = array(\'offer_created\', \'revised\')'), 'Must limit revise to valid offer states');
  assert.ok(routesCode.includes('Could not transition quote to accepted due to concurrent state modification'), 'Must enforce atomic CAS transition on accept');
});

test('wp-ecomos-rfq.php entrypoint and activation hooks', () => {
  const entryCode = fs.readFileSync(entrypointPhpPath, 'utf8');

  assert.ok(entryCode.includes("require_once ECOMOS_RFQ_PLUGIN_DIR . 'schema.php';"), 'Must load schema.php');
  assert.ok(entryCode.includes("require_once ECOMOS_RFQ_PLUGIN_DIR . 'repository.php';"), 'Must load repository.php');
  assert.ok(entryCode.includes("require_once ECOMOS_RFQ_PLUGIN_DIR . 'routes.php';"), 'Must load routes.php');
  assert.ok(entryCode.includes('register_activation_hook'), 'Must register activation hook');
  assert.ok(entryCode.includes('register_deactivation_hook'), 'Must register deactivation hook');
});

test('BACKEND_DECISION.md document completeness', () => {
  const doc = fs.readFileSync(decisionDocPath, 'utf8');

  assert.ok(doc.includes('AD-704'), 'Must record AD-704 decision ID');
  assert.ok(doc.includes('Option A: Off-the-Shelf Quotation Plugins'), 'Must evaluate third-party plugins');
  assert.ok(doc.includes('Option B: Custom Companion Plugin'), 'Must specify custom companion option');
  assert.ok(doc.includes('High-Performance Order Storage'), 'Must evaluate HPOS compatibility');
});
