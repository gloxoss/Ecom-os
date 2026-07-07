const url = process.env.WC_REST_URL || 'http://cms-ecom-os.local/wp-json/wc/v3';
const key = process.env.WC_REST_KEY || 'mock_key';
const secret = process.env.WC_REST_SECRET || 'mock_secret';

export async function restFetch(path: string, options: RequestInit = {}) {
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`REST Error: ${res.statusText}`);
  return res.json();
}
