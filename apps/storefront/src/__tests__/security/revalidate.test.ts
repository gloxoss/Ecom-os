import { describe, it, expect, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { POST } from '../../app/api/revalidate/route';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('revalidate endpoint', () => {
  it.each(['', 'short'])('rejects unset or short configured secret %s', async secret => {
    vi.stubEnv('REVALIDATE_SECRET', secret);
    const res = await POST(new NextRequest('http://localhost/api/revalidate'));
    expect(res.status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
  it('rejects wrong secret', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'r'.repeat(32));
    const res = await POST(new NextRequest('http://localhost/api/revalidate?secret=wrong'));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
  it('accepts a valid secret and revalidates the requested tag', async () => {
    const secret = 's'.repeat(32);
    vi.stubEnv('REVALIDATE_SECRET', secret);
    const res = await POST(new NextRequest('http://localhost/api/revalidate?secret=' + secret + '&tag=wc-products'));
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith('wc-products', 'max');
  });
  it('rate limits after 60 requests', async () => {
    const secret = 't'.repeat(32);
    vi.stubEnv('REVALIDATE_SECRET', secret);
    const req = new NextRequest('http://localhost/api/revalidate?secret=' + secret);
    for (let i = 0; i < 60; i++) await POST(req);
    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });
});
