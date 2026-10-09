import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import path from 'node:path';

// Creates one synthetic COD order only on the approved local fixture installation.
let stage = 'configuration';
async function main() {
  loadEnvFile(path.join(__dirname, '../apps/storefront/.env.local'));
  const base = 'https://paraloca.local';
  assert.equal(process.env.WC_REST_URL, `${base}/wp-json/wc/v3`);
  assert.equal(process.env.WC_GRAPHQL_URL, `${base}/graphql`);
  const simpleId = Number(process.argv[2]);
  const variationId = Number(process.argv[3]);
  const state = process.argv[4];
  assert(Number.isSafeInteger(simpleId) && simpleId > 0 && Number.isSafeInteger(variationId) && variationId > 0 && state);
  stage = 'adapter catalog';
  const { WooCommerceEngine } = await import('../packages/engine-woocommerce/src/client');
  const engine = new WooCommerceEngine();
  const product = await engine.getProduct('ecomos-test-simple');
  assert.deepEqual(product?.price, { amount_minor: 3995, currency: 'MAD' });
  assert.equal(product?.id, String(simpleId));
  const categories = await engine.listCategories();
  assert(categories.some(category => category.slug === 'ecomos-test-fixtures'));

  stage = 'read-only connector permissions';
  const authorization = 'Basic ' + Buffer.from(`${process.env.WC_REST_KEY}:${process.env.WC_REST_SECRET}`).toString('base64');
  const ordersRead = await fetch(`${base}/wp-json/wc/v3/orders?per_page=1`, { headers: { Authorization: authorization } });
  assert.equal(ordersRead.status, 403, 'Connector must not read customer orders.');
  const settingsWrite = await fetch(`${base}/wp-json/wc/v3/settings/general/woocommerce_currency`, {
    method: 'PUT', headers: { Authorization: authorization, 'Content-Type': 'application/json' }, body: JSON.stringify({ value: 'MAD' }),
  });
  assert([401, 403].includes(settingsWrite.status), 'Connector must not write settings.');

  async function request(endpoint: string, token?: string, body?: object) {
    const response = await fetch(`${base}/wp-json/wc/store/v1${endpoint}`, {
      signal: AbortSignal.timeout(30000),
      headers: { ...(token ? { 'Cart-Token': token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    return { status: response.status, data, token: response.headers.get('Cart-Token') ?? token };
  }
  stage = 'guest cart sessions and invalid requests';
  const a = await request('/cart');
  const b = await request('/cart');
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert(a.token && b.token && a.token !== b.token);
  assert.equal((await request('/cart/add-item', undefined, { id: simpleId, quantity: 1 })).status, 401);
  assert([401, 403].includes((await request('/cart/add-item', 'invalid-token', { id: simpleId, quantity: 1 })).status));
  assert.equal((await request('/cart/add-item', a.token, { id: simpleId, quantity: 999 })).status, 400);
  stage = 'simple and exact variation cart lines';
  const added = await request('/cart/add-item', a.token, { id: simpleId, quantity: 2, price: '0.01' });
  assert([200, 201].includes(added.status));
  assert.equal(added.data.items[0].prices.price, '3995');
  const varied = await request('/cart/add-item', a.token, { id: variationId, quantity: 1 });
  assert([200, 201].includes(varied.status));
  assert(varied.data.items.some((item: { id: number; sku: string }) => item.id === variationId && item.sku === 'ECOMOS-TEST-VARIATION-STANDARD'));
  const isolated = await request('/cart', b.token);
  assert.equal(isolated.data.items.length, 0);
  const runId = `ECOMOS-SMOKE-${randomUUID()}`;
  const shipping = {
    first_name: 'EcomOS', last_name: 'Fixture', company: '', address_1: 'Synthetic test address',
    address_2: '', city: 'Agadir', state, postcode: '80000', country: 'MA', phone: '+212600000000',
  };
  const billing = { ...shipping, email: `${runId.toLowerCase()}@example.test` };
  stage = 'destination shipping and authoritative totals';
  const destination = await request('/cart/update-customer', a.token, { shipping_address: shipping, billing_address: billing });
  assert.equal(destination.status, 200);
  const rate = destination.data.shipping_rates[0]?.shipping_rates.find((item: { price: string }) => item.price === '2500');
  assert(rate, 'Fixture destination must have the configured paid delivery rate.');
  const selected = await request('/cart/select-shipping-rate', a.token, { package_id: 0, rate_id: rate.rate_id });
  assert.equal(selected.status, 200);
  assert.equal(selected.data.totals.currency_code, 'MAD');
  assert.equal(selected.data.totals.total_items, '15940');
  assert.equal(selected.data.totals.total_shipping, '2500');
  assert.equal(selected.data.totals.total_tax, '1844');
  assert.equal(selected.data.totals.total_price, '20284');
  const checkoutBody = {
    shipping_address: shipping, billing_address: billing, payment_method: 'cod',
    payment_data: [], customer_note: runId, create_account: false,
  };
  stage = 'guest COD checkout';
  const checkout = await request('/checkout', a.token, checkoutBody);
  assert([200, 201].includes(checkout.status), 'Local COD checkout must complete.');
  assert(Number.isSafeInteger(checkout.data.order_id) && checkout.data.order_id > 0);
  assert.equal(checkout.data.status, 'processing');
  stage = 'sequential retry';
  const retry = await request('/checkout', a.token, checkoutBody);
  assert([400, 409].includes(retry.status) || ([200, 201].includes(retry.status) && retry.data.order_id === checkout.data.order_id), 'Sequential retry must not create another order.');
  console.log(JSON.stringify({
    origin: base, runId, orderId: checkout.data.order_id, status: checkout.data.status,
    currency: 'MAD', subtotalMinor: 15940, shippingMinor: 2500, taxMinor: 1844, totalMinor: 20284,
    paymentMethod: 'cod', adapterCatalog: 'PASS', readOnlyConnector: 'PASS', exactVariation: 'PASS',
    cartIsolation: 'PASS', invalidTokenRejected: 'PASS', stockLimitRejected: 'PASS',
    clientPriceIgnored: 'PASS', sequentialRetryStatus: retry.status,
  }, null, 2));
}

main().catch(error => {
  // Assertions identify the failed stage without dumping HTTP bodies or session tokens.
  console.error(error instanceof assert.AssertionError ? `Smoke assertion failed at ${stage}: ${error.message}` : `Local commerce smoke failed at ${stage}. Check local configuration and endpoints.`);
  process.exitCode = 1;
});
