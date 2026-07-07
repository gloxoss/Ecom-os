import { describe, it, expect } from 'vitest';
import { computeCmiHash, verifyCmiHash } from '../providers/cmi/hash';

const STORE_KEY = 'test-key-1234567890';

describe('CMI hash', () => {
  it('produces a deterministic hash for given params', () => {
    const params = { oid: 'order-1', amount: '99.99', clientid: 'MERCHANT1' };
    const hash1 = computeCmiHash(params, STORE_KEY);
    const hash2 = computeCmiHash(params, STORE_KEY);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[A-F0-9]{128}$/); // SHA-512 hex uppercase
  });

  it('excludes HASH field from computation', () => {
    const params = { oid: 'order-1', amount: '99.99', HASH: 'should-be-excluded' };
    const hash = computeCmiHash(params, STORE_KEY);
    expect(hash).toBe(computeCmiHash({ oid: 'order-1', amount: '99.99' }, STORE_KEY));
  });

  it('verifyHash passes for correct key', () => {
    const params = { oid: 'order-1', amount: '99.99' };
    const hash = computeCmiHash(params, STORE_KEY);
    expect(verifyCmiHash({ ...params, HASH: hash }, STORE_KEY)).toBe(true);
  });

  it('verifyHash fails for tampered amount', () => {
    const params = { oid: 'order-1', amount: '99.99' };
    const hash = computeCmiHash(params, STORE_KEY);
    expect(verifyCmiHash({ oid: 'order-1', amount: '1.00', HASH: hash }, STORE_KEY)).toBe(false);
  });

  it('verifyHash fails for wrong key', () => {
    const params = { oid: 'order-1', amount: '99.99' };
    const hash = computeCmiHash(params, STORE_KEY);
    expect(verifyCmiHash({ ...params, HASH: hash }, 'wrong-key')).toBe(false);
  });

  it('verifyHash fails for missing HASH field', () => {
    expect(verifyCmiHash({ oid: 'order-1', amount: '99.99' }, STORE_KEY)).toBe(false);
  });
});
