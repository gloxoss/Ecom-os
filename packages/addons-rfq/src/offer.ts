import type { OfferLineItem, OfferRevision, RfqQuote } from './types';

export interface OfferCalculationResult {
  subtotalExclTax: number;
  totalTax: number;
  totalInclTax: number;
  lines: OfferLineItem[];
}

export function calculateOfferLineTotals(
  line: {
    productId: string | number;
    variationId?: string | number;
    sku?: string;
    title: string;
    quantity: number;
    unitPriceExclTax: number;
    taxRate: number; // e.g. 0.20 for 20%
    customerNotes?: string;
  }
): OfferLineItem {
  const qty = Math.max(1, line.quantity);
  const unitPrice = Math.max(0, line.unitPriceExclTax);
  const taxRate = Math.max(0, line.taxRate);

  const totalExclTax = Math.round(unitPrice * qty * 100) / 100;
  const taxAmount = Math.round(totalExclTax * taxRate * 100) / 100;
  const totalInclTax = Math.round((totalExclTax + taxAmount) * 100) / 100;

  return {
    productId: line.productId,
    variationId: line.variationId,
    sku: line.sku,
    title: line.title,
    quantity: qty,
    unitPriceExclTax: unitPrice,
    taxRate,
    taxAmount,
    totalExclTax,
    totalInclTax,
    customerNotes: line.customerNotes,
  };
}

export function calculateOfferTotals(lines: OfferLineItem[]): {
  subtotalExclTax: number;
  totalTax: number;
  totalInclTax: number;
} {
  let subtotalExclTax = 0;
  let totalTax = 0;
  let totalInclTax = 0;

  for (const line of lines) {
    subtotalExclTax += line.totalExclTax;
    totalTax += line.taxAmount;
    totalInclTax += line.totalInclTax;
  }

  return {
    subtotalExclTax: Math.round(subtotalExclTax * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    totalInclTax: Math.round(totalInclTax * 100) / 100,
  };
}

export function validateOfferInput(
  input: {
    lines: OfferLineItem[];
    expiresAt: string;
    currency?: string;
  },
  now: Date = new Date()
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    errors.push('Offer must contain at least one priced line item');
  } else {
    for (let i = 0; i < input.lines.length; i++) {
      const line = input.lines[i]!;
      if (line.unitPriceExclTax < 0) {
        errors.push(`Line item at index ${i} has negative unit price`);
      }
      if (line.quantity <= 0) {
        errors.push(`Line item at index ${i} has non-positive quantity`);
      }
    }
  }

  if (!input.expiresAt) {
    errors.push('Offer must specify an expiration timestamp');
  } else {
    const expTime = new Date(input.expiresAt).getTime();
    if (isNaN(expTime)) {
      errors.push('Expiration timestamp is invalid');
    } else if (expTime <= now.getTime()) {
      errors.push('Expiration date must be in the future');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isRevisionCurrent(quote: RfqQuote, revisionId: string): boolean {
  return quote.currentRevisionId === revisionId;
}

export function isOfferExpired(expiresAt: string, now: Date = new Date()): boolean {
  const expTime = new Date(expiresAt).getTime();
  if (isNaN(expTime)) return true;
  return now.getTime() >= expTime;
}
