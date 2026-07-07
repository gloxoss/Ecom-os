'use server';

import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const CART_COOKIE = 'ecom_cart_id';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
};

/**
 * Read-only — safe to call from RSC render phase.
 * Returns the existing cart ID, or null if no cart has been started yet.
 */
export async function getCartId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE)?.value ?? null;
}

/**
 * Write — must only be called from a Server Action or Route Handler.
 * Returns the existing cart ID or mints a new one and sets the cookie.
 */
export async function ensureCartId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  cookieStore.set(CART_COOKIE, id, COOKIE_OPTIONS);
  return id;
}

/** @deprecated use getCartId (RSC) or ensureCartId (Server Action) */
export async function getOrCreateCartId(): Promise<string> {
  return ensureCartId();
}

export async function clearCartCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE);
}
