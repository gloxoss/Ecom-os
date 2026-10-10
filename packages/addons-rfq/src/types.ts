export type RfqState =
  | 'draft'
  | 'submitted'
  | 'verified'
  | 'offer_created'
  | 'revised'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted';

export type ActorRole = 'guest' | 'operator' | 'administrator' | 'system';

export interface Actor {
  role: ActorRole;
  id: string;
  email?: string;
  capabilities?: string[];
}

export interface RfqContact {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  taxId?: string; // B2B registration / ICE / SIRET
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface RfqConsent {
  consentId: string;
  grantedAt: string;
  ipHash?: string;
}

export interface RfqItem {
  productId: string | number;
  variationId?: string | number;
  sku?: string;
  title: string;
  quantity: number;
  customerNotes?: string;
}

export interface OfferLineItem extends RfqItem {
  unitPriceExclTax: number;
  taxRate: number;
  taxAmount: number;
  totalExclTax: number;
  totalInclTax: number;
}

export interface OfferRevision {
  revisionId: string;
  revisionNumber: number;
  createdAt: string;
  createdBy: {
    staffId: string;
    staffName: string;
  };
  expiresAt: string;
  currency: string;
  lines: OfferLineItem[];
  subtotalExclTax: number;
  totalTax: number;
  totalInclTax: number;
  termsAndConditions?: string;
  staffNotes?: string;
  isCurrent: boolean;
}

export interface RfqQuote {
  id: string;
  quoteNumber: string;
  state: RfqState;
  contact: RfqContact;
  consents: RfqConsent[];
  items: RfqItem[];
  revisions: OfferRevision[];
  currentRevisionId?: string;
  accessSecretHash: string;
  guestChallengeEmail: string;
  isContactVerified: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  convertedOrderId?: string | number;
  rejectionReason?: string;
  clientConfigKey?: string;
}

export interface RfqPolicy {
  defaultExpirationDays: number;
  requireContactVerification: boolean;
  dataRetentionDays: number;
  maxLineItems: number;
  maxQuantityPerLine: number;
  stockReservation: 'none' | 'on_acceptance' | 'manual';
  requiredConsentIds: string[];
}
