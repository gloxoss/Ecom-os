import { strict as assert } from 'node:assert';
import { NextRequest } from '../apps/storefront/node_modules/next/server.js';

console.log('[RUNTIME-VERIFY] Starting production runtime security checks...');

// Test 1: Proxy production security headers and nonce forwarding
{
  process.env.NODE_ENV = 'production';
  const { proxy, config } = await import('../apps/storefront/src/proxy.ts');

  // Verify matcher rejects static assets but accepts pages/html
  const matcherPattern = new RegExp(config.matcher[0]);
  assert.equal(matcherPattern.test('/test.css'), false, 'Matcher should exclude .css files');
  assert.equal(matcherPattern.test('/test.js'), false, 'Matcher should exclude .js files');
  assert.equal(matcherPattern.test('/image.png'), false, 'Matcher should exclude .png files');
  assert.equal(matcherPattern.test('/account.html'), true, 'Matcher must include dotted HTML paths');
  assert.equal(matcherPattern.test('/catalog'), true, 'Matcher must include page routes');

  // Verify proxy headers on storefront requests
  const req1 = new NextRequest('https://store.example.test/fr/catalog');
  const res1 = proxy(req1);

  const csp1 = res1.headers.get('content-security-policy');
  assert(csp1, 'CSP header must be present in production');
  assert(csp1.includes('strict-dynamic'), 'CSP must include strict-dynamic');
  assert(csp1.includes('frame-ancestors \'none\''), 'CSP must prevent framing');
  assert.equal(res1.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res1.headers.get('x-frame-options'), 'DENY');
  assert.equal(res1.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert(res1.headers.get('strict-transport-security')?.includes('max-age=15552000'));

  const nonce1 = res1.headers.get('x-middleware-request-x-nonce');
  assert(nonce1, 'Request nonce must be forwarded');
  assert(csp1.includes(`'nonce-${nonce1}'`), 'Response CSP must match request nonce');

  // Verify nonce isolation across requests
  const req2 = new NextRequest('https://store.example.test/fr/catalog');
  const res2 = proxy(req2);
  const nonce2 = res2.headers.get('x-middleware-request-x-nonce');
  assert.notEqual(nonce1, nonce2, 'Nonces must be isolated per request');

  // Verify account route containment (including dotted paths)
  for (const path of ['/account', '/fr/account', '/account.html', '/en/account.html', '/account.json']) {
    const accReq = new NextRequest(`https://store.example.test${path}`);
    const accRes = proxy(accReq);
    assert.equal(accRes.status, 404, `Account route ${path} must return 404`);
    assert.equal(accRes.headers.get('cache-control'), 'no-store', `Account route ${path} must set no-store`);
  }

  console.log('  ✔ Proxy CSP headers, nonces, and account containment verified');
}

// Test 2: Revalidate route private cache-control headers
{
  process.env.ECOM_OS_ENCRYPTION_KEY = Buffer.from('k'.repeat(32)).toString('base64');
  const { POST } = await import('../apps/storefront/src/app/api/revalidate/route.ts');
  const secret = 's'.repeat(32);

  // Missing / short secret
  process.env.REVALIDATE_SECRET = 'short';
  const resShort = await POST(new NextRequest('http://localhost/api/revalidate'));
  assert.equal(resShort.status, 503);
  assert.equal(resShort.headers.get('cache-control'), 'no-store, private');

  // Invalid secret
  process.env.REVALIDATE_SECRET = secret;
  const resWrong = await POST(new NextRequest('http://localhost/api/revalidate?secret=invalid'));
  assert.equal(resWrong.status, 401);
  assert.equal(resWrong.headers.get('cache-control'), 'no-store, private');

  // Valid secret (revalidateTag requires Next.js server context outside tests)
  try {
    const resOk = await POST(new NextRequest(`http://localhost/api/revalidate?secret=${secret}&tag=wc-products`));
    assert.equal(resOk.status, 200);
    assert.equal(resOk.headers.get('cache-control'), 'no-store, private');
  } catch (err) {
    assert(err.message.includes('static generation store missing') || err.message.includes('revalidateTag'));
  }

  console.log('  ✔ Revalidate route private cache-control headers verified');
}

// Test 3: Production runtime configuration fail-closed validation
{
  const { validateRuntimeConfig } = await import('../apps/storefront/src/lib/runtime-config.ts');

  // Missing required production configuration must fail closed
  assert.throws(() => {
    validateRuntimeConfig({
      NODE_ENV: 'production',
      ECOM_ENGINE: 'fake',
    });
  }, /woocommerce/, 'FakeEngine must fail closed in production');

  assert.throws(() => {
    validateRuntimeConfig({
      NODE_ENV: 'production',
      ECOM_ENGINE: 'woocommerce',
      WC_REST_URL: 'http://insecure.test/wp-json/wc/v3',
    });
  }, /HTTPS/, 'HTTP URLs must fail closed in production');

  console.log('  ✔ Production runtime fail-closed configuration verified');
}

console.log('[RUNTIME-VERIFY] All production runtime security checks PASS (exit 0).');
