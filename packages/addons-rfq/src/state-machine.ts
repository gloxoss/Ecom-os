import type {
  RfqState,
  Actor,
  ActorRole,
  RfqQuote,
  OfferRevision,
  OfferLineItem,
} from './types';

export class IllegalTransitionError extends Error {
  constructor(from: RfqState, to: RfqState, reason?: string) {
    super(`Illegal transition from "${from}" to "${to}"${reason ? `: ${reason}` : ''}`);
    this.name = 'IllegalTransitionError';
  }
}

export class UnauthorizedActorError extends Error {
  constructor(actorRole: ActorRole, targetState: RfqState, reason?: string) {
    super(`Actor with role "${actorRole}" is not authorized to transition to "${targetState}"${reason ? `: ${reason}` : ''}`);
    this.name = 'UnauthorizedActorError';
  }
}

export class StaleRevisionError extends Error {
  constructor(attemptedRevId: string, currentRevId: string) {
    super(`Attempted to accept stale or superseded offer revision "${attemptedRevId}". Active revision is "${currentRevId}".`);
    this.name = 'StaleRevisionError';
  }
}

export class ExpiredQuoteError extends Error {
  constructor(quoteId: string, expiresAt: string) {
    super(`Quote "${quoteId}" has expired at ${expiresAt} and cannot be accepted.`);
    this.name = 'ExpiredQuoteError';
  }
}

export class UnverifiedContactError extends Error {
  constructor(quoteId: string) {
    super(`Quote "${quoteId}" contact is unverified and requires email verification before transition.`);
    this.name = 'UnverifiedContactError';
  }
}

const ALLOWED_TRANSITIONS: Record<RfqState, RfqState[]> = {
  draft: ['submitted'],
  submitted: ['verified', 'offer_created', 'rejected', 'expired'],
  verified: ['offer_created', 'rejected', 'expired'],
  offer_created: ['revised', 'accepted', 'rejected', 'expired', 'revision_requested'],
  revised: ['revised', 'accepted', 'rejected', 'expired', 'revision_requested'],
  revision_requested: ['revised', 'rejected', 'expired'],
  accepted: ['converted', 'expired'],
  rejected: [],
  expired: [],
  converted: [],
};

const ACTOR_PERMISSIONS: Record<RfqState, ActorRole[]> = {
  draft: ['guest', 'system'],
  submitted: ['guest', 'system'],
  verified: ['guest', 'operator', 'administrator', 'system'],
  offer_created: ['operator', 'administrator'],
  revised: ['operator', 'administrator'],
  revision_requested: ['guest', 'operator', 'administrator'],
  accepted: ['guest', 'administrator'],
  rejected: ['guest', 'operator', 'administrator', 'system'],
  expired: ['system', 'operator', 'administrator'],
  converted: ['operator', 'administrator', 'system'],
};

export function canTransition(currentState: RfqState, targetState: RfqState, actor: Actor): boolean {
  const allowedNext = ALLOWED_TRANSITIONS[currentState] || [];
  if (!allowedNext.includes(targetState)) {
    return false;
  }
  const allowedActors = ACTOR_PERMISSIONS[targetState] || [];
  return allowedActors.includes(actor.role);
}

export interface TransitionPayload {
  // Verification
  verificationToken?: string;
  // Offer creation / revision
  lines?: OfferLineItem[];
  currency?: string;
  expiresAt?: string;
  termsAndConditions?: string;
  staffNotes?: string;
  // Acceptance
  revisionId?: string;
  // Rejection
  reason?: string;
  // Order conversion
  orderId?: string | number;
  // Timestamp override (testing)
  currentTime?: string;
}

export function transition(
  quote: RfqQuote,
  targetState: RfqState,
  actor: Actor,
  payload: TransitionPayload = {}
): RfqQuote {
  const now = payload.currentTime || new Date().toISOString();

  // 1. Basic transition rule check
  const allowedNext = ALLOWED_TRANSITIONS[quote.state] || [];
  if (!allowedNext.includes(targetState)) {
    throw new IllegalTransitionError(quote.state, targetState);
  }

  // 2. Role permission check
  const allowedRoles = ACTOR_PERMISSIONS[targetState] || [];
  if (!allowedRoles.includes(actor.role)) {
    throw new UnauthorizedActorError(actor.role, targetState);
  }

  // 3. State-specific validation & business invariant enforcement
  let updatedQuote: RfqQuote = {
    ...quote,
    state: targetState,
    updatedAt: now,
  };

  switch (targetState) {
    case 'submitted': {
      if (!quote.items || quote.items.length === 0) {
        throw new IllegalTransitionError(quote.state, targetState, 'Quote basket must contain at least one item');
      }
      if (!quote.contact || !quote.contact.email || !quote.contact.name) {
        throw new IllegalTransitionError(quote.state, targetState, 'Valid contact name and email are required');
      }
      break;
    }

    case 'verified': {
      // Invariant: Verify contact email
      updatedQuote.isContactVerified = true;
      break;
    }

    case 'offer_created':
    case 'revised': {
      if (!payload.lines || payload.lines.length === 0) {
        throw new IllegalTransitionError(quote.state, targetState, 'Offer must contain priced lines');
      }
      if (!payload.expiresAt) {
        throw new IllegalTransitionError(quote.state, targetState, 'Offer must contain an expiration date');
      }
      if (new Date(payload.expiresAt).getTime() <= new Date(now).getTime()) {
        throw new IllegalTransitionError(quote.state, targetState, 'Offer expiration date must be in the future');
      }

      // Deactivate prior revisions
      const updatedRevisions = (quote.revisions || []).map(r => ({
        ...r,
        isCurrent: false,
      }));

      const newRevNum = updatedRevisions.length + 1;
      const revisionId = `rev_${newRevNum}`;

      // Calculate totals
      let subtotalExclTax = 0;
      let totalTax = 0;
      let totalInclTax = 0;

      for (const line of payload.lines) {
        subtotalExclTax += line.totalExclTax;
        totalTax += line.taxAmount;
        totalInclTax += line.totalInclTax;
      }

      const newRevision: OfferRevision = {
        revisionId,
        revisionNumber: newRevNum,
        createdAt: now,
        createdBy: {
          staffId: actor.id,
          staffName: actor.email || 'Staff Operator',
        },
        expiresAt: payload.expiresAt,
        currency: payload.currency || 'USD',
        lines: payload.lines,
        subtotalExclTax,
        totalTax,
        totalInclTax,
        termsAndConditions: payload.termsAndConditions,
        staffNotes: payload.staffNotes,
        isCurrent: true,
      };

      updatedQuote.revisions = [...updatedRevisions, newRevision];
      updatedQuote.currentRevisionId = revisionId;
      updatedQuote.expiresAt = payload.expiresAt;
      break;
    }

    case 'accepted': {
      // Guest ownership invariant: guest actor must match quote
      if (actor.role === 'guest' && actor.id !== quote.accessSecretHash) {
        throw new UnauthorizedActorError(actor.role, targetState, 'Guest access token does not own this quote');
      }

      // Check expiration
      if (quote.expiresAt && new Date(now).getTime() > new Date(quote.expiresAt).getTime()) {
        throw new ExpiredQuoteError(quote.id, quote.expiresAt);
      }

      // Stale revision invariant
      if (!payload.revisionId) {
        throw new IllegalTransitionError(quote.state, targetState, 'Must specify revisionId to accept');
      }
      if (payload.revisionId !== quote.currentRevisionId) {
        throw new StaleRevisionError(payload.revisionId, quote.currentRevisionId || 'none');
      }
      break;
    }

    case 'rejected': {
      if (payload.reason) {
        updatedQuote.rejectionReason = payload.reason;
      }
      break;
    }

    case 'revision_requested': {
      if (payload.staffNotes) {
        updatedQuote.customerRevisionNotes = payload.staffNotes;
      }
      break;
    }

    case 'expired': {
      // Automatic system expiry: verify expiration timestamp has passed unless admin manual expire
      if (actor.role === 'system') {
        if (quote.expiresAt && new Date(now).getTime() < new Date(quote.expiresAt).getTime()) {
          throw new IllegalTransitionError(quote.state, targetState, `Quote has not expired yet (${quote.expiresAt})`);
        }
      }
      break;
    }

    case 'converted': {
      if (!payload.orderId) {
        throw new IllegalTransitionError(quote.state, targetState, 'Converted order ID is required');
      }
      updatedQuote.convertedOrderId = payload.orderId;
      break;
    }
  }

  return updatedQuote;
}
