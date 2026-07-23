export type Money = { amount_minor: number; currency: string };

export interface ProductVariant {
  id: string; sku: string; name: string; price: Money; stock_quantity: number | null;
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
  relatedProducts?: { id: string; slug: string; name: string; price: Money; images: { url: string; altText: string }[] }[];
  reviewCount?: number;
  averageRating?: number;
}

export interface Category { id: string; slug: string; name: string }

export interface CartItem {
  id: string; productId: string; variantId?: string; quantity: number; price: Money;
}

export interface Customer { id: string; email: string; firstName: string; lastName: string }

export interface Address {
  id: string; firstName: string; lastName: string; street: string; city: string;
  postalCode: string; country: string; isDefaultShipping?: boolean; isDefaultBilling?: boolean;
}

export interface OrderLine { id: string; productId: string; quantity: number; price: Money; name: string }

export interface Order {
  id: string; status: string; total: Money; items: OrderLine[]; customer: Customer;
  shippingAddress?: Address; billingAddress?: Address;
}

export interface ProductListQuery {
  category?: string; search?: string; limit?: number; offset?: number;
  minPrice?: number; maxPrice?: number; sort?: 'price_asc' | 'price_desc' | 'newest';
}
export interface ProductListResult { items: Product[]; total: number }

export interface ShippingMethod { id: string; title: string; cost: Money; description?: string }

export type CouponResult =
  | { ok: true; discount: Money; description: string }
  | { ok: false; error: 'invalid' | 'expired' | 'min_order' | 'already_applied' };

export interface StoreCapabilities {
  couponsEnabled: boolean; loyaltyEnabled: boolean; guestCheckout: boolean;
  multiCurrency: boolean; version: string;
}

export interface LoyaltyBalance { points: number; value_minor: number }
