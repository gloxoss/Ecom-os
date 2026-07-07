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
  OrderListResult,
  Address,
  CouponResult,
  OrderListQuery,
  StoreCapabilities,
  LoyaltyBalance,
  LoyaltyRedemption
} from './interface';

export class FakeEngine implements EcomEngine {
  async listProducts(query: ProductListQuery): Promise<ProductListResult> {
    return {
      items: [],
      total: 0,
    };
  }

  async getProduct(slug: string, locale?: Locale): Promise<Product | null> {
    return null;
  }

  async listCategories(locale?: Locale): Promise<Category[]> {
    return [];
  }

  async getCart(cartId: string): Promise<Cart> {
    return {
      id: cartId,
      items: [],
      subtotal: { amount_minor: 0, currency: 'USD' },
      total: { amount_minor: 0, currency: 'USD' },
    };
  }

  async addToCart(cartId: string, input: AddToCartInput): Promise<Cart> {
    return this.getCart(cartId);
  }

  async listPaymentGateways(): Promise<Array<{ id: string; name: string; description?: string }>> {
    return [
      { id: 'cod', name: 'Cash on delivery', description: 'Pay with cash upon delivery.' }
    ];
  }

  async initCheckout(cartId: string, input: CheckoutInput, items?: Array<{ productId: string; slug: string; quantity: number }>): Promise<CheckoutSession> {
    return { cartId, status: 'PENDING', _input: input, _items: items };
  }

  async placeOrder(session: CheckoutSession): Promise<Order> {
    return {
      id: 'fake-order-123',
      status: 'PENDING',
      total: { amount_minor: 0, currency: 'USD' },
      items: [],
      customer: {
        id: 'fake-customer-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
    };
  }

  async markOrderPaid(orderId: string, paymentRef: PaymentRef): Promise<void> {}

  async getOrder(orderId: string, customerId: string): Promise<Order | null> {
    return null;
  }

  async listCustomerOrders(customerId: string, query?: OrderListQuery): Promise<OrderListResult> {
    return {
      items: [],
      total: 0
    };
  }

  async login(input: LoginInput): Promise<AuthSession> {
    return { token: 'fake-token', customer: { id: '1', email: input.email, firstName: 'Fake', lastName: 'User' } };
  }

  async registerCustomer(input: RegisterInput): Promise<AuthSession> {
    return { token: 'fake-token', customer: { id: '1', email: input.email, firstName: input.firstName, lastName: input.lastName } };
  }

  async getCustomer(token: string): Promise<Customer | null> {
    if (token === 'fake-token') {
      return { id: '1', email: 'fake@example.com', firstName: 'Fake', lastName: 'User' };
    }
    return null;
  }

  async requestPasswordReset(email: string): Promise<void> {}

  async resetPassword(token: string, newPassword: string): Promise<void> {}

  async listAddresses(customerId: string): Promise<Address[]> {
    return [];
  }

  async createAddress(customerId: string, input: Omit<Address, 'id'>): Promise<Address> {
    return { id: 'fake-addr-1', ...input };
  }

  async updateAddress(customerId: string, addressId: string, input: Partial<Address>): Promise<Address> {
    return { id: addressId, firstName: '', lastName: '', street: '', city: '', postalCode: '', country: '', ...input };
  }

  async deleteAddress(customerId: string, addressId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async applyCoupon(cartId: string, code: string, cartTotal: number): Promise<CouponResult> {
    if (code === 'TEST10') {
      return { ok: true, discount: { amount_minor: 1000, currency: 'USD' }, description: '$10 off' };
    }
    return { ok: false, error: 'invalid' };
  }

  async removeCoupon(cartId: string, code: string): Promise<boolean> {
    return true;
  }

  async validateCoupon(code: string) {
    if (code === 'TEST10') {
      return { code, amount: '10.00', discount_type: 'fixed_cart' as const, description: '$10 off' };
    }
    return null;
  }

  async listShippingMethods(countryCode?: string) {
    return [
      { id: 'flat_rate:1', title: 'Standard Delivery', cost: { amount_minor: 1000, currency: 'USD' } },
      { id: 'free_shipping:2', title: 'Free Shipping', cost: { amount_minor: 0, currency: 'USD' } }
    ];
  }

  async getCapabilities(): Promise<StoreCapabilities> {
    return {
      couponsEnabled: true,
      loyaltyEnabled: true,
      guestCheckout: true,
      multiCurrency: false,
      version: '1.0.0',
    };
  }

  async getLoyaltyBalance(customerId: string): Promise<LoyaltyBalance> {
    return {
      points: 1000,
      value_minor: 5000, // $50.00
    };
  }

  async redeemLoyaltyPoints(customerId: string, points: number): Promise<LoyaltyRedemption> {
    return {
      success: true,
      couponCode: 'LOYALTY-TEST',
      discountAmount: (points * 0.05) * 100, // assuming 1 point = $0.05
      remainingPoints: 1000 - points,
    };
  }
}
