import { createHmac, timingSafeEqual } from 'crypto';

export function computeCmiHash(params: Record<string, string>, storeKey: string): string {
  // CMI hash: sort params alphabetically, exclude HASH field, join as KEY=VALUE|, HMAC-SHA512
  const sorted = Object.keys(params)
    .filter(k => k !== 'HASH' && k !== 'encoding')
    .sort()
    .map(k => `${params[k]}`)
    .join('|');
  return createHmac('sha512', storeKey).update(sorted).digest('hex').toUpperCase();
}

export function verifyCmiHash(params: Record<string, string>, storeKey: string): boolean {
  const received = params['HASH'];
  if (!received) return false;
  const expected = computeCmiHash(params, storeKey);
  // Constant-time comparison to prevent timing attacks
  return safeEqual(received, expected);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
