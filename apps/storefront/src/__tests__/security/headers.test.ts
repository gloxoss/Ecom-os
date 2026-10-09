import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('next-intl/middleware', () => ({
  default: () => () => {
    const response = NextResponse.next();
    response.headers.set('x-middleware-override-headers', 'x-next-intl-locale');
    response.headers.set('x-middleware-request-x-next-intl-locale', 'fr');
    return response;
  },
}));
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('security proxy', () => {
  it('forwards the same nonce to rendering and response CSP, preserving locale headers', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { proxy } = await import('../../proxy');
    const first = proxy(new NextRequest('https://store.example.test/checkout'));
    const second = proxy(new NextRequest('https://store.example.test/checkout'));
    const csp = first.headers.get('content-security-policy');
    const nonce = first.headers.get('x-middleware-request-x-nonce');
    expect(nonce).toBeTruthy();
    expect(csp).toContain("'nonce-" + nonce + "'");
    expect(first.headers.get('x-middleware-request-content-security-policy')).toBe(csp);
    expect(first.headers.get('x-middleware-override-headers')).toContain('content-security-policy');
    expect(first.headers.get('x-middleware-request-x-next-intl-locale')).toBe('fr');
    expect(second.headers.get('x-middleware-request-x-nonce')).not.toBe(nonce);
    expect(first.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it.each(['/account', '/en/account/login', '/fr/account/orders', '/ar/account/password-reset'])('rejects account route %s even with a cookie', async path => {
    const { proxy } = await import('../../proxy');
    const response = proxy(new NextRequest('https://store.example.test' + path, { headers: { cookie: 'ecom_auth=forged' } }));
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
