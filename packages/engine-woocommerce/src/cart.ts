import { Cart, AddToCartInput } from '@ecom-os/engine';
import { mapStoreCart } from './mappers';

export interface StoreApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cartToken?: string;
  body?: unknown;
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

  const headers = new Headers();
  if (options.cartToken) {
    headers.set('Cart-Token', options.cartToken);
  }
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url.toString(), {
    method: options.method || 'GET',
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
