import {
  EcomEngine,
  Product,
  Category,
  Brand,
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
import { fetchBrands, fetchBrandBySlug } from './brands';
import { loginGql, registerRest, getCustomerByToken, getCustomerOrdersRest, requestPasswordResetGql, resetPasswordGql, requireCustomerAccounts } from './auth';
import { restFetch } from './rest';
import { mapProduct, mapCategory, mapBrand, buildCategoryTree } from './mappers';
import { fetchCurrency } from './currency';
import {
  fetchStoreCart,
  addItemToStoreCart,
  updateStoreCartItem,
  removeStoreCartItem,
  applyCouponToStoreCart,
  removeCouponFromStoreCart,
  updateStoreCustomer,
  selectStoreShippingRate,
  type UpdateCustomerInput,
  type StoreCustomerQuoteResult,
} from './cart';

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

  async listBrands(_locale?: Locale): Promise<Brand[]> {
    const rawBrands = await fetchBrands();
    return rawBrands.map(mapBrand);
  }

  async getBrand(slug: string, _locale?: Locale): Promise<Brand | null> {
    const rawBrand = await fetchBrandBySlug(slug);
    return rawBrand ? mapBrand(rawBrand) : null;
  }

  async getCart(cartId: string): Promise<Cart> {
    const { cart } = await fetchStoreCart(cartId || undefined);
    return cart;
  }

  async addToCart(cartId: string, input: AddToCartInput): Promise<Cart> {
    const targetId = input.variantId ? parseInt(input.variantId, 10) : parseInt(input.productId, 10);
    if (isNaN(targetId) || targetId <= 0) {
      throw new Error(`Invalid product or variation ID for addToCart: ${input.variantId || input.productId}`);
    }
    const { cart } = await addItemToStoreCart(cartId || undefined, {
      id: targetId,
      quantity: input.quantity,
    });
    return cart;
  }

  async updateCartItem(cartId: string, key: string, quantity: number): Promise<Cart> {
    if (quantity <= 0) {
      const { cart } = await removeStoreCartItem(cartId, key);
      return cart;
    }
    const { cart } = await updateStoreCartItem(cartId, key, quantity);
    return cart;
  }

  async removeCartItem(cartId: string, key: string): Promise<Cart> {
    const { cart } = await removeStoreCartItem(cartId, key);
    return cart;
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
    if (cartId) {
      try {
        const { raw, cart } = await applyCouponToStoreCart(cartId, code);
        const discountMinor = parseInt(raw?.totals?.total_discount || '0', 10);
        return {
          ok: true,
          discount: {
            amount_minor: isNaN(discountMinor) ? 0 : discountMinor,
            currency: cart.total.currency || 'MAD',
          },
          description: `Coupon ${code} applied successfully`,
        };
      } catch (err: any) {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('expired')) return { ok: false, error: 'expired' };
        if (msg.includes('already') || msg.includes('applied')) return { ok: false, error: 'already_applied' };
        if (msg.includes('min') || msg.includes('minimum')) return { ok: false, error: 'min_order' };
        return { ok: false, error: 'invalid' };
      }
    }
    const { applyCouponRest } = await import('./orders');
    return applyCouponRest(cartId, code, cartTotal);
  }

  async removeCoupon(cartId: string, code: string): Promise<boolean> {
    if (cartId) {
      try {
        await removeCouponFromStoreCart(cartId, code);
        return true;
      } catch {
        return false;
      }
    }
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

  async updateCustomerAddress(
    cartId: string,
    input: UpdateCustomerInput
  ): Promise<StoreCustomerQuoteResult> {
    return updateStoreCustomer(cartId, input);
  }

  async selectShippingRate(
    cartId: string,
    rateId: string,
    packageId: number | string = 0
  ): Promise<StoreCustomerQuoteResult> {
    return selectStoreShippingRate(cartId, packageId, rateId);
  }

  async listShippingMethods(_countryCode?: string): Promise<ShippingMethod[]> {
    try {
      const zones = await restFetch('/shipping/zones');
      if (Array.isArray(zones) && zones.length > 0) {
        const methods = await restFetch(`/shipping/zones/${zones[0].id}/methods`);
        if (Array.isArray(methods)) {
          const currency = await fetchCurrency();
          return methods
            .filter((m: any) => m.enabled)
            .map((m: any) => ({
              id: `${m.method_id}:${m.instance_id}`,
              title: m.title || m.method_title,
              cost: {
                amount_minor: Math.round(parseFloat(m.settings?.cost?.value || '0') * 100),
                currency,
              },
              description: m.method_description,
            }));
        }
      }
    } catch {
      // Return empty array when REST zones are unconfigured or unavailable
    }
    return [];
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
