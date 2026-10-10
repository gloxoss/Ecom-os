import { describe, it, expect } from 'vitest';
import {
  registerGateway,
  getGateway,
  getEnabledGateways,
  isGatewayCertified,
} from '../registry';
import { CodGateway } from '../providers/cod/provider';
import { StripeGateway } from '../providers/stripe/provider';
import { CmiGateway } from '../providers/cmi/provider';
import type { Order } from '@ecom-os/engine';

describe('Payment Provider Capability & Certification Contract (ECO-205)', () => {
  const dummyOrder: Order = {
    id: '101',
    status: 'pending',
    total: { amount_minor: 5000, currency: 'MAD' },
    items: [],
    customer: { id: '0', email: 'guest@example.com', firstName: 'Guest', lastName: 'User' },
  };

  describe('Certified COD Provider', () => {
    it('is registered and certified by default', () => {
      expect(isGatewayCertified('cod')).toBe(true);
      const gw = getGateway('cod');
      expect(gw).toBeDefined();
      expect(gw?.id).toBe('cod');
      expect(gw?.name).toBe('Cash on Delivery');
    });

    it('initiates without redirect or client card elements', async () => {
      const res = await CodGateway.initiate(dummyOrder);
      expect(res.type).toBe('pending');
      if (res.type === 'pending') {
        expect(res.message).toContain('confirmed upon delivery');
      }
    });

    it('confirms delivery-time payment successfully', async () => {
      const conf = await CodGateway.confirm({});
      expect(conf.success).toBe(true);
    });
  });

  describe('Fail-Closed Gateways (Stripe, CMI)', () => {
    it('marks online providers as uncertified by default', () => {
      expect(isGatewayCertified('stripe')).toBe(false);
      expect(isGatewayCertified('cmi')).toBe(false);
      expect(isGatewayCertified('paypal')).toBe(false);
    });

    it('rejects registering uncertified gateways into active registry', () => {
      expect(() => registerGateway(StripeGateway)).toThrow(
        'Payment provider stripe is unavailable pending verified integration.'
      );
      expect(() => registerGateway(CmiGateway)).toThrow(
        'Payment provider cmi is unavailable pending verified integration.'
      );
    });

    it('returns undefined when querying uncertified gateways', () => {
      expect(getGateway('stripe')).toBeUndefined();
      expect(getGateway('cmi')).toBeUndefined();
      expect(getGateway('unknown')).toBeUndefined();
    });

    it('filters out uncertified gateways from enabled list even if set in env', () => {
      const originalEnv = process.env.PAYMENT_PROVIDERS;
      try {
        process.env.PAYMENT_PROVIDERS = 'stripe,cmi,cod,crypto';
        const enabled = getEnabledGateways();
        expect(enabled).toHaveLength(1);
        expect(enabled[0]?.id).toBe('cod');
      } finally {
        process.env.PAYMENT_PROVIDERS = originalEnv;
      }
    });

    it('fails closed if uncertified provider methods are directly invoked', async () => {
      await expect(StripeGateway.initiate(dummyOrder)).rejects.toThrow('Stripe is unavailable pending verified integration.');
      await expect(CmiGateway.initiate(dummyOrder)).rejects.toThrow('CMI is unavailable pending certified integration.');

      const stripeConfirm = await StripeGateway.confirm({});
      expect(stripeConfirm.success).toBe(false);

      const cmiConfirm = await CmiGateway.confirm({});
      expect(cmiConfirm.success).toBe(false);
    });
  });
});
