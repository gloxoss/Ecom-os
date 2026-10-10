import { DEFAULT_RFQ_POLICY } from './policy';
import type { RfqPolicy, RfqItem, RfqContact, RfqConsent } from './types';

export interface RfqSubmitInput {
  idempotencyKey: string;
  items: RfqItem[];
  contact: RfqContact;
  consents: RfqConsent[];
  notes?: string;
}

export interface ValidatedSubmitResult {
  valid: boolean;
  errors: string[];
  sanitized?: RfqSubmitInput;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRfqSubmitInput(
  input: unknown,
  policy: RfqPolicy = DEFAULT_RFQ_POLICY
): ValidatedSubmitResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Request body must be a valid JSON object'] };
  }

  const payload = input as Partial<RfqSubmitInput>;

  // 1. Idempotency Key validation
  if (!payload.idempotencyKey || typeof payload.idempotencyKey !== 'string' || payload.idempotencyKey.trim().length === 0) {
    errors.push('A non-empty idempotencyKey is required for duplicate-safe submission');
  }

  // 2. Contact validation (Guest B2B / B2C)
  if (!payload.contact || typeof payload.contact !== 'object') {
    errors.push('Contact information is required');
  } else {
    if (!payload.contact.name || typeof payload.contact.name !== 'string' || payload.contact.name.trim().length === 0) {
      errors.push('Contact name is required');
    }
    if (!payload.contact.email || typeof payload.contact.email !== 'string' || !EMAIL_REGEX.test(payload.contact.email.trim())) {
      errors.push('A valid contact email address is required');
    }
  }

  // 3. Items validation
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('Quote basket must contain at least one item');
  } else {
    if (payload.items.length > policy.maxLineItems) {
      errors.push(`Quote items count (${payload.items.length}) exceeds maximum limit of ${policy.maxLineItems}`);
    }
    for (let i = 0; i < payload.items.length; i++) {
      const item = payload.items[i];
      if (!item || (!item.productId && item.productId !== 0)) {
        errors.push(`Item at index ${i} must specify a valid productId`);
      }
      if (!item || typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Item at index ${i} must have a positive quantity`);
      } else if (item.quantity > policy.maxQuantityPerLine) {
        errors.push(`Item quantity ${item.quantity} exceeds maximum per-line limit of ${policy.maxQuantityPerLine}`);
      }
    }
  }

  // 4. Consents validation
  const grantedConsentIds = new Set(
    Array.isArray(payload.consents)
      ? payload.consents.map(c => c && c.consentId)
      : []
  );

  for (const requiredId of policy.requiredConsentIds) {
    if (!grantedConsentIds.has(requiredId)) {
      errors.push(`Required legal consent "${requiredId}" was not granted`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Return sanitized object
  const contact = payload.contact!;
  const sanitized: RfqSubmitInput = {
    idempotencyKey: payload.idempotencyKey!.trim(),
    contact: {
      name: contact.name.trim(),
      email: contact.email.trim().toLowerCase(),
      phone: contact.phone?.trim(),
      companyName: contact.companyName?.trim(),
      taxId: contact.taxId?.trim(),
      address: contact.address,
    },
    items: payload.items!.map(it => ({
      productId: it.productId,
      variationId: it.variationId,
      sku: it.sku?.trim(),
      title: it.title?.trim() || String(it.productId),
      quantity: Math.floor(it.quantity),
      customerNotes: it.customerNotes?.trim(),
    })),
    consents: payload.consents!.map(c => ({
      consentId: c.consentId,
      grantedAt: c.grantedAt || new Date().toISOString(),
      ipHash: c.ipHash,
    })),
    notes: payload.notes?.trim(),
  };

  return { valid: true, errors: [], sanitized };
}
