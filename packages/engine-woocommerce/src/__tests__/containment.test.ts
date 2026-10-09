import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCustomerByToken, loginGql, registerRest, listAddressesRest,
  createAddressRest, updateAddressRest, deleteAddressRest,
  getCustomerOrdersRest, requestPasswordResetGql, resetPasswordGql,
} from '../auth';
import { createOrderRest, getOrderRest } from '../orders';
import { WooCommerceEngine } from '../client';

beforeEach(() => {
  // Old deployment flags cannot restore an unauthenticated privileged path.
  vi.stubEnv('CUSTOMER_ACCOUNTS_ENABLED', 'true');
  vi.stubEnv('ADDONS', 'customer-accounts');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('disabled unsafe customer and commerce paths', () => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const claims = { data: { user: { id: 42 } } };
  const tokens = [
    { name: 'forged', token: `${encode({ alg: 'HS256' })}.${encode(claims)}.forged` },
    { name: 'expired', token: `${encode({ alg: 'HS256' })}.${encode({ ...claims, exp: 1 })}.expired` },
    { name: 'unsigned', token: `${encode({ alg: 'none' })}.${encode(claims)}.` },
    { name: 'wrong issuer', token: `${encode({ alg: 'HS256' })}.${encode({ ...claims, iss: 'wrong-issuer' })}.signature` },
    { name: 'malformed', token: 'not-a-jwt' },
    { name: 'empty', token: '' },
  ];

  it.each(tokens)('does not resolve $name identity through either public adapter entry', async ({ token }) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await getCustomerByToken(token)).toBeNull();
    expect(await new WooCommerceEngine().getCustomer(token)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  const engine = new WooCommerceEngine();
  const accountInput = { email: 'synthetic@example.test', password: 'test', firstName: 'Test', lastName: 'Buyer' };
  const address = { firstName: 'Test', lastName: 'Buyer', street: 'Synthetic', city: 'Fixture', postalCode: '00000', country: 'MA' };
  const accountCommands = [
    { name: 'helper login', run: () => loginGql(accountInput) },
    { name: 'helper registration', run: () => registerRest(accountInput) },
    { name: 'helper order enumeration', run: () => getCustomerOrdersRest('42') },
    { name: 'helper address listing', run: () => listAddressesRest('42') },
    { name: 'helper address creation', run: () => createAddressRest('42', address) },
    { name: 'helper address update', run: () => updateAddressRest('42', 'billing', address) },
    { name: 'helper address deletion', run: () => deleteAddressRest('42', 'billing') },
    { name: 'helper reset request', run: () => requestPasswordResetGql(accountInput.email) },
    { name: 'helper password reset', run: () => resetPasswordGql(tokens[0]!.token, 'synthetic-replacement') },
    { name: 'engine login', run: () => engine.login(accountInput) },
    { name: 'engine registration', run: () => engine.registerCustomer(accountInput) },
    { name: 'engine order enumeration', run: () => engine.listCustomerOrders('42', { limit: 100 }) },
    { name: 'engine address listing', run: () => engine.listAddresses('42') },
    { name: 'engine address creation', run: () => engine.createAddress('42', address) },
    { name: 'engine address update', run: () => engine.updateAddress('42', 'billing', address) },
    { name: 'engine address deletion', run: () => engine.deleteAddress('42', 'billing') },
    { name: 'engine reset request', run: () => engine.requestPasswordReset(accountInput.email) },
    { name: 'engine password reset', run: () => engine.resetPassword(tokens[0]!.token, 'synthetic-replacement') },
    { name: 'engine loyalty read', run: () => engine.getLoyaltyBalance('42') },
    { name: 'engine loyalty redemption', run: () => engine.redeemLoyaltyPoints('42', 100) },
  ];

  it.each(accountCommands)('blocks $name before privileged requests despite legacy enablement flags', async ({ run }) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(run()).rejects.toThrow('Customer accounts are unavailable');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not expose orders selected by attacker-supplied order and customer IDs', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    for (const customerId of ['0', '42', 'another-customer']) {
      expect(await getOrderRest('42', customerId)).toBeNull();
      expect(await engine.getOrder('42', customerId)).toBeNull();
    }
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
