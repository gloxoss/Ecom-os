// Public API checks only. Never log cart tokens, cookies, credentials, or customer records.
async function main() {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: pnpm exec tsx scripts/probe-woocommerce.ts <site-origin>');
  const origin = new URL(input);
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') {
    throw new Error('Provide only the site origin, without credentials or query parameters.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) || origin.hostname.endsWith('.local');
  if (origin.protocol !== 'https:' && !(local && origin.protocol === 'http:')) {
    throw new Error('HTTPS is required except for local development sites.');
  }
  async function request(path: string, query?: string) {
    try {
      const response = await fetch(new URL(path, origin), {
        signal: AbortSignal.timeout(15000),
        ...(query ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) } : {}),
      });
      if (new URL(response.url).origin !== origin.origin) throw new Error('Unexpected redirect origin.');
      const data = await response.json().catch(() => null);
      return { status: response.status, data, hasCartToken: response.headers.has('cart-token') };
    } catch {
      return { status: 0, data: null, hasCartToken: false };
    }
  }
  const [wp, products, cart, graphql] = await Promise.all([
    request('/wp-json/'),
    request('/wp-json/wc/store/v1/products?per_page=2'),
    request('/wp-json/wc/store/v1/cart'),
    request('/graphql', '{ products(first: 2) { nodes { databaseId ... on SimpleProduct { price(format: RAW) } } } }'),
  ]);
  const report = {
    origin: origin.origin,
    wordpress: { status: wp.status, namespaces: Array.isArray(wp.data?.namespaces) ? wp.data.namespaces : [] },
    products: { status: products.status, sampleCount: Array.isArray(products.data) ? products.data.length : 0 },
    guestCart: { status: cart.status, hasCartToken: cart.hasCartToken, currency: cart.data?.totals?.currency_code ?? null },
    graphql: { status: graphql.status, commerceSchemaValid: Boolean(graphql.data?.data?.products && !graphql.data?.errors) },
  };
  console.log(JSON.stringify(report, null, 2));
  if (wp.status !== 200 || products.status !== 200 || cart.status !== 200 || !report.graphql.commerceSchemaValid) {
    process.exitCode = 1;
  }
}

main().catch(() => {
  console.error('Preflight failed. Supply a valid site origin; no credentials are required.');
  process.exitCode = 1;
});
