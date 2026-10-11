import { Cart, AddToCartInput } from '@ecom-os/engine';
import { mapStoreCart } from './mappers';

export interface StoreApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cartToken?: string;
  body?: unknown;
  /** Nonce returned by a previous Store API response; a fresh one is fetched when absent. */
  nonce?: string;
}

export interface StoreApiResponse<T = any> {
  status: number;
  data: T;
  cartToken?: string;
  nonce?: string;
  headers: Headers;
}

export interface StoreCartResult {
  cart: Cart;
  cartToken: string;
  raw: any;
}

export function getStoreApiUrl(): string {
  if (process.env.WC_STORE_API_URL) {
    return process.env.WC_STORE_API_URL.replace(/\/$/, '');
  }
  if (process.env.WC_REST_URL) {
    return process.env.WC_REST_URL.replace(/\/wp-json\/wc\/v3\/?$/, '/wp-json/wc/store/v1');
  }
  if (process.env.WC_GRAPHQL_URL) {
    return process.env.WC_GRAPHQL_URL.replace(/\/graphql\/?$/, '/wp-json/wc/store/v1');
  }
  return 'https://paraloca.local/wp-json/wc/store/v1';
}

export async function storeApiFetch<T = any>(
  endpoint: string,
  options: StoreApiRequestOptions = {}
): Promise<StoreApiResponse<T>> {
  const baseUrl = getStoreApiUrl();
  const url = new URL(baseUrl.replace(/\/$/, '') + (endpoint.startsWith('/') ? endpoint : `/${endpoint}`));

  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('WooCommerce Store API requires HTTPS in production.');
  }

  const method = options.method || 'GET';
  let cartToken = options.cartToken;
  let nonce = options.nonce;

  /**
   * WooCommerce's Store API refuses every mutating request without a `Nonce` header:
   * "Missing the Nonce header. This endpoint requires a valid nonce." The nonce is issued
   * with a cart read, so a write that does not already hold one has to fetch it first —
   * otherwise add-to-cart, quantity changes and checkout all fail against a real store,
   * which is exactly what happened before this was added.
   */
  if (method !== 'GET' && !nonce) {
    try {
      const seedRes = await fetch(`${baseUrl.replace(/\/$/, '')}/cart`, {
        headers: cartToken ? { 'Cart-Token': cartToken } : {},
        signal: AbortSignal.timeout(30000),
      });
      nonce = seedRes.headers.get('Nonce') || seedRes.headers.get('X-WC-Store-API-Nonce') || undefined;
      const seedToken = seedRes.headers.get('Cart-Token');
      if (seedToken) cartToken = seedToken;
    } catch {
      // Fall through: the write proceeds and WooCommerce reports the reason itself.
    }
  }

  const headers = new Headers();
  if (cartToken) {
    headers.set('Cart-Token', cartToken);
  }
  if (nonce) {
    headers.set('Nonce', nonce);
  }
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    signal: AbortSignal.timeout(30000),
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const cartTokenHeader = res.headers.get('Cart-Token') || options.cartToken;
  const nonceHeader = res.headers.get('Nonce') || res.headers.get('X-WC-Store-API-Nonce') || undefined;

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // Ignore non-json responses
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.code || res.statusText || 'Unknown error';
    throw new Error(`Store API request failed [${res.status}]: ${errorMsg}`);
  }

  return {
    status: res.status,
    data,
    ...(cartTokenHeader ? { cartToken: cartTokenHeader } : {}),
    ...(nonceHeader ? { nonce: nonceHeader } : {}),
    headers: res.headers,
  };
}

export async function fetchStoreCart(cartToken?: string): Promise<StoreCartResult> {
  const options: StoreApiRequestOptions = {};
  if (cartToken) {
    options.cartToken = cartToken;
  }
  const res = await storeApiFetch('/cart', options);
  const activeToken = res.cartToken || cartToken || '';
  const cart = mapStoreCart(res.data, activeToken, res.data?.totals?.currency_code || 'MAD');
  return {
    cart,
    cartToken: activeToken,
    raw: res.data,
  };
}

export async function addItemToStoreCart(
  cartToken: string | undefined,
  input: { id: number; quantity: number }
): Promise<StoreCartResult> {
  const options: StoreApiRequestOptions = {
    method: 'POST',
    body: input,
  };
  if (cartToken) {
    options.cartToken = cartToken;
  }
  const res = await storeApiFetch('/cart/add-item', options);
  const activeToken = res.cartToken || cartToken || '';
  const cart = mapStoreCart(res.data, activeToken, res.data?.totals?.currency_code || 'MAD');
  return {
    cart,
    cartToken: activeToken,
    raw: res.data,
  };
}

export async function updateStoreCartItem(
  cartToken: string,
  key: string,
  quantity: number
): Promise<StoreCartResult> {
  const res = await storeApiFetch('/cart/update-item', {
    method: 'POST',
    cartToken,
    body: { key, quantity },
  });
  const activeToken = res.cartToken || cartToken;
  const cart = mapStoreCart(res.data, activeToken, res.data?.totals?.currency_code || 'MAD');
  return {
    cart,
    cartToken: activeToken,
    raw: res.data,
  };
}

export async function removeStoreCartItem(
  cartToken: string,
  key: string
): Promise<StoreCartResult> {
  const res = await storeApiFetch('/cart/remove-item', {
    method: 'POST',
    cartToken,
    body: { key },
  });
  const activeToken = res.cartToken || cartToken;
  const cart = mapStoreCart(res.data, activeToken, res.data?.totals?.currency_code || 'MAD');
  return {
    cart,
    cartToken: activeToken,
    raw: res.data,
  };
}

export async function applyCouponToStoreCart(
  cartToken: string,
  code: string
): Promise<StoreCartResult> {
  const res = await storeApiFetch('/cart/apply-coupon', {
    method: 'POST',
    cartToken,
    body: { code },
  });
  const activeToken = res.cartToken || cartToken;
  const cart = mapStoreCart(res.data, activeToken, res.data?.totals?.currency_code || 'MAD');
  return {
    cart,
    cartToken: activeToken,
    raw: res.data,
  };
}

export async function removeCouponFromStoreCart(
  cartToken: string,
  code: string
): Promise<StoreCartResult> {
  const res = await storeApiFetch('/cart/remove-coupon', {
    method: 'POST',
    cartToken,
    body: { code },
  });
  const activeToken = res.cartToken || cartToken;
  const cart = mapStoreCart(res.data, activeToken, res.data?.totals?.currency_code || 'MAD');
  return {
    cart,
    cartToken: activeToken,
    raw: res.data,
  };
}

export interface StoreAddress {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface UpdateCustomerInput {
  billing_address?: StoreAddress;
  shipping_address?: StoreAddress;
}

export interface StoreShippingRate {
  rate_id: string;
  name: string;
  description?: string;
  delivery_time?: string;
  price_minor: number;
  taxes_minor: number;
  selected: boolean;
  currency: string;
  method_id?: string;
  instance_id?: number;
}

export interface StoreShippingPackage {
  package_id: number | string;
  name: string;
  rates: StoreShippingRate[];
}

export interface StoreCustomerQuoteResult extends StoreCartResult {
  shippingPackages: StoreShippingPackage[];
  shippingTotal: {
    amount_minor: number;
    currency: string;
  };
  taxTotal: {
    amount_minor: number;
    currency: string;
  };
}

export function extractShippingPackages(raw: any, currency = 'MAD'): StoreShippingPackage[] {
  if (!raw || !Array.isArray(raw.shipping_rates)) return [];
  return raw.shipping_rates.map((pkg: any) => ({
    package_id: pkg.package_id ?? 0,
    name: pkg.name || 'Shipping',
    rates: Array.isArray(pkg.shipping_rates)
      ? pkg.shipping_rates.map((r: any) => ({
          rate_id: String(r.rate_id),
          name: r.name || 'Standard Shipping',
          ...(r.description ? { description: r.description } : {}),
          ...(r.delivery_time ? { delivery_time: r.delivery_time } : {}),
          price_minor: parseInt(r.price || '0', 10) || 0,
          taxes_minor: parseInt(r.taxes || '0', 10) || 0,
          selected: Boolean(r.selected),
          currency: r.currency_code || currency,
          ...(r.method_id ? { method_id: r.method_id } : {}),
          ...(r.instance_id !== undefined ? { instance_id: r.instance_id } : {}),
        }))
      : [],
  }));
}

export async function updateStoreCustomer(
  cartToken: string,
  input: UpdateCustomerInput
): Promise<StoreCustomerQuoteResult> {
  const res = await storeApiFetch('/cart/update-customer', {
    method: 'POST',
    cartToken,
    body: input,
  });
  const activeToken = res.cartToken || cartToken;
  const currency = res.data?.totals?.currency_code || 'MAD';
  const cart = mapStoreCart(res.data, activeToken, currency);
  const shippingPackages = extractShippingPackages(res.data, currency);
  const shippingTotalMinor = parseInt(res.data?.totals?.total_shipping || '0', 10);
  const taxTotalMinor = parseInt(res.data?.totals?.total_tax || '0', 10);

  return {
    cart,
    cartToken: activeToken,
    raw: res.data,
    shippingPackages,
    shippingTotal: {
      amount_minor: isNaN(shippingTotalMinor) ? 0 : shippingTotalMinor,
      currency,
    },
    taxTotal: {
      amount_minor: isNaN(taxTotalMinor) ? 0 : taxTotalMinor,
      currency,
    },
  };
}

export async function selectStoreShippingRate(
  cartToken: string,
  packageId: number | string,
  rateId: string
): Promise<StoreCustomerQuoteResult> {
  const res = await storeApiFetch('/cart/select-shipping-rate', {
    method: 'POST',
    cartToken,
    body: {
      package_id: packageId,
      rate_id: rateId,
    },
  });
  const activeToken = res.cartToken || cartToken;
  const currency = res.data?.totals?.currency_code || 'MAD';
  const cart = mapStoreCart(res.data, activeToken, currency);
  const shippingPackages = extractShippingPackages(res.data, currency);
  const shippingTotalMinor = parseInt(res.data?.totals?.total_shipping || '0', 10);
  const taxTotalMinor = parseInt(res.data?.totals?.total_tax || '0', 10);

  return {
    cart,
    cartToken: activeToken,
    raw: res.data,
    shippingPackages,
    shippingTotal: {
      amount_minor: isNaN(shippingTotalMinor) ? 0 : shippingTotalMinor,
      currency,
    },
    taxTotal: {
      amount_minor: isNaN(taxTotalMinor) ? 0 : taxTotalMinor,
      currency,
    },
  };
}


