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
  PageInfo,
  validateProductQuery,
  AddToCartInput,
  CheckoutInput,
  LoginInput,
  RegisterInput,
  AuthSession,
  Customer,
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
import { loginGql, registerRest, getCustomerByToken, getCustomerOrdersRest, requestPasswordResetGql, resetPasswordGql, requireCustomerAccounts } from './auth';
import { restFetch } from './rest';
import { mapProduct, mapCategory, buildCategoryTree } from './mappers';
import { fetchCurrency } from './currency';

export class WooCommerceEngine implements EcomEngine {
  async listProducts(query: ProductListQuery): Promise<ProductListResult> {
    const validation = validateProductQuery(query);
    if (!validation.valid) {
      throw new Error(`Invalid product query: ${validation.error}`);
    }

    const rawResult = await fetchProducts({
      ...(query.category !== undefined ? { category: query.category } : {}),
      ...(query.brand !== undefined ? { brand: query.brand } : {}),
      ...(query.minPrice !== undefined ? { minPrice: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { maxPrice: query.maxPrice } : {}),
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
      ...(query.cursor !== undefined ? { after: query.cursor } : {}),
      ...(query.offset !== undefined ? { offset: query.offset } : {}),
      ...(query.sort !== undefined ? { sort: query.sort } : {}),
      ...(query.inStockOnly !== undefined ? { inStockOnly: query.inStockOnly } : {}),
    });
    const currency = await fetchCurrency();
    const items = rawResult.nodes.map((raw) => mapProduct(raw, currency));
    const result: ProductListResult = {
      items,
      total: items.length,
    };
    if (rawResult.pageInfo) {
      const pageInfo: PageInfo = {
        hasNextPage: Boolean(rawResult.pageInfo.hasNextPage),
        hasPreviousPage: Boolean(rawResult.pageInfo.hasPreviousPage),
      };
      if (rawResult.pageInfo.startCursor) {
        pageInfo.startCursor = rawResult.pageInfo.startCursor;
      }
      if (rawResult.pageInfo.endCursor) {
        pageInfo.endCursor = rawResult.pageInfo.endCursor;
      }
      result.pageInfo = pageInfo;
    }
    return result;
  }

  async getProduct(slug: string, locale?: Locale): Promise<Product | null> {
    const rawProduct = await fetchProductBySlug(slug);
    return rawProduct ? mapProduct(rawProduct, await fetchCurrency()) : null;
  }

  async listCategories(locale?: Locale): Promise<Category[]> {
    const rawCategories = await fetchCategories();
    const flat = rawCategories.map(mapCategory);
    return buildCategoryTree(flat);
  }

  async getCart(_cartId: string): Promise<Cart> {
    throw new Error('Backend cart integration is unavailable pending Store API verification.');
  }

  async addToCart(_cartId: string, _input: AddToCartInput): Promise<Cart> {
    throw new Error('Backend cart integration is unavailable pending Store API verification.');
  }

  async listPaymentGateways(): Promise<Array<{ id: string; name: string; description?: string }>> {
    const gateways = await restFetch('/payment_gateways');
    return gateways.filter((g: any) => g.id === 'cod' && g.enabled === true)
      .map((g: any) => ({ id: g.id, name: g.title || g.method_title, description: g.description || g.method_description }));
  }

  async initCheckout(_cartId: string, _input: CheckoutInput, _items?: Array<{ productId: string; slug: string; quantity: number }>): Promise<CheckoutSession> {
    throw new Error('Checkout is unavailable pending authoritative cart, shipping and tax integration.');
  }

  async placeOrder(_session: CheckoutSession): Promise<Order> {
    throw new Error('Checkout is unavailable pending authoritative cart, shipping and tax integration.');
  }

  async markOrderPaid(_orderId: string, _paymentRef: PaymentRef): Promise<void> {
    throw new Error('Payment reconciliation is unavailable pending verified integration.');
  }

  async getOrder(_orderId: string, _customerId: string): Promise<Order | null> {
    return null;
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
      const coupons = await restFetch(`/coupons?code=${encodeURIComponent(code)}`);
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

  async listShippingMethods(_countryCode?: string): Promise<ShippingMethod[]> {
    throw new Error('Shipping is unavailable pending destination-based Store API rates.');
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

  async getLoyaltyBalance(_customerId: string): Promise<LoyaltyBalance> {
    return requireCustomerAccounts();
  }

  async redeemLoyaltyPoints(_customerId: string, _points: number): Promise<LoyaltyRedemption> {
    return requireCustomerAccounts();
  }

}
