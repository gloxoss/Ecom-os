'use server';

import { cookies } from 'next/headers';
import { getEngine } from '@/lib/engine';
import type { Cart } from '@ecom-os/engine';

const CART_TOKEN_COOKIE = 'ecom_cart_token';
const LEGACY_CART_COOKIE = 'ecom_cart_id';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
};

/**
 * Read-only — safe to call from RSC render phase.
 * Returns the existing Cart-Token, or null if no cart has been started yet.
 */
export async function getCartToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return (
    cookieStore.get(CART_TOKEN_COOKIE)?.value ||
    cookieStore.get(LEGACY_CART_COOKIE)?.value ||
    null
  );
}

/**
 * Backward compatibility alias for existing callers.
 */
export async function getCartId(): Promise<string | null> {
  return getCartToken();
}

/**
 * Persists an authoritative WooCommerce Store API Cart-Token into the session cookie.
 */
export async function setCartTokenCookie(token: string): Promise<void> {
  if (!token) return;
  const cookieStore = await cookies();
  cookieStore.set(CART_TOKEN_COOKIE, token, COOKIE_OPTIONS);
}

/**
 * Write — must only be called from a Server Action or Route Handler.
 * Returns the existing cart ID or provisions one from the server.
 */
export async function ensureCartId(): Promise<string> {
  const existing = await getCartToken();
  if (existing) return existing;
  const cart = await fetchCartAction();
  return cart?.id || '';
}

/** @deprecated use getCartId (RSC) or ensureCartId (Server Action) */
export async function getOrCreateCartId(): Promise<string> {
  return ensureCartId();
}

/**
 * Server Action: Retrieves the authoritative server-side cart.
 * If a fresh Cart-Token is issued by WooCommerce, it automatically persists to the cookie.
 */
export async function fetchCartAction(): Promise<Cart | null> {
  try {
    const engine = await getEngine();
    const token = await getCartToken();
    const cart = await engine.getCart(token || '');
    if (cart.id && cart.id !== token) {
      await setCartTokenCookie(cart.id);
    }
    return cart;
  } catch (error) {
    console.error('[fetchCartAction] Error fetching cart from engine:', error);
    return null;
  }
}

/**
 * Server Action: Adds an item to the authoritative server-side cart.
 * Persists the resulting Cart-Token to the session cookie.
 */
export async function addToCartAction(
  productId: string,
  quantity: number = 1,
  variantId?: string
): Promise<Cart> {
  const engine = await getEngine();
  const token = await getCartToken();
  const cart = await engine.addToCart(token || '', {
    productId,
    quantity,
    ...(variantId ? { variantId } : {}),
  });
  if (cart.id) {
    await setCartTokenCookie(cart.id);
  }
  return cart;
}

export async function clearCartCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CART_TOKEN_COOKIE);
  cookieStore.delete(LEGACY_CART_COOKIE);
}
