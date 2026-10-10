import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateProvisioning } from './provision';

describe('Client Provisioning Validator Contract (ECO-903)', () => {
  it('validates a compliant client provisioning configuration', () => {
    const validConfig = {
      clientId: 'paraloca',
      databaseUrl: 'mysql://ecom_user:secret@localhost:3306/ecom_paraloca',
      storefrontUrl: 'https://paraloca.ma',
      encryptionKey: Buffer.from('k'.repeat(32)).toString('base64'),
      sessionSecret: 'super-secure-session-secret-key-at-least-32-chars!',
      allowedPaymentMethods: ['cod'],
    };

    const result = validateProvisioning(validConfig);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('fails closed when mandatory secrets or valid database strings are missing', () => {
    const invalidConfig = {
      clientId: 'invalid_id_with_underscores',
      databaseUrl: 'postgres://invalid',
      storefrontUrl: 'http://insecure.test',
      encryptionKey: 'short-key',
      sessionSecret: 'too-short',
      allowedPaymentMethods: ['stripe'],
    };

    const result = validateProvisioning(invalidConfig);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('clientId')));
    assert.ok(result.errors.some(e => e.includes('Database URL')));
    assert.ok(result.errors.some(e => e.includes('Storefront URL')));
    assert.ok(result.errors.some(e => e.includes('Encryption key')));
    assert.ok(result.errors.some(e => e.includes('Session secret')));
    assert.ok(result.errors.some(e => e.includes('Allowed payment methods')));
  });
});
