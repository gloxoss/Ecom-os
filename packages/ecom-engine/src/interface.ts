import {
  Product,
  Variation,
  Category,
  Brand,
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
  OrderListQuery,
  OrderListResult,
  Address,
  CouponResult,
  Coupon,
  ShippingMethod,
  StoreCapabilities,
  LoyaltyBalance,
  LoyaltyRedemption,
} from './types';

// Re-export all types so consumers can just import from interface
export * from './types';

export interface EcomEngine {
  listProducts(query: ProductListQuery): Promise<ProductListResult>;
  getProduct(slug: string, locale?: Locale): Promise<Product | null>;
  listCategories(locale?: Locale): Promise<Category[]>;
  listBrands?(locale?: Locale): Promise<Brand[]>;
  getBrand?(slug: string, locale?: Locale): Promise<Brand | null>;
  getCart(cartId: string): Promise<Cart>;
  addToCart(cartId: string, input: AddToCartInput): Promise<Cart>;
  listPaymentGateways(): Promise<Array<{ id: string; name: string; description?: string }>>;
  initCheckout(cartId: string, input: CheckoutInput, items?: Array<{ productId: string; slug: string; quantity: number }>): Promise<CheckoutSession>;
  placeOrder(session: CheckoutSession): Promise<Order>;
  markOrderPaid(orderId: string, paymentRef: PaymentRef): Promise<void>;
  getOrder(orderId: string, customerId: string): Promise<Order | null>;
  getGuestOrder?(orderId: string, orderKey: string): Promise<Order | null>;
  listCustomerOrders(customerId: string, query?: OrderListQuery): Promise<OrderListResult>;
  login(input: LoginInput): Promise<AuthSession>;
  registerCustomer(input: RegisterInput): Promise<AuthSession>;
  getCustomer(token: string): Promise<Customer | null>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  listAddresses(customerId: string): Promise<Address[]>;
  createAddress(customerId: string, input: Omit<Address, 'id'>): Promise<Address>;
  updateAddress(customerId: string, addressId: string, input: Partial<Address>): Promise<Address>;
  deleteAddress(customerId: string, addressId: string): Promise<void>;
  
  applyCoupon(cartId: string, code: string, cartTotal: number): Promise<CouponResult>;
  removeCoupon(cartId: string, code: string): Promise<boolean>;
  validateCoupon?(code: string): Promise<Coupon | null>;
  
  listShippingMethods(countryCode?: string): Promise<ShippingMethod[]>;
  
  getCapabilities(): Promise<StoreCapabilities>;

  getLoyaltyBalance(customerId: string): Promise<LoyaltyBalance>;
  redeemLoyaltyPoints(customerId: string, points: number): Promise<LoyaltyRedemption>;
}
