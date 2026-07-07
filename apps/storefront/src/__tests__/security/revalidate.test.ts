import { describe, it, expect, beforeAll, vi } from 'vitest';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

beforeAll(() => {
  process.env.REVALIDATE_SECRET = 'test-secret-32-bytes-long-exactly!';
  process.env.ECOM_OS_ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
});

// ponytail: unit-test the handler function directly, not via HTTP
describe('revalidate endpoint', () => {
  it('rejects wrong secret', async () => {
    const { POST } = await import('../../app/api/revalidate/route');
    const req = {
      nextUrl: new URL('http://localhost/api/revalidate?secret=wrong'),
      headers: new Headers()
    };
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('accepts correct secret and returns 200', async () => {
    const { POST } = await import('../../app/api/revalidate/route');
    const req = {
      nextUrl: new URL('http://localhost/api/revalidate?secret=test-secret-32-bytes-long-exactly!'),
      headers: new Headers()
    };
    const res = await POST(req as any);
    expect(res.status).toBe(200);
  });

  it('rate limits after 60 requests', async () => {
    const { POST } = await import('../../app/api/revalidate/route');
    const req = {
      nextUrl: new URL('http://localhost/api/revalidate?secret=test-secret-32-bytes-long-exactly!'),
      headers: new Headers()
    };
    // Make 60 requests to exhaust limit
    for(let i=0; i<60; i++) {
      await POST(req as any);
    }
    // 61st should be rate limited
    const res = await POST(req as any);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });
});
