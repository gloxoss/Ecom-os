export interface ParaLocaRfqPolicy {
  enabled: boolean;
  minItems: number;
  maxItemsPerQuote: number;
  responseTimeHours: number;
  targetAudience: string;
  termsUrl: string;
  contactEmail: string;
  defaultRevisionValidityDays: number;
  stockReservationPolicy: 'none' | 'on_offer' | 'on_acceptance';
}

/**
 * ParaLoca B2B RFQ Commercial & Privacy Policy.
 * Invariant: By default, RFQ submission and offer generation
 * place zero financial holds and zero premature stock reservations.
 */
export const defaultParaLocaRfqPolicy: ParaLocaRfqPolicy = {
  enabled: true,
  minItems: 1,
  maxItemsPerQuote: 50,
  responseTimeHours: 24,
  targetAudience:
    'Professionnels de santé, cliniques, cabinets médicaux, centres de soins et établissements hospitaliers au Maroc.',
  termsUrl: '/legal/conditions-devis',
  contactEmail: 'devis@paraloca.ma',
  defaultRevisionValidityDays: 14,
  stockReservationPolicy: 'none',
};

export function validateRfqPolicy(policy: unknown): ParaLocaRfqPolicy {
  if (typeof policy !== 'object' || policy === null) {
    throw new Error('RFQ policy must be a non-null object');
  }
  const p = policy as Partial<ParaLocaRfqPolicy>;
  if (typeof p.enabled !== 'boolean' || typeof p.minItems !== 'number' || !p.contactEmail) {
    throw new Error('RFQ policy is missing mandatory fields (enabled, minItems, contactEmail)');
  }
  if (!p.contactEmail.includes('@')) {
    throw new Error('RFQ policy contactEmail must be a valid email address');
  }
  return p as ParaLocaRfqPolicy;
}
