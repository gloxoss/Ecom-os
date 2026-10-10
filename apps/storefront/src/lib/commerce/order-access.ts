import { createHmac, timingSafeEqual } from 'crypto';

export interface GuestOrderGrantPayload {
  orderId: string;
  orderKey: string;
  email: string;
  exp: number; // Unix timestamp ms
}

export interface VerifyOrderGrantResult {
  valid: boolean;
  grant?: GuestOrderGrantPayload;
  error?: 'invalid_token' | 'expired_token' | 'tampered_token';
}

export function getOrderAccessSecret(): string {
  const secret = process.env.ORDER_ACCESS_SECRET || process.env.ECOM_OS_ENCRYPTION_KEY;
  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === 'test') {
      return 'test-order-access-secret-only-for-automated-tests';
    }
    throw new Error('ORDER_ACCESS_SECRET is required to generate or verify guest order tokens.');
  }
  return secret;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  return Buffer.from(b64, 'base64').toString('utf8');
}

function computeSignature(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
}

/**
 * Creates an opaque HMAC-signed expiring grant token for guest order access.
 * Default TTL is 7 days (604,800,000 ms).
 */
export function createGuestOrderGrant(params: {
  orderId: string | number;
  orderKey: string;
  email: string;
  ttlMs?: number;
}): string {
  const secret = getOrderAccessSecret();
  const ttlMs = params.ttlMs ?? 1000 * 60 * 60 * 24 * 7;
  const payload: GuestOrderGrantPayload = {
    orderId: String(params.orderId),
    orderKey: params.orderKey,
    email: params.email.toLowerCase().trim(),
    exp: Date.now() + ttlMs,
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = computeSignature(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

/**
 * Verifies the integrity, signature, and expiration of a guest order grant token.
 */
export function verifyGuestOrderGrant(token: string): VerifyOrderGrantResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'invalid_token' };
  }

  let secret: string;
  try {
    secret = getOrderAccessSecret();
  } catch {
    return { valid: false, error: 'invalid_token' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'invalid_token' };
  }

  const [payloadB64, sig] = parts as [string, string];
  const expectedSig = computeSignature(payloadB64, secret);

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, error: 'tampered_token' };
  }

  try {
    const jsonStr = base64UrlDecode(payloadB64);
    const payload = JSON.parse(jsonStr) as GuestOrderGrantPayload;

    if (!payload.orderId || !payload.exp || typeof payload.exp !== 'number') {
      return { valid: false, error: 'invalid_token' };
    }

    if (Date.now() > payload.exp) {
      return { valid: false, error: 'expired_token' };
    }

    return {
      valid: true,
      grant: payload,
    };
  } catch {
    return { valid: false, error: 'invalid_token' };
  }
}

/**
 * Validates that the bearer of the grant is authorized to view the requested order ID.
 * Optional challenge email ensures strict identity matching when provided.
 */
export function verifyOrderOwnership(params: {
  token: string;
  orderId: string | number;
  challengeEmail?: string;
}): boolean {
  const res = verifyGuestOrderGrant(params.token);
  if (!res.valid || !res.grant) {
    return false;
  }

  if (res.grant.orderId !== String(params.orderId)) {
    return false;
  }

  if (params.challengeEmail) {
    const normalizedInput = params.challengeEmail.toLowerCase().trim();
    if (res.grant.email !== normalizedInput) {
      return false;
    }
  }

  return true;
}
