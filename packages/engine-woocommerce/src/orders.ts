import { Order, CheckoutInput, CartItem, Money, CouponResult } from '@ecom-os/engine';
import { restFetch } from './rest';

type WCLineItem = { product_id: number; quantity: number };

export async function createOrderRest(
  input: CheckoutInput,
  items: CartItem[],
): Promise<Order> {
  const line_items: WCLineItem[] = items.map(item => ({
    product_id: Number(item.productId),
    quantity: item.quantity,
  }));

  const payload: any = {
    payment_method: input.paymentMethod,
    payment_method_title: input.paymentMethod === 'cod' ? 'Cash on Delivery' : input.paymentMethod,
    set_paid: false,
    billing: {
      first_name: input.firstName,
      last_name: input.lastName,
      address_1: input.address,
      email: input.email,
    },
    line_items,
  };

  if (input.couponCode) {
    payload.coupon_lines = [
      { code: input.couponCode }
    ];
  }

  if (input.shippingMethod) {
    payload.shipping_lines = [
      { 
        method_id: input.shippingMethod.split(':')[0], 
        method_title: input.shippingMethod,
        total: '0' 
      }
    ];
  }

  const response = await restFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const total: Money = {
    amount_minor: Math.round(parseFloat(response.total ?? '0') * 100),
    currency: response.currency ?? 'USD',
  };

  return {
    id: String(response.id),
    status: response.status ?? 'pending',
    total,
    items: [],
    customer: {
      id: String(response.customer_id ?? 0),
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  };
}

export async function getOrderRest(orderId: string, customerId: string): Promise<Order | null> {
  try {
    const response = await restFetch(`/orders/${orderId}`);
    
    // Security check: ensure order belongs to customer
    if (String(response.customer_id) !== customerId) {
      return null;
    }

    const total: Money = {
      amount_minor: Math.round(parseFloat(response.total ?? '0') * 100),
      currency: response.currency ?? 'USD',
    };

    return {
      id: String(response.id),
      status: response.status ?? 'unknown',
      total,
      items: (response.line_items ?? []).map((item: any) => ({
        id: String(item.id),
        productId: String(item.product_id),
        quantity: item.quantity,
        price: {
          amount_minor: Math.round(parseFloat(item.price ?? '0') * 100),
          currency: response.currency ?? 'USD',
        },
        name: item.name ?? '',
      })),
      customer: {
        id: String(response.customer_id ?? 0),
        email: response.billing?.email ?? '',
        firstName: response.billing?.first_name ?? '',
        lastName: response.billing?.last_name ?? '',
      },
      billingAddress: {
        id: 'billing',
        firstName: response.billing?.first_name ?? '',
        lastName: response.billing?.last_name ?? '',
        street: response.billing?.address_1 ?? '',
        city: response.billing?.city ?? '',
        postalCode: response.billing?.postcode ?? '',
        country: response.billing?.country ?? '',
        isDefaultBilling: true,
      },
      shippingAddress: {
        id: 'shipping',
        firstName: response.shipping?.first_name ?? '',
        lastName: response.shipping?.last_name ?? '',
        street: response.shipping?.address_1 ?? '',
        city: response.shipping?.city ?? '',
        postalCode: response.shipping?.postcode ?? '',
        country: response.shipping?.country ?? '',
        isDefaultShipping: true,
      },
    };
  } catch (err) {
    console.error(`[WooCommerceEngine] getOrder error:`, err);
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
      discount: { amount_minor: discountMinor, currency: 'USD' },
      description: coupon.description || `Coupon code ${code} applied`,
    };
  } catch (err) {
    console.error(`[WooCommerceEngine] applyCoupon error:`, err);
    return { ok: false, error: 'invalid' };
  }
}
