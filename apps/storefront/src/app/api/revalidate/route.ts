import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { timingSafeEquals } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') ?? '';

  if (!timingSafeEquals(secret, process.env.REVALIDATE_SECRET ?? '')) {
    logger.warn('revalidate_rejected', { reason: 'invalid_secret' });
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // ponytail: rate limit keyed on secret, not IP — prevents secret enumeration
  const { ok, retryAfter } = checkRateLimit(`revalidate:${secret}`, 60, 60_000);
  if (!ok) {
    return NextResponse.json({ error: 'rate_limited' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  const tag = req.nextUrl.searchParams.get('tag') ?? 'wc-products';
  revalidateTag(tag, 'max');
  logger.info('revalidate_triggered', { tag });
  return NextResponse.json({ revalidated: true, tag });
}
