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
  /** Nonce issued with the latest response; thread it into the next mutation. */
  nonce?: string;
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
    ...(res.nonce ? { nonce: res.nonce } : {}),
  };
}

export async function addItemToStoreCart(
  cartToken: string | undefined,
  input: { id: number; quantity: number },
  nonce?: string
): Promise<StoreCartResult> {
  const options: StoreApiRequestOptions = {
    method: 'POST',
    body: input,
  };
  if (cartToken) {
    options.cartToken = cartToken;
  }
  if (nonce) {
    options.nonce = nonce;
  }
  const res = await storeApiFetch('/cart/add-item', options);
  const activeToken = res.cartToken || cartToken || '';
  const cart = mapStoreCart(res.data, activeToken, res.data?.totals?.currency_code || 'MAD');
  return {
    cart,
    cartToken: activeToken,
    raw: res.data,
    ...(res.nonce ? { nonce: res.nonce } : {}),
  };
}

export async function updateStoreCartItem(
  cartToken: string,
  key: string,
  quantity: number,
  nonce?: string
): Promise<StoreCartResult> {
  const res = await storeApiFetch('/cart/update-item', {
    method: 'POST',
    cartToken,
    ...(nonce ? { nonce } : {}),
    body: { key, quantity },
  });
  const activeToken = res.cartToken || cartToken;
  const cart = mapStoreCart(res.data, activeToken, res.data?.totals?.currency_code || 'MAD');
  return {
    cart,
    cartToken: activeToken,
    raw: res.data,
    ...(res.nonce ? { nonce: res.nonce } : {}),
  };
}

export async function removeStoreCartItem(
  cartToken: string,
  key: string,
  nonce?: string
): Promise<StoreCartResult> {
  const res = await storeApiFetch('/cart/remove-item', {
    method: 'POST',
    cartToken,
    ...(nonce ? { nonce } : {}),
    body: { key },
  });
  const activeToken = res.cartToken || cartToken;
  const cart = mapStoreCart(res.data, activeToken, res.data?.totals?.currency_code || 'MAD');
  return {
    cart,
    cartToken: activeToken,
    raw: res.data,
    ...(res.nonce ? { nonce: res.nonce } : {}),
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

/**
 * Canonical identity of one cart line. Variations match by variation ID across
 * both sides: the Store API reports a variation line under its variation ID,
 * so keying variations by parent product alone would never match.
 */
export function cartLineKey(productId: string, variationId?: string): string {
  return variationId ? `v:${variationId}` : `p:${productId}`;
}

export interface IntendedCartLine {
  productId: string;
  variationId?: string;
  quantity: number;
}

export interface CartReconcileDiff {
  added: number;
  updated: number;
  removed: number;
  /** Intended variation lines paired against a surplus simple line of the same product. */
  variationMismatches: number;
  details: Array<{ action: 'add' | 'update' | 'remove'; key: string; quantity?: number }>;
}

export interface ReconcileStoreCartResult extends StoreCartResult {
  diff: CartReconcileDiff;
}

interface NormalizedLine {
  key: string;
  lineKey?: string;
  productId: string;
  variationId?: string;
  quantity: number;
}

function normalizeIntended(lines: IntendedCartLine[]): Map<string, NormalizedLine> {
  const merged = new Map<string, NormalizedLine>();
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error(`Invalid intended quantity for product ${line.productId}: ${line.quantity}`);
    }
    const target = line.variationId ?? line.productId;
    if (!/^\d+$/.test(target)) {
      throw new Error(`Invalid product or variation ID for reconcile: ${target}`);
    }
    const key = cartLineKey(line.productId, line.variationId);
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      merged.set(key, {
        key,
        productId: line.productId,
        ...(line.variationId ? { variationId: line.variationId } : {}),
        quantity: line.quantity,
      });
    }
  }
  return merged;
}

function normalizeWooItems(items: Array<{ id: string; productId: string; variantId?: string; quantity: number }>): Map<string, NormalizedLine> {
  const map = new Map<string, NormalizedLine>();
  for (const item of items) {
    map.set(cartLineKey(item.productId, item.variantId), {
      key: cartLineKey(item.productId, item.variantId),
      lineKey: item.id,
      productId: item.productId,
      ...(item.variantId ? { variationId: item.variantId } : {}),
      quantity: item.quantity,
    });
  }
  return map;
}

/**
 * Makes the authoritative WooCommerce cart exactly match the intended
 * product/variation/quantity multiset: missing lines are added, quantity drift
 * is updated, surplus lines are removed. Mutations run strictly sequentially
 * while threading the rotated Cart-Token and Nonce, then the final cart is
 * re-read and compared exactly. Any mutation failure aborts with the
 * authoritative Store API error; a final mismatch throws instead of claiming
 * success.
 */
export async function reconcileStoreCart(
  cartToken: string | undefined,
  intended: IntendedCartLine[],
  options: { nonce?: string } = {}
): Promise<ReconcileStoreCartResult> {
  const wanted = normalizeIntended(intended);
  let token = cartToken || '';
  let nonce = options.nonce;

  const read = await fetchStoreCart(token || undefined);
  token = read.cartToken || token;
  nonce = read.nonce ?? nonce;
  if (!token) {
    throw new Error('Cart reconciliation requires a WooCommerce cart token.');
  }
  const current = normalizeWooItems(read.cart.items);

  const diff: CartReconcileDiff = { added: 0, updated: 0, removed: 0, variationMismatches: 0, details: [] };

  for (const [key, want] of wanted) {
    const have = current.get(key);
    if (have && have.quantity !== want.quantity && have.lineKey) {
      const res = await updateStoreCartItem(token, have.lineKey, want.quantity, nonce);
      token = res.cartToken || token;
      nonce = res.nonce ?? nonce;
      diff.updated += 1;
      diff.details.push({ action: 'update', key, quantity: want.quantity });
    }
  }

  for (const [key, have] of current) {
    if (!wanted.has(key) && have.lineKey) {
      const res = await removeStoreCartItem(token, have.lineKey, nonce);
      token = res.cartToken || token;
      nonce = res.nonce ?? nonce;
      diff.removed += 1;
      diff.details.push({ action: 'remove', key });
    }
  }

  for (const [key, want] of wanted) {
    if (!current.has(key)) {
      const surplusSimple = [...current.values()].find(
        (have) => !wanted.has(have.key) && !have.variationId && have.productId === want.productId
      );
      if (want.variationId && surplusSimple) {
        diff.variationMismatches += 1;
      }
      const targetId = parseInt(want.variationId ?? want.productId, 10);
      const res = await addItemToStoreCart(token || undefined, { id: targetId, quantity: want.quantity }, nonce);
      token = res.cartToken || token;
      nonce = res.nonce ?? nonce;
      diff.added += 1;
      diff.details.push({ action: 'add', key, quantity: want.quantity });
    }
  }

  const final = await fetchStoreCart(token || undefined);
  token = final.cartToken || token;
  nonce = final.nonce ?? nonce;
  const verified = normalizeWooItems(final.cart.items);

  const problems: string[] = [];
  for (const [key, want] of wanted) {
    const got = verified.get(key);
    if (!got) problems.push(`missing ${key}`);
    else if (got.quantity !== want.quantity) problems.push(`quantity ${key}: want ${want.quantity}, got ${got.quantity}`);
  }
  for (const [key] of verified) {
    if (!wanted.has(key)) problems.push(`surplus ${key}`);
  }
  if (problems.length > 0) {
    throw new Error(`Cart reconciliation failed: ${problems.join('; ')}`);
  }

  return {
    cart: final.cart,
    cartToken: token,
    raw: final.raw,
    ...(nonce ? { nonce } : {}),
    diff,
  };
}


