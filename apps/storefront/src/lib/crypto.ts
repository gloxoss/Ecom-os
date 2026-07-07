import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'crypto';

const KEY = Buffer.from(process.env.ECOM_OS_ENCRYPTION_KEY ?? '', 'base64');

if (KEY.length !== 32 && process.env.NODE_ENV !== 'test') {
  throw new Error('ECOM_OS_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
}

export function encrypt(plaintext: string): string {
  const keyToUse = KEY.length === 32 ? KEY : Buffer.alloc(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyToUse, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // format: iv(12) + tag(16) + ciphertext — all base64
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(ciphertext: string): string {
  const keyToUse = KEY.length === 32 ? KEY : Buffer.alloc(32);
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', keyToUse, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export function timingSafeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
