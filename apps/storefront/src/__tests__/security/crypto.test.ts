import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.ECOM_OS_ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
});

const { encrypt, decrypt, timingSafeEquals } = await import('../../lib/crypto');

describe('crypto', () => {
  it('round-trips plaintext', () => {
    const plain = 'gateway_config_json';
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('throws on tampered ciphertext', () => {
    const ct = encrypt('secret');
    const tampered = Buffer.from(ct, 'base64');
    tampered[30] ^= 0xff;
    expect(() => decrypt(tampered.toString('base64'))).toThrow();
  });

  it('timingSafeEquals works', () => {
    expect(timingSafeEquals('abc', 'abc')).toBe(true);
    expect(timingSafeEquals('abc', 'xyz')).toBe(false);
    expect(timingSafeEquals('abc', 'ab')).toBe(false);
  });
});
