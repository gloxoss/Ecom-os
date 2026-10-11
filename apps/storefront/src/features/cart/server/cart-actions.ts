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
 * Reads the authoritative server-side cart.
 *
 * Safe to call from a Server Component render. WooCommerce issues a Cart-Token on
 * every cart response, so this read often sees a token that differs from the
 * cookie. Persisting it here is illegal during render — Next throws "Cookies can
 * only be modified in a Server Action or Route Handler" — and that throw used to
 * take the whole page down, leaving the checkout showing an empty cart for a
 * shopper who had items. Persisting is therefore best-effort: whenever a write is
 * not allowed, the read still succeeds and the next Server Action
 * (`addToCartAction`, `updateCartItemAction`, checkout submission) persists the
 * token, since all of them call `setCartTokenCookie`.
 */
export async function fetchCartAction(): Promise<Cart | null> {
  try {
    const engine = await getEngine();
    const token = await getCartToken();
    const cart = await engine.getCart(token || '');
    if (cart.id && cart.id !== token) {
      await persistCartTokenQuietly(cart.id);
    }
    return cart;
  } catch (error) {
    console.error('[fetchCartAction] Error fetching cart from engine:', error);
    return null;
  }
}

async function persistCartTokenQuietly(token: string): Promise<void> {
  try {
    await setCartTokenCookie(token);
  } catch (error) {
    // Expected during RSC render; the next Server Action persists it.
    console.warn('[fetchCartAction] Cart-Token not persisted in this phase:', (error as Error).message);
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

interface CartMutationEngine {
  updateCartItem?: (token: string, itemKey: string, quantity: number) => Promise<Cart>;
  removeCartItem?: (token: string, itemKey: string) => Promise<Cart>;
}

/**
 * Server Action: Updates quantity of an item in the authoritative server-side cart.
 */
export async function updateCartItemAction(
  itemKey: string,
  quantity: number
): Promise<Cart | null> {
  const engine = (await getEngine()) as unknown as CartMutationEngine;
  const token = await getCartToken();
  if (!token) return null;
  if (typeof engine.updateCartItem === 'function') {
    const cart = await engine.updateCartItem(token, itemKey, quantity);
    return cart;
  }
  return null;
}

/**
 * Server Action: Removes an item from the authoritative server-side cart.
 */
export async function removeCartItemAction(itemKey: string): Promise<Cart | null> {
  const engine = (await getEngine()) as unknown as CartMutationEngine;
  const token = await getCartToken();
  if (!token) return null;
  if (typeof engine.removeCartItem === 'function') {
    const cart = await engine.removeCartItem(token, itemKey);
    return cart;
  }
  return null;
}

export async function clearCartCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CART_TOKEN_COOKIE);
  cookieStore.delete(LEGACY_CART_COOKIE);
}
