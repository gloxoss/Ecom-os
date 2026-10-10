'use server';

import { getEngine } from '@/lib/engine';
import { getCartToken } from '@/features/cart/server/cart-actions';
import { Coupon, ShippingMethod, Cart } from '@ecom-os/engine';
import {
  CheckoutAddressInput,
  AddressValidationResult,
  validateCheckoutAddress,
} from '../model/address-schema';

export interface CheckoutQuoteShippingRate {
  rate_id: string;
  name: string;
  description?: string;
  delivery_time?: string;
  price_minor: number;
  taxes_minor: number;
  selected: boolean;
  currency: string;
}

export interface CheckoutQuoteShippingPackage {
  package_id: number | string;
  name: string;
  rates: CheckoutQuoteShippingRate[];
}

export interface CheckoutQuoteResult {
  ok: boolean;
  error?: string;
  errors?: Record<string, string>;
  cart?: Cart;
  shippingPackages?: CheckoutQuoteShippingPackage[];
  shippingTotal?: {
    amount_minor: number;
    currency: string;
  };
  taxTotal?: {
    amount_minor: number;
    currency: string;
  };
}

interface CheckoutQuoteEngine {
  updateCustomerAddress?: (
    cartId: string,
    input: {
      billing_address?: Record<string, string>;
      shipping_address?: Record<string, string>;
    }
  ) => Promise<{
    cart: Cart;
    shippingPackages: CheckoutQuoteShippingPackage[];
    shippingTotal: { amount_minor: number; currency: string };
    taxTotal: { amount_minor: number; currency: string };
  }>;
  selectShippingRate?: (
    cartId: string,
    rateId: string,
    packageId?: number | string
  ) => Promise<{
    cart: Cart;
    shippingPackages: CheckoutQuoteShippingPackage[];
    shippingTotal: { amount_minor: number; currency: string };
    taxTotal: { amount_minor: number; currency: string };
  }>;
}

export async function validateCouponAction(code: string): Promise<Coupon | null> {
  const engine = await getEngine();
  if (engine.validateCoupon) {
    return engine.validateCoupon(code);
  }
  return null;
}

export async function listShippingMethodsAction(countryCode?: string): Promise<ShippingMethod[]> {
  const engine = await getEngine();
  if (engine.listShippingMethods) {
    return engine.listShippingMethods(countryCode);
  }
  return [];
}

export async function updateCustomerAddressAction(
  input: Partial<CheckoutAddressInput>
): Promise<CheckoutQuoteResult> {
  const validation: AddressValidationResult = validateCheckoutAddress(input);
  if (!validation.valid) {
    return {
      ok: false,
      error: 'validation_failed',
      errors: validation.errors,
    };
  }

  const token = await getCartToken();
  if (!token) {
    return {
      ok: false,
      error: 'no_session',
    };
  }

  const engine = (await getEngine()) as unknown as CheckoutQuoteEngine;
  if (typeof engine.updateCustomerAddress !== 'function') {
    return {
      ok: false,
      error: 'unsupported_engine',
    };
  }

  try {
    const addressPayload = {
      first_name: input.firstName || '',
      last_name: input.lastName || '',
      address_1: input.address1 || '',
      address_2: input.address2 || '',
      city: input.city || '',
      state: input.state || '',
      postcode: input.postcode || '',
      country: input.country || 'MA',
      email: input.email || '',
      phone: input.phone || '',
    };

    const quote = await engine.updateCustomerAddress(token, {
      billing_address: addressPayload,
      shipping_address: addressPayload,
    });

    return {
      ok: true,
      cart: quote.cart,
      shippingPackages: quote.shippingPackages,
      shippingTotal: quote.shippingTotal,
      taxTotal: quote.taxTotal,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown quote error';
    return {
      ok: false,
      error: message,
    };
  }
}

export async function selectShippingRateAction(
  rateId: string,
  packageId: number | string = 0
): Promise<CheckoutQuoteResult> {
  const token = await getCartToken();
  if (!token) {
    return {
      ok: false,
      error: 'no_session',
    };
  }

  const engine = (await getEngine()) as unknown as CheckoutQuoteEngine;
  if (typeof engine.selectShippingRate !== 'function') {
    return {
      ok: false,
      error: 'unsupported_engine',
    };
  }

  try {
    const quote = await engine.selectShippingRate(token, rateId, packageId);
    return {
      ok: true,
      cart: quote.cart,
      shippingPackages: quote.shippingPackages,
      shippingTotal: quote.shippingTotal,
      taxTotal: quote.taxTotal,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown shipping selection error';
    return {
      ok: false,
      error: message,
    };
  }
}
