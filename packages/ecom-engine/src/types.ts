export type Money = {
  amount_minor: number;
  currency: string;
};

export type Locale = string;

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: Money;
  stock_quantity: number | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: Money;
  images: { url: string; altText: string }[];
  categories: string[];
  variants?: ProductVariant[];
  relatedProducts?: { id: string; slug: string; name: string; price: Money; images: any[] }[];
  reviewCount?: number;
  averageRating?: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: Money;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: Money;
  total: Money;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface OrderLine {
  id: string;
  productId: string;
  quantity: number;
  price: Money;
  name: string;
}

export interface Order {
  id: string;
  status: string;
  total: Money;
  items: OrderLine[];
  customer: Customer;
  shippingAddress?: Address;
  billingAddress?: Address;
}

export interface OrderListQuery {
  limit?: number;
  offset?: number;
}

export interface OrderListResult {
  items: Order[];
  total: number;
}

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export interface CheckoutSession {
  cartId: string;
  status: 'PENDING' | 'COMPLETED';
  _input?: CheckoutInput;
  _items?: Array<{ productId: string; slug: string; quantity: number }>;
}

export interface PaymentRef {
  provider: string;
  transactionId: string;
  status: string;
}

export interface ProductListQuery {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest';
}

export interface ProductListResult {
  items: Product[];
  total: number;
}

export interface AddToCartInput {
  productId: string;
  quantity: number;
  variantId?: string;
}

export interface CheckoutInput {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  paymentMethod: string;
  couponCode?: string;
  shippingMethod?: string;
}

export interface LoginInput {
  email: string;
  password?: string;
  provider?: string;
}

export interface RegisterInput {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
}

export interface AuthSession {
  token: string;
  customer: Customer;
}

export type CouponResult = 
  | { ok: true; discount: Money; description: string }
  | { ok: false; error: 'invalid' | 'expired' | 'min_order' | 'already_applied' };

export interface Coupon {
  code: string;
  amount: string;
  discount_type: 'percent' | 'fixed_cart' | 'fixed_product';
  description?: string;
}

export interface ShippingMethod {
  id: string;
  title: string;
  cost: Money;
  description?: string;
}

export interface StoreCapabilities {
  couponsEnabled: boolean;
  loyaltyEnabled: boolean;
  guestCheckout: boolean;
  multiCurrency: boolean;
  version: string;
}

export interface LoyaltyBalance {
  points: number;
  value_minor: number;
}

export interface LoyaltyRedemption {
  success: boolean;
  couponCode?: string;
  discountAmount?: number;
  remainingPoints?: number;
  error?: string;
}
