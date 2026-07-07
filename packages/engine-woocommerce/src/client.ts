import {
  EcomEngine,
  Product,
  Category,
  Cart,
  Order,
  CheckoutSession,
  PaymentRef,
  Locale,
  ProductListQuery,
  ProductListResult,
  AddToCartInput,
  CheckoutInput,
  LoginInput,
  RegisterInput,
  AuthSession,
  Customer,
  CartItem,
  Address,
  OrderListQuery,
  OrderListResult,
  CouponResult,
  Coupon,
  ShippingMethod,
  StoreCapabilities,
  LoyaltyBalance,
  LoyaltyRedemption,
} from '@ecom-os/engine';
import { fetchProducts, fetchCategories, fetchProductBySlug } from './products';
import { createOrderRest } from './orders';
import { loginGql, registerRest, getCustomerByToken, getCustomerOrdersRest, requestPasswordResetGql, resetPasswordGql } from './auth';
import { restFetch } from './rest';
import { mapProduct, mapCategory } from './mappers';

export class WooCommerceEngine implements EcomEngine {
  async listProducts(query: ProductListQuery): Promise<ProductListResult> {
    const rawProducts = await fetchProducts({
      category: query.category,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    });
    return {
      items: rawProducts.map(mapProduct),
      total: rawProducts.length,
    };
  }

  async getProduct(slug: string, locale?: Locale): Promise<Product | null> {
    const rawProduct = await fetchProductBySlug(slug);
    return rawProduct ? mapProduct(rawProduct) : null;
  }

  async listCategories(locale?: Locale): Promise<Category[]> {
    const rawCategories = await fetchCategories();
    return rawCategories.map(mapCategory);
  }

  async getCart(cartId: string): Promise<Cart> {
    // Cart state is owned by Zustand + localStorage client-side. Engine returns shell.
    return {
      id: cartId,
      items: [],
      subtotal: { amount_minor: 0, currency: 'USD' },
      total: { amount_minor: 0, currency: 'USD' },
    };
  }

  async addToCart(cartId: string, input: AddToCartInput): Promise<Cart> {
    // Validate product exists before client adds it to Zustand
    const raw = await fetchProductBySlug(input.productId);
    if (!raw) throw new Error(`Product not found: ${input.productId}`);
    const product = mapProduct(raw);
    const item: CartItem = {
      id: `${cartId}-${input.productId}`,
      productId: input.productId,
      quantity: input.quantity,
      price: product.price,
    };
    return {
      id: cartId,
      items: [item],
      subtotal: { amount_minor: product.price.amount_minor * input.quantity, currency: product.price.currency },
      total: { amount_minor: product.price.amount_minor * input.quantity, currency: product.price.currency },
    };
  }

  async listPaymentGateways(): Promise<Array<{ id: string; name: string; description?: string }>> {
    try {
      const gateways = await restFetch('/payment_gateways');
      const active = gateways
        .filter((g: any) => g.enabled === true)
        .map((g: any) => ({
          id: g.id,
          name: g.title || g.method_title,
          description: g.description || g.method_description,
        }));
      if (active.length === 0) {
        return [{ id: 'cod', name: 'Cash on delivery', description: 'Pay with cash upon delivery.' }];
      }
      return active;
    } catch (err) {
      console.error('[WooCommerceEngine] Failed to fetch payment gateways:', err);
      // Fallback to COD if API fails or is unavailable
      return [{ id: 'cod', name: 'Cash on delivery', description: 'Pay with cash upon delivery.' }];
    }
  }

  async initCheckout(
    cartId: string,
    input: CheckoutInput,
    items?: Array<{ productId: string; slug: string; quantity: number }>,
  ): Promise<CheckoutSession> {
    if (!input.email || !input.firstName || !input.lastName || !input.address) {
      throw new Error('Missing required checkout fields');
    }
    return { cartId, status: 'PENDING', _input: input, _items: items };
  }

  async placeOrder(session: CheckoutSession): Promise<Order> {
    if (!session._input) throw new Error('placeOrder called without checkout input');
    if (!session._items?.length) throw new Error('placeOrder called with empty cart');

    // PRICE INTEGRITY: re-fetch authoritative prices from WC. Client prices never used.
    const cartItems: CartItem[] = [];
    for (const item of session._items) {
      const raw = await fetchProductBySlug(item.slug);
      if (!raw) throw new Error(`Product unavailable at checkout: ${item.slug}`);
      const product = mapProduct(raw);
      cartItems.push({
        id: `${session.cartId}-${item.productId}`,
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    return createOrderRest(session._input, cartItems);
  }

  async markOrderPaid(orderId: string, paymentRef: PaymentRef): Promise<void> {
    // PATCH the WC order to 'processing' and record the gateway transaction ID
    await restFetch(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'processing',
        transaction_id: paymentRef.transactionId,
      }),
    });
  }

  async getOrder(orderId: string, customerId: string): Promise<Order | null> {
    const { getOrderRest } = await import('./orders');
    return getOrderRest(orderId, customerId);
  }

  async listCustomerOrders(customerId: string, query?: OrderListQuery): Promise<OrderListResult> {
    const orders = await getCustomerOrdersRest(customerId);
    return {
      items: orders,
      total: orders.length,
    };
  }

  async login(input: LoginInput): Promise<AuthSession> {
    return loginGql(input);
  }

  async registerCustomer(input: RegisterInput): Promise<AuthSession> {
    return registerRest(input);
  }

  async getCustomer(token: string): Promise<Customer | null> {
    return getCustomerByToken(token);
  }

  async requestPasswordReset(email: string): Promise<void> {
    await requestPasswordResetGql(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await resetPasswordGql(token, newPassword);
  }

  async listAddresses(customerId: string): Promise<Address[]> {
    const { listAddressesRest } = await import('./auth');
    return listAddressesRest(customerId);
  }

  async createAddress(customerId: string, input: Omit<Address, 'id'>): Promise<Address> {
    const { createAddressRest } = await import('./auth');
    return createAddressRest(customerId, input);
  }

  async updateAddress(customerId: string, addressId: string, input: Partial<Address>): Promise<Address> {
    const { updateAddressRest } = await import('./auth');
    return updateAddressRest(customerId, addressId, input);
  }

  async deleteAddress(customerId: string, addressId: string): Promise<void> {
    const { deleteAddressRest } = await import('./auth');
    return deleteAddressRest(customerId, addressId);
  }

  async applyCoupon(cartId: string, code: string, cartTotal: number): Promise<CouponResult> {
    const { applyCouponRest } = await import('./orders');
    return applyCouponRest(cartId, code, cartTotal);
  }

  async removeCoupon(cartId: string, code: string): Promise<boolean> {
    return true;
  }

  async validateCoupon(code: string): Promise<Coupon | null> {
    try {
      const coupons = await restFetch(`/coupons?code=${code}`);
      if (coupons && coupons.length > 0) {
        const c = coupons[0];
        return {
          code: c.code,
          amount: c.amount,
          discount_type: c.discount_type || 'fixed_cart',
          description: c.description,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async listShippingMethods(countryCode?: string): Promise<ShippingMethod[]> {
    try {
      // For headless shipping, we ideally query shipping zones. 
      // For simplicity in this implementation, we query the first shipping zone (ID 0 is usually "Rest of the World")
      // and fetch its methods.
      const methods = await restFetch('/shipping/zones/0/methods');
      return methods
        .filter((m: any) => m.enabled === true)
        .map((m: any) => ({
          id: m.instance_id ? `${m.method_id}:${m.instance_id}` : m.method_id,
          title: m.title,
          cost: {
            amount_minor: Math.round(parseFloat(m.settings?.cost?.value || '0') * 100),
            currency: 'USD', // Fallback, would ideally be fetched from settings
          },
          description: m.method_description,
        }));
    } catch (err) {
      console.error('[WooCommerceEngine] Failed to fetch shipping methods:', err);
      return [];
    }
  }
  async getCapabilities(): Promise<StoreCapabilities> {
    try {
      const wpUrl = process.env.WC_REST_URL || '';
      // Parse base URL (remove /wp-json/wc/v3)
      const baseUrl = wpUrl.replace(/\/wp-json\/wc\/v3\/?$/, '');
      const res = await fetch(`${baseUrl}/wp-json/epioso/v1/capabilities`);
      if (!res.ok) {
        console.warn('[WooCommerceEngine] Capabilities endpoint not found, returning defaults.');
        return {
          couponsEnabled: true,
          loyaltyEnabled: false,
          guestCheckout: true,
          multiCurrency: false,
          version: '1.0.0',
        };
      }
      const data = await res.json();
      return {
        couponsEnabled: data.couponsEnabled ?? false,
        loyaltyEnabled: data.loyaltyEnabled ?? false,
        guestCheckout: data.guestCheckout ?? false,
        multiCurrency: data.multiCurrency ?? false,
        version: data.version ?? '1.0.0',
      };
    } catch (err) {
      console.error('[WooCommerceEngine] Failed to fetch capabilities:', err);
      return {
        couponsEnabled: false,
        loyaltyEnabled: false,
        guestCheckout: false,
        multiCurrency: false,
        version: '1.0.0',
      };
    }
  }

  async getLoyaltyBalance(customerId: string): Promise<LoyaltyBalance> {
    try {
      const wpUrl = process.env.WC_REST_URL || '';
      const baseUrl = wpUrl.replace(/\/wp-json\/wc\/v3\/?$/, '');
      const res = await fetch(`${baseUrl}/wp-json/epioso/v1/loyalty/balance`);
      if (!res.ok) {
        console.warn('[WooCommerceEngine] Loyalty balance endpoint not found, returning 0.');
        return { points: 0, value_minor: 0 };
      }
      const data = await res.json();
      return {
        points: data.points || 0,
        value_minor: data.value_minor || 0,
      };
    } catch (err) {
      console.error('[WooCommerceEngine] Failed to get loyalty balance:', err);
      return { points: 0, value_minor: 0 };
    }
  }

  async redeemLoyaltyPoints(customerId: string, points: number): Promise<LoyaltyRedemption> {
    try {
      const wpUrl = process.env.WC_REST_URL || '';
      const baseUrl = wpUrl.replace(/\/wp-json\/wc\/v3\/?$/, '');
      const res = await fetch(`${baseUrl}/wp-json/epioso/v1/loyalty/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ points }),
      });
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          couponCode: data.coupon_code,
          discountAmount: data.discount_amount,
          remainingPoints: data.remaining_points,
        };
      }
      return { success: false, error: data.message || 'Failed to redeem points' };
    } catch (err: any) {
      console.error('[WooCommerceEngine] Failed to redeem loyalty points:', err);
      return { success: false, error: err.message || 'Network error' };
    }
  }
}
