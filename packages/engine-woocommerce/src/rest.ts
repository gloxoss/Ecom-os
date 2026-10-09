export async function restFetch(path: string, options: RequestInit = {}) {
  const url = process.env.WC_REST_URL;
  const key = process.env.WC_REST_KEY;
  const secret = process.env.WC_REST_SECRET;
  if (!url || !key?.trim() || !secret?.trim()) throw new Error('WooCommerce REST configuration is required.');
  const endpoint = new URL(url);
  if (endpoint.username || endpoint.password || !['http:', 'https:'].includes(endpoint.protocol)) {
    throw new Error('Invalid WooCommerce REST URL.');
  }
  if (process.env.NODE_ENV === 'production' && endpoint.protocol !== 'https:') {
    throw new Error('WooCommerce REST requires HTTPS in production.');
  }
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid WooCommerce REST path.');
  const headers = new Headers(options.headers);
  headers.set('Authorization', 'Basic ' + Buffer.from(key + ':' + secret).toString('base64'));
  headers.set('Content-Type', 'application/json');
  const res = await fetch(url.replace(/\/$/, '') + path, {
    ...options,
    headers,
    cache: 'no-store',
    redirect: 'error',
  });
  if (!res.ok) throw new Error('WooCommerce REST request failed with HTTP ' + res.status);
  return res.json();
}
