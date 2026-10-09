export function validateRuntimeConfig(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;
  if (env.ECOM_ENGINE !== 'woocommerce') {
    throw new Error('Production requires ECOM_ENGINE=woocommerce.');
  }
  for (const name of ['WC_REST_URL', 'WC_GRAPHQL_URL']) {
    const value = env[name];
    if (!value) throw new Error(`${name} is required in production.`);
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error(`${name} must use HTTPS without embedded credentials.`);
    }
  }
  for (const name of ['WC_REST_KEY', 'WC_REST_SECRET']) {
    if (!env[name]?.trim()) throw new Error(`${name} is required in production.`);
  }
  for (const name of ['REVALIDATE_SECRET', 'SESSION_COOKIE_SECRET']) {
    if ((env[name]?.trim().length ?? 0) < 32) throw new Error(`${name} must contain at least 32 characters.`);
  }
  const encryptionKey = env.ECOM_OS_ENCRYPTION_KEY;
  if (!encryptionKey || !/^[A-Za-z0-9+/]{43}=$/.test(encryptionKey) || Buffer.from(encryptionKey, 'base64').length !== 32) {
    throw new Error('ECOM_OS_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  }
}
