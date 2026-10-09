import { describe, expect, it } from 'vitest';
import { validateRuntimeConfig } from '../../lib/runtime-config';

const valid = {
  NODE_ENV: 'production' as const, ECOM_ENGINE: 'woocommerce',
  WC_REST_URL: 'https://commerce.example.test/wp-json/wc/v3', WC_GRAPHQL_URL: 'https://commerce.example.test/graphql',
  WC_REST_KEY: 'test', WC_REST_SECRET: 'test',
  REVALIDATE_SECRET: 'r'.repeat(32), SESSION_COOKIE_SECRET: 's'.repeat(32),
  ECOM_OS_ENCRYPTION_KEY: Buffer.from('k'.repeat(32)).toString('base64'),
};

describe('production configuration', () => {
  it('accepts explicit HTTPS WooCommerce configuration', () => expect(() => validateRuntimeConfig(valid)).not.toThrow());
  it.each(['', 'fake', 'vendure'])('rejects production engine %s', ECOM_ENGINE => {
    expect(() => validateRuntimeConfig({ ...valid, ECOM_ENGINE })).toThrow('woocommerce');
  });
  it.each(['WC_REST_URL', 'WC_GRAPHQL_URL', 'WC_REST_KEY', 'WC_REST_SECRET', 'REVALIDATE_SECRET', 'SESSION_COOKIE_SECRET', 'ECOM_OS_ENCRYPTION_KEY'])('rejects missing %s', name => {
    expect(() => validateRuntimeConfig({ ...valid, [name]: '' })).toThrow(name);
  });
  it('rejects HTTP and credentials in URLs', () => {
    expect(() => validateRuntimeConfig({ ...valid, WC_REST_URL: 'http://localhost/wp-json/wc/v3' })).toThrow('HTTPS');
    expect(() => validateRuntimeConfig({ ...valid, WC_GRAPHQL_URL: 'https://user:secret@example.test/graphql' })).toThrow('credentials');
  });
});
