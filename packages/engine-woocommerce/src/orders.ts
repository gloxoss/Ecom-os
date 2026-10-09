import type { CheckoutInput, CartItem, Order, CouponResult } from '@ecom-os/engine';
import { restFetch } from './rest';
import { fetchCurrency } from './currency';

export async function createOrderRest(_input: CheckoutInput, _items: CartItem[]): Promise<Order> {
  throw new Error('Legacy REST checkout is disabled pending authoritative cart, shipping and tax integration.');
}

export async function getOrderRest(_orderId: string, _customerId: string): Promise<Order | null> {
  return null;
}

export async function applyCouponRest(cartId: string, code: string, cartTotal: number): Promise<CouponResult> {
  try {
    const coupons = await restFetch(`/coupons?code=${encodeURIComponent(code)}`);
    if (!coupons || coupons.length === 0) {
      return { ok: false, error: 'invalid' };
    }
    
    const coupon = coupons[0];
    
    // Check expiry
    if (coupon.date_expires) {
      if (new Date(coupon.date_expires) < new Date()) {
        return { ok: false, error: 'expired' };
      }
    }

    // Check min order amount
    if (coupon.minimum_amount) {
      if ((cartTotal / 100) < parseFloat(coupon.minimum_amount)) {
        return { ok: false, error: 'min_order' };
      }
    }

    let discountMinor = 0;
    const amount = parseFloat(coupon.amount ?? '0');
    if (coupon.discount_type === 'percent') {
      discountMinor = Math.round(cartTotal * (amount / 100));
    } else if (coupon.discount_type === 'fixed_cart') {
      discountMinor = Math.round(amount * 100);
    } else {
      // product specific not fully supported in this simple implementation
      discountMinor = Math.round(amount * 100);
    }

    // Cap discount at cart total
    if (discountMinor > cartTotal) {
      discountMinor = cartTotal;
    }

    return {
      ok: true,
      discount: { amount_minor: discountMinor, currency: await fetchCurrency() },
      description: coupon.description || `Coupon code ${code} applied`,
    };
  } catch (err) {
    console.error(`[WooCommerceEngine] applyCoupon error:`, err);
    return { ok: false, error: 'invalid' };
  }
}
