import type { CheckoutInput, CartItem, Order, CouponResult } from '@ecom-os/engine';
import { restFetch } from './rest';
import { fetchCurrency } from './currency';

export async function createOrderRest(_input: CheckoutInput, _items: CartItem[]): Promise<Order> {
  throw new Error('Legacy REST checkout is disabled pending authoritative cart, shipping and tax integration.');
}

export async function getOrderRest(_orderId: string, _customerId: string): Promise<Order | null> {
  return null;
}

export async function getGuestOrderRest(orderId: string, orderKey: string): Promise<Order | null> {
  if (!orderId || !orderKey) return null;
  try {
    const data = await restFetch(`/orders/${orderId}`);
    if (!data || typeof data !== 'object') return null;
    if (data.order_key !== orderKey) return null;

    const currency = String(data.currency || await fetchCurrency());
    const totalMinor = Math.round(parseFloat(data.total || '0') * 100);

    return {
      id: String(data.id),
      status: String(data.status || 'unknown'),
      total: { amount_minor: totalMinor, currency },
      items: Array.isArray(data.line_items)
        ? data.line_items.map((item: { product_id?: number | string; name?: string; quantity?: number; total?: string }) => ({
            productId: String(item.product_id),
            slug: item.name ? String(item.name).toLowerCase().replace(/\s+/g, '-') : '',
            quantity: Number(item.quantity || 1),
            price: {
              amount_minor: Math.round(parseFloat(item.total || '0') * 100),
              currency,
            },
          }))
        : [],
      customer: {
        id: String(data.customer_id || 0),
        email: String(data.billing?.email || ''),
        firstName: String(data.billing?.first_name || ''),
        lastName: String(data.billing?.last_name || ''),
      },
    };
  } catch {
    return null;
  }
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
