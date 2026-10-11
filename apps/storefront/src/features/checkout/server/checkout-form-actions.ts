'use server';

import { redirect } from 'next/navigation';

import { fetchCartAction, getCartToken } from '@/features/cart/server/cart-actions';
import {
  submitCheckoutAction,
  updateCustomerAddressAction,
  selectShippingRateAction,
  type CheckoutQuoteShippingPackage,
} from './checkout-actions';
import { parseCartItems, cartCoversPayload } from '../model/cart-payload';
import { validateCheckoutAddress, type CheckoutAddressInput } from '../model/address-schema';

export interface CheckoutFormState {
  ok: boolean;
  orderId?: string | number;
  status?: string;
  /**
   * HMAC-signed guest grant for the order just placed. The confirmation page takes
   * it in the URL fragment so it is never sent to a server, and exchanges it for
   * the order through the ownership-checked status endpoint.
   */
  orderToken?: string;
  error?: string;
  errors?: Record<string, string>;
}

/** COD is the only certified gateway; Stripe/CMI stay disabled at this boundary too. */
const CERTIFIED_PAYMENT_METHODS = ['cod'];

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function findRate(
  packages: CheckoutQuoteShippingPackage[] | undefined,
  rateId: string
): { rateId: string; packageId: number | string } | null {
  if (!packages || packages.length === 0) return null;

  if (rateId) {
    for (const pkg of packages) {
      const match = pkg.rates.find((rate) => rate.rate_id === rateId);
      if (match) return { rateId: match.rate_id, packageId: pkg.package_id };
    }
  }

  // No client rate (or an unknown one): honour Woo's own selection, else the first
  // rate on offer. Never invent free shipping.
  for (const pkg of packages) {
    const selected = pkg.rates.find((rate) => rate.selected);
    if (selected) return { rateId: selected.rate_id, packageId: pkg.package_id };
  }
  const firstWithRate = packages.find((pkg) => pkg.rates.length > 0);
  if (firstWithRate) {
    const first = firstWithRate.rates[0];
    if (first) return { rateId: first.rate_id, packageId: firstWithRate.package_id };
  }
  return null;
}

/**
 * Server action for the checkout form. Validates the payload, confirms the
 * authoritative cart still matches it, sets the destination and shipping rate,
 * then submits the Woo COD order. The browser never supplies a price or total.
 */
export async function submitCheckoutFormAction(
  _prev: CheckoutFormState | null,
  formData: FormData
): Promise<CheckoutFormState> {
  const parsed = parseCartItems(field(formData, 'cartItems'));
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const paymentMethod = field(formData, 'paymentMethod') || 'cod';
  if (!CERTIFIED_PAYMENT_METHODS.includes(paymentMethod)) {
    return { ok: false, error: 'payment_method_unavailable' };
  }

  const addressInput: Partial<CheckoutAddressInput> = {
    email: field(formData, 'email'),
    firstName: field(formData, 'firstName'),
    lastName: field(formData, 'lastName'),
    address1: field(formData, 'address1'),
    address2: field(formData, 'address2') || undefined,
    city: field(formData, 'city'),
    state: field(formData, 'state') || undefined,
    postcode: field(formData, 'postcode') || undefined,
    country: field(formData, 'country') || 'MA',
    phone: field(formData, 'phone'),
  };

  const validation = validateCheckoutAddress(addressInput);
  if (!validation.valid) {
    return { ok: false, error: 'validation_failed', errors: validation.errors };
  }

  const token = await getCartToken();
  if (!token) {
    return { ok: false, error: 'no_session' };
  }

  const cart = await fetchCartAction();
  if (!cart || cart.items.length === 0) {
    return { ok: false, error: 'empty_cart' };
  }
  if (!cartCoversPayload(parsed.lines, cart.items)) {
    return { ok: false, error: 'cart_out_of_sync' };
  }

  // Setting the destination makes Woo return its shipping packages and recomputed totals.
  const quote = await updateCustomerAddressAction(addressInput);
  if (!quote.ok) {
    return { ok: false, error: quote.error || 'address_rejected' };
  }

  const rate = findRate(quote.shippingPackages, field(formData, 'shippingMethod'));
  if (rate) {
    const selection = await selectShippingRateAction(rate.rateId, rate.packageId);
    if (!selection.ok) {
      return { ok: false, error: selection.error || 'shipping_selection_failed' };
    }
  }

  const result = await submitCheckoutAction(addressInput);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error || 'checkout_failed',
      ...(result.errors ? { errors: result.errors } : {}),
    };
  }

  // Redirect rather than returning a success state. Placing the order clears the
  // Cart-Token cookie, so this route re-renders with no cart and its empty-cart branch
  // would replace the form (and the confirmation) before any client effect ran. A
  // server redirect cannot be raced that way. The guest grant travels in the URL
  // fragment, which a browser never sends to a server.
  const query = new URLSearchParams();
  if (result.orderId !== undefined) query.set('order', String(result.orderId));
  if (result.status) query.set('status', result.status);
  const fragment = result.orderToken ? `#token=${encodeURIComponent(result.orderToken)}` : '';
  redirect(`/checkout/success?${query.toString()}${fragment}`);
}
