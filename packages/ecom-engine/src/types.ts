export type Money = {
  amount_minor: number;
  currency: string;
};

export type Locale = string;

export interface Media {
  id?: string;
  url: string;
  altText: string;
  title?: string;
  width?: number;
  height?: number;
}

export type StockStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'ON_BACKORDER';

export interface InventoryAvailability {
  status: StockStatus;
  quantity: number | null;
  backordersAllowed: boolean;
  lowStockThreshold?: number | null;
  isPurchasable: boolean;
}

export type TaxDisplayMode = 'INCLUSIVE' | 'EXCLUSIVE';
export type TaxStatus = 'TAXABLE' | 'NONE' | 'SHIPPING_ONLY';

export interface TaxVisibility {
  displayMode: TaxDisplayMode;
  taxable: boolean;
  taxStatus?: TaxStatus;
  ratePercent?: number;
  label?: string;
}

export interface TechnicalAttribute {
  name: string;
  label: string;
  value: string | string[];
  group?: string;
}

export type DocumentType = 'manual' | 'datasheet' | 'certificate' | 'safety' | 'catalog' | 'other';

export interface Document {
  id: string;
  title: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
  type?: DocumentType;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logo?: Media;
  websiteUrl?: string;
  isOwned?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  parentId?: string | null;
  children?: Category[];
  image?: Media;
  count?: number;
}

export interface VariationAttributeValue {
  name: string;
  value: string;
  label?: string;
}

export interface Variation {
  id: string;
  sku: string;
  name: string;
  slug?: string;
  price: Money;
  regularPrice?: Money;
  salePrice?: Money;
  inventory?: InventoryAvailability;
  stock_quantity: number | null;
  attributes: VariationAttributeValue[];
  image?: Media;
  isPurchasable?: boolean;
}

// ProductVariant alias for backward compatibility with existing callers
export type ProductVariant = Variation;

export type ProductType = 'simple' | 'variable' | 'external' | 'grouped';

export interface ProductAttribute {
  id?: string;
  name: string;
  label?: string;
  options: string[];
  variation?: boolean;
  visible?: boolean;
}

export interface ProductPriceRange {
  min: Money;
  max: Money;
}

export interface RelatedProductReference {
  id: string;
  slug: string;
  name: string;
  price: Money;
  images: Media[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  type?: ProductType;
  description: string;
  shortDescription?: string;
  price: Money;
  regularPrice?: Money;
  salePrice?: Money;
  priceRange?: ProductPriceRange;
  taxVisibility?: TaxVisibility;
  inventory?: InventoryAvailability;
  images: Media[];
  categories: string[];
  categoryDetails?: Category[];
  brand?: Brand | null;
  variants?: Variation[];
  variations?: Variation[];
  attributes?: ProductAttribute[];
  technicalAttributes?: TechnicalAttribute[];
  documents?: Document[];
  relatedProducts?: RelatedProductReference[];
  reviewCount?: number;
  averageRating?: number;
  isPurchasable?: boolean;
  featured?: boolean;
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

export type ProductSort = 'price_asc' | 'price_desc' | 'newest' | 'title_asc' | 'title_desc';

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
}

export interface ProductListQuery {
  category?: string;
  brand?: string;
  search?: string;
  limit?: number;
  offset?: number;
  cursor?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  featured?: boolean;
  onSale?: boolean;
  locale?: Locale;
  inStockOnly?: boolean;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  pageInfo?: PageInfo;
}

export interface ProductQueryValidation {
  valid: boolean;
  error?: string;
}

export function validateProductQuery(query: ProductListQuery): ProductQueryValidation {
  if (query.cursor !== undefined && query.cursor !== null && query.offset !== undefined && query.offset !== null) {
    return { valid: false, error: 'Cannot combine cursor-based and offset-based pagination in the same query.' };
  }
  if (query.limit !== undefined && query.limit !== null) {
    if (query.limit < 0 || !Number.isInteger(query.limit)) {
      return { valid: false, error: 'Limit must be a non-negative integer.' };
    }
    if (query.limit > 100) {
      return { valid: false, error: 'Limit cannot exceed 100 items per page.' };
    }
  }
  if (query.offset !== undefined && query.offset !== null) {
    if (query.offset < 0 || !Number.isInteger(query.offset)) {
      return { valid: false, error: 'Offset must be a non-negative integer.' };
    }
  }
  if (query.minPrice !== undefined && query.minPrice !== null && query.minPrice < 0) {
    return { valid: false, error: 'Minimum price cannot be negative.' };
  }
  if (query.maxPrice !== undefined && query.maxPrice !== null && query.maxPrice < 0) {
    return { valid: false, error: 'Maximum price cannot be negative.' };
  }
  if (
    query.minPrice !== undefined &&
    query.minPrice !== null &&
    query.maxPrice !== undefined &&
    query.maxPrice !== null &&
    query.minPrice > query.maxPrice
  ) {
    return { valid: false, error: 'Minimum price cannot exceed maximum price.' };
  }
  if (query.cursor !== undefined && query.cursor !== null && typeof query.cursor === 'string' && query.cursor.trim() === '') {
    return { valid: false, error: 'Cursor cannot be an empty string.' };
  }
  return { valid: true };
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
