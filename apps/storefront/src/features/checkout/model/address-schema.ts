export interface CheckoutAddressInput {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postcode?: string;
  country: string;
  phone: string;
}

export interface AddressValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export const SUPPORTED_CHECKOUT_COUNTRIES = ['MA', 'FR'] as const;
export type SupportedCheckoutCountry = typeof SUPPORTED_CHECKOUT_COUNTRIES[number];

export function validateCheckoutAddress(input: Partial<CheckoutAddressInput>): AddressValidationResult {
  const errors: Record<string, string> = {};

  const email = (input.email || '').trim();
  if (!email) {
    errors.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please provide a valid email address';
  }

  const firstName = (input.firstName || '').trim();
  if (!firstName || firstName.length > 50) {
    errors.firstName = 'First name is required (max 50 characters)';
  }

  const lastName = (input.lastName || '').trim();
  if (!lastName || lastName.length > 50) {
    errors.lastName = 'Last name is required (max 50 characters)';
  }

  const address1 = (input.address1 || '').trim();
  if (!address1 || address1.length < 3 || address1.length > 100) {
    errors.address1 = 'Street address is required (3-100 characters)';
  }

  const city = (input.city || '').trim();
  if (!city || city.length < 2 || city.length > 50) {
    errors.city = 'City is required (2-50 characters)';
  }

  const country = (input.country || '').trim().toUpperCase();
  if (!country || !SUPPORTED_CHECKOUT_COUNTRIES.includes(country as SupportedCheckoutCountry)) {
    errors.country = `Country must be one of: ${SUPPORTED_CHECKOUT_COUNTRIES.join(', ')}`;
  }

  const phone = (input.phone || '').trim();
  if (!phone) {
    errors.phone = 'Phone number is required';
  } else if (!/^\+?[\d\s-]{8,20}$/.test(phone)) {
    errors.phone = 'Please provide a valid phone number';
  }

  const postcode = (input.postcode || '').trim();
  if (country === 'FR') {
    if (!postcode || !/^\d{5}$/.test(postcode)) {
      errors.postcode = 'French postal code must be exactly 5 digits';
    }
  } else if (country === 'MA' && postcode) {
    if (!/^\d{5}$/.test(postcode)) {
      errors.postcode = 'Moroccan postal code must be 5 digits if provided';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

