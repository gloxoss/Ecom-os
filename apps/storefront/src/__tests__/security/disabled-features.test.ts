import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as stripe } from '../../app/api/webhooks/stripe/route';
import { POST as cmi } from '../../app/api/webhooks/cmi/route';
import { login, register, getSessionToken, resetPasswordAction } from '../../features/account/server/auth-actions';
import { setAuthToken } from '../../features/auth/server/auth-actions';

afterEach(() => vi.restoreAllMocks());

describe('disabled routes and actions', () => {
  it.each([stripe, cmi])('rejects direct callback requests before network or order operations', async handler => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await handler(new Request('https://store.example.test/api/webhooks/test', { method: 'POST', body: 'oid=42&Response=Approved' }));
    expect(response.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('rejects direct account actions before cookies or backend requests', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    for (const action of [login, register, resetPasswordAction]) {
      await expect(action(new FormData())).rejects.toThrow('unavailable');
    }
    await expect(getSessionToken()).rejects.toThrow('unavailable');
    await expect(setAuthToken('forged')).rejects.toThrow('unavailable');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
