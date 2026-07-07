'use server';

import { getEngine } from '@/lib/engine';
import { getCartId } from '@/features/cart/server/cart-actions';
import { CouponResult } from '@ecom-os/engine';

export async function applyCouponAction(code: string, cartTotal: number): Promise<CouponResult> {
  const engine = await getEngine();
  const cartId = await getCartId();
  if (!cartId) return { ok: false, error: 'invalid' };
  
  return engine.applyCoupon(cartId, code, cartTotal);
}
