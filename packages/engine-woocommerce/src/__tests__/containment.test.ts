import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCustomerByToken, registerRest, listAddressesRest, updateAddressRest, getCustomerOrdersRest } from '../auth';
import { createOrderRest } from '../orders';
import { WooCommerceEngine } from '../client';

afterEach(() => vi.restoreAllMocks());

describe('disabled unsafe customer and commerce paths', () => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const claims = { data: { user: { id: 42 } } };
  const tokens = [
    `${encode({ alg: 'HS256' })}.${encode(claims)}.forged`,
    `${encode({ alg: 'HS256' })}.${encode({ ...claims, exp: 1 })}.expired`,
    `${encode({ alg: 'none' })}.${encode(claims)}.`,
    `${encode({ alg: 'HS256' })}.${encode({ ...claims, iss: 'wrong-issuer' })}.signature`,
  ];

  it.each(tokens)('does not resolve identity from untrusted token %s', async token => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await getCustomerByToken(token)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('blocks direct account helpers before privileged requests', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(registerRest({ email: 'synthetic@example.test', password: 'test', firstName: 'Test', lastName: 'Buyer' })).rejects.toThrow('unavailable');
    await expect(listAddressesRest('42')).rejects.toThrow('unavailable');
    await expect(updateAddressRest('42', 'billing', {})).rejects.toThrow('unavailable');
    await expect(getCustomerOrdersRest('42')).rejects.toThrow('unavailable');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('cannot create legacy zero-shipping orders or change payment status', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const input = { email: 'synthetic@example.test', firstName: 'Test', lastName: 'Buyer', address: 'Test', paymentMethod: 'cod' };
    await expect(createOrderRest(input, [])).rejects.toThrow('disabled');
    const engine = new WooCommerceEngine();
    await expect(engine.initCheckout('cart', input)).rejects.toThrow('unavailable');
    await expect(engine.markOrderPaid('42', { provider: 'stripe', transactionId: 'test', status: 'paid' })).rejects.toThrow('unavailable');
    expect(await engine.getOrder('42', '0')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
