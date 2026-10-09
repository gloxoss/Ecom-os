import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const boundary = vi.hoisted(() => ({
  cookies: vi.fn(),
  getEngine: vi.fn(),
  redirect: vi.fn(),
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: boundary.cookies }));
vi.mock('next/navigation', () => ({ redirect: boundary.redirect }));
vi.mock('@/lib/engine', () => ({ getEngine: boundary.getEngine }));

import { getSessionToken, login, register, requestPasswordResetAction, resetPasswordAction, logout } from './auth-actions';
import { createAddress, updateAddress, deleteAddress } from './address-actions';
import { updateProfile } from './profile-actions';
import { setAuthToken, getAuthToken, clearAuthToken } from '@/features/auth/server/auth-actions';

const forgedToken = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from('{"data":{"user":{"id":42}}}').toString('base64url')}.`;

beforeEach(() => {
  vi.stubEnv('CUSTOMER_ACCOUNTS_ENABLED', 'true');
  vi.stubEnv('ADDONS', 'customer-accounts');
  boundary.cookieGet.mockReturnValue({ value: forgedToken });
  boundary.cookies.mockResolvedValue({
    get: boundary.cookieGet,
    set: boundary.cookieSet,
    delete: boundary.cookieDelete,
  });
  boundary.redirect.mockImplementation(() => { throw new Error('synthetic redirect'); });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function attackerInput() {
  const form = new FormData();
  form.set('customerId', '42');
  form.set('addressId', 'billing');
  form.set('token', forgedToken);
  form.set('email', 'synthetic@example.test');
  form.set('password', 'synthetic-password');
  return form;
}

describe('direct disabled-account server action boundaries', () => {
  const attempts = [
    { name: 'session token read', run: () => getSessionToken() },
    { name: 'login', run: () => login(attackerInput()) },
    { name: 'registration', run: () => register(attackerInput()) },
    { name: 'reset request', run: () => requestPasswordResetAction(attackerInput()) },
    { name: 'password reset', run: () => resetPasswordAction(attackerInput()) },
    { name: 'address creation', run: () => createAddress(attackerInput()) },
    { name: 'address update', run: () => updateAddress(attackerInput()) },
    { name: 'address deletion', run: () => deleteAddress(attackerInput()) },
    { name: 'profile update', run: () => updateProfile(attackerInput()) },
    { name: 'legacy auth cookie setter', run: () => setAuthToken(forgedToken) },
    { name: 'legacy auth cookie reader', run: () => getAuthToken() },
  ];

  it.each(attempts)('rejects $name before cookies, engine access, network or success redirect', async ({ run }) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(run()).rejects.toThrow('Customer accounts are unavailable');
    expect(boundary.cookies).not.toHaveBeenCalled();
    expect(boundary.getEngine).not.toHaveBeenCalled();
    expect(boundary.redirect).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('permits clearing a stale auth cookie without resolving an identity', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await clearAuthToken();
    expect(boundary.cookieDelete).toHaveBeenCalledExactlyOnceWith('ecom_auth');
    expect(boundary.cookieGet).not.toHaveBeenCalled();
    expect(boundary.cookieSet).not.toHaveBeenCalled();
    expect(boundary.getEngine).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('logout clears only the stale auth cookie then redirects home without an identity lookup', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(logout()).rejects.toThrow('synthetic redirect');
    expect(boundary.cookieDelete).toHaveBeenCalledExactlyOnceWith('ecom_auth');
    expect(boundary.redirect).toHaveBeenCalledExactlyOnceWith('/');
    expect(boundary.cookieGet).not.toHaveBeenCalled();
    expect(boundary.cookieSet).not.toHaveBeenCalled();
    expect(boundary.getEngine).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
