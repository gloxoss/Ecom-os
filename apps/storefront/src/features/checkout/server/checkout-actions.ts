'use server';

import { getEngine } from '@/lib/engine';
import { Coupon, ShippingMethod } from '@ecom-os/engine';

export async function validateCouponAction(code: string): Promise<Coupon | null> {
  const engine = await getEngine();
  if (engine.validateCoupon) {
    return engine.validateCoupon(code);
  }
  return null;
}

export async function listShippingMethodsAction(countryCode?: string): Promise<ShippingMethod[]> {
  const engine = await getEngine();
  if (engine.listShippingMethods) {
    return engine.listShippingMethods(countryCode);
  }
  return [];
}
