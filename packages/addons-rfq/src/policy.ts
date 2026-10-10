import type { RfqPolicy, RfqItem, RfqContact, RfqConsent, RfqQuote } from './types';

export const DEFAULT_RFQ_POLICY: RfqPolicy = {
  defaultExpirationDays: 30,
  requireContactVerification: true,
  dataRetentionDays: 365,
  maxLineItems: 50,
  maxQuantityPerLine: 10000,
  stockReservation: 'none', // Strict invariant: No automatic stock reservation
  requiredConsentIds: ['terms_and_conditions', 'privacy_consent'],
};

export interface QuoteValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateQuoteSubmission(
  input: {
    items: RfqItem[];
    contact: RfqContact;
    consents: RfqConsent[];
  },
  policy: RfqPolicy = DEFAULT_RFQ_POLICY
): QuoteValidationResult {
  const errors: string[] = [];

  // 1. Items validation
  if (!input.items || input.items.length === 0) {
    errors.push('Quote basket must contain at least one item');
  } else {
    if (input.items.length > policy.maxLineItems) {
      errors.push(`Quote items exceed maximum limit of ${policy.maxLineItems}`);
    }
    for (const item of input.items) {
      if (!item.productId) {
        errors.push('All quote items must specify a valid productId');
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Invalid quantity ${item.quantity} for item "${item.title || item.productId}"`);
      } else if (item.quantity > policy.maxQuantityPerLine) {
        errors.push(`Item quantity ${item.quantity} exceeds maximum per-line limit of ${policy.maxQuantityPerLine}`);
      }
    }
  }

  // 2. Contact validation (Guest B2B/B2C without customer login)
  if (!input.contact) {
    errors.push('Contact information is required');
  } else {
    if (!input.contact.name || input.contact.name.trim().length === 0) {
      errors.push('Contact name is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!input.contact.email || !emailRegex.test(input.contact.email.trim())) {
      errors.push('A valid contact email address is required');
    }
  }

  // 3. Mandatory legal consent validation
  const grantedConsentIds = new Set((input.consents || []).map(c => c.consentId));
  for (const requiredId of policy.requiredConsentIds) {
    if (!grantedConsentIds.has(requiredId)) {
      errors.push(`Required consent "${requiredId}" was not granted`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function calculateExpirationDate(
  fromDate: Date = new Date(),
  policy: RfqPolicy = DEFAULT_RFQ_POLICY
): Date {
  const expires = new Date(fromDate.getTime());
  expires.setDate(expires.getDate() + policy.defaultExpirationDays);
  return expires;
}

export interface StockReservationInstruction {
  shouldReserve: boolean;
  reservationMode: 'none' | 'on_acceptance' | 'manual';
  reason: string;
}

/**
 * Architectural Invariant: Acceptance of an RFQ offer does NOT automatically reserve stock
 * unless explicitly configured by the merchant in client policy.
 */
export function evaluateStockReservationPolicy(
  quote: RfqQuote,
  policy: RfqPolicy = DEFAULT_RFQ_POLICY
): StockReservationInstruction {
  if (policy.stockReservation === 'none') {
    return {
      shouldReserve: false,
      reservationMode: 'none',
      reason: 'Policy specifies zero stock reservation. Inventory remains available until WooCommerce order conversion.',
    };
  }

  if (policy.stockReservation === 'on_acceptance') {
    if (quote.state === 'accepted') {
      return {
        shouldReserve: true,
        reservationMode: 'on_acceptance',
        reason: 'Policy specifies stock hold upon formal customer quote acceptance.',
      };
    }
    return {
      shouldReserve: false,
      reservationMode: 'on_acceptance',
      reason: 'Quote is not yet in accepted state; stock remains unreserved.',
    };
  }

  return {
    shouldReserve: false,
    reservationMode: 'manual',
    reason: 'Manual stock reservation mode requires operator intervention.',
  };
}

export interface DataRetentionEvaluation {
  isEligibleForPurge: boolean;
  retentionExpiresAt: Date;
  reason: string;
}

export function evaluateDataRetention(
  quote: RfqQuote,
  currentTime: Date = new Date(),
  policy: RfqPolicy = DEFAULT_RFQ_POLICY
): DataRetentionEvaluation {
  const baseDateStr = quote.updatedAt || quote.createdAt;
  const baseDate = new Date(baseDateStr);
  const retentionExpiresAt = new Date(baseDate.getTime());
  retentionExpiresAt.setDate(retentionExpiresAt.getDate() + policy.dataRetentionDays);

  const isExpiredTime = currentTime.getTime() >= retentionExpiresAt.getTime();

  if (quote.state === 'rejected' || quote.state === 'expired') {
    return {
      isEligibleForPurge: isExpiredTime,
      retentionExpiresAt,
      reason: isExpiredTime
        ? `Quote in terminal state "${quote.state}" exceeded data retention period of ${policy.dataRetentionDays} days.`
        : `Terminal state "${quote.state}" within ${policy.dataRetentionDays} day retention window.`,
    };
  }

  // Active or converted quotes are preserved for audit / conversion reference
  return {
    isEligibleForPurge: false,
    retentionExpiresAt,
    reason: `Quote in state "${quote.state}" is not eligible for automated purge.`,
  };
}
