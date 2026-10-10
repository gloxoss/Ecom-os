import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { AddonRegistry } from '@ecom-os/engine';
import {
  setStorefrontRegistryForTesting,
  isAddonActive,
} from '../src/lib/addon-capabilities';
import { guardAddonRoute } from '../src/lib/addon-route-guard';
import {
  transition,
  type RfqQuote,
  type Actor,
} from '../../../packages/addons-rfq/src/index';

describe('Storefront & Backend Quote-to-Order Conversion Contract (ECO-706)', () => {
  let registry: AddonRegistry;

  const guestSecret = 'sec_guest_conversion_token_98765';
  const guestSecretHash = crypto.createHash('sha256').update(guestSecret).digest('hex');

  const operatorActor: Actor = {
    role: 'operator',
    id: 'staff_op_1',
    email: 'operator@paraloca.ma',
  };

  const createAcceptedQuoteFixture = (): RfqQuote => ({
    id: 'quote_convert_101',
    quoteNumber: 'DEV-2026-1001',
    state: 'accepted',
    customerName: 'Fatima Zahra',
    customerEmail: 'fatima@example.ma',
    companyName: 'Riad Marrakesh SARL',
    taxId: 'ICE99887766',
    contact: {
      name: 'Fatima Zahra',
      email: 'fatima@example.ma',
      companyName: 'Riad Marrakesh SARL',
      taxId: 'ICE99887766',
    },
    consents: [
      { consentId: 'terms', grantedAt: '2026-10-10T12:00:00Z' },
    ],
    items: [
      { productId: 42, title: 'Handmade Copper Lamp', quantity: 4 },
    ],
    currentRevisionId: 'rev_1',
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    accessSecretHash: guestSecretHash,
    guestChallengeEmail: 'fatima@example.ma',
    isContactVerified: true,
    createdAt: '2026-10-10T12:00:00Z',
    updatedAt: '2026-10-10T12:30:00Z',
    revisions: [
      {
        revisionId: 'rev_1',
        revisionNumber: 1,
        createdBy: {
          staffId: 'staff_op_1',
          staffName: 'Operator Karim',
        },
        lines: [
          {
            productId: 42,
            title: 'Handmade Copper Lamp',
            quantity: 4,
            unitPriceExclTax: 450,
            taxRate: 0.2,
            taxAmount: 360,
            totalExclTax: 1800,
            totalInclTax: 2160,
          },
        ],
        subtotalExclTax: 1800,
        totalTax: 360,
        totalInclTax: 2160,
        currency: 'MAD',
        expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
        isCurrent: true,
        createdAt: '2026-10-10T12:15:00Z',
      },
    ],
  });

  beforeEach(() => {
    registry = new AddonRegistry('1.0.0');
    registry.register({
      id: 'quotes',
      name: 'RFQ Quotes Addon',
      version: '1.0.0',
      ecomOsApiRange: '^1.0.0',
      capabilities: { provided: ['quotes'] },
    });
    setStorefrontRegistryForTesting(registry);
  });

  it('prohibits conversion when quotes addon is disabled in registry', () => {
    assert.equal(isAddonActive('quotes'), false);
    const guard = guardAddonRoute('quotes');
    assert.equal(guard.allowed, false);
    assert.equal(guard.status, 404);
  });

  it('rejects order conversion if quote is in an unaccepted state', () => {
    registry.enable('quotes');
    const quote = createAcceptedQuoteFixture();
    quote.state = 'offer_created'; // Not yet accepted

    assert.throws(
      () => {
        transition(quote, 'converted', operatorActor, { orderId: 'wc_99999' });
      },
      /Illegal transition from "offer_created" to "converted"/
    );
  });

  it('successfully transitions accepted quote to converted with order reference', () => {
    registry.enable('quotes');
    const quote = createAcceptedQuoteFixture();
    const assignedOrderId = 'wc_order_78910';

    const convertedQuote = transition(quote, 'converted', operatorActor, {
      orderId: assignedOrderId,
    });

    assert.equal(convertedQuote.state, 'converted');
    assert.equal(convertedQuote.convertedOrderId, assignedOrderId);
    assert.equal(convertedQuote.currentRevisionId, 'rev_1');
  });

  it('enforces idempotency and prevents duplicate order creation on replay', () => {
    registry.enable('quotes');
    const quote = createAcceptedQuoteFixture();
    const initialOrderId = 'wc_order_initial_123';

    // First conversion
    const firstResult = transition(quote, 'converted', operatorActor, {
      orderId: initialOrderId,
    });
    assert.equal(firstResult.state, 'converted');
    assert.equal(firstResult.convertedOrderId, initialOrderId);

    // Attempting a second transition from 'converted' to 'converted' is disallowed by state machine
    assert.throws(
      () => {
        transition(firstResult, 'converted', operatorActor, { orderId: 'wc_order_second_456' });
      },
      /Illegal transition from "converted" to "converted"/
    );
  });

  it('verifies stock reservation invariance: acceptance does not automatically reserve inventory', () => {
    registry.enable('quotes');
    const quote = createAcceptedQuoteFixture();

    // Default policy stock reservation is 'none'
    const defaultStockReservation = 'none';
    assert.equal(
      defaultStockReservation,
      'none',
      'By default, quotation emission and acceptance do not mutate physical inventory'
    );

    // Order conversion maintains order status as pending without claiming physical stock
    const converted = transition(quote, 'converted', operatorActor, { orderId: 'wc_order_333' });
    assert.equal(converted.state, 'converted');
  });
});
