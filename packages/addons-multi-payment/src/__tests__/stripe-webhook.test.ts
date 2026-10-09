import { afterEach, describe, it, expect, vi } from 'vitest';
import { handleStripeWebhook } from '../providers/stripe/webhook';
import { processCmiCallback } from '../providers/cmi/callback';
import { StripeGateway } from '../providers/stripe/provider';
import { CmiGateway } from '../providers/cmi/provider';
import { computeCmiHash } from '../providers/cmi/hash';
import { getGateway, getEnabledGateways, registerGateway } from '../registry';

afterEach(() => vi.unstubAllEnvs());

describe('quarantined online payments', () => {
  it.each([null, 'bad-sig', 'synthetic-signature'])('never changes an order for Stripe signature %s', async signature => {
    const engine = { markOrderPaid: vi.fn() };
    vi.stubEnv('PAYMENT_PROVIDERS', 'stripe,cmi,cod');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_synthetic');
    const result = await handleStripeWebhook('{"type":"payment_intent.succeeded"}', signature, engine);
    expect(result.status).toBe(503);
    expect(engine.markOrderPaid).not.toHaveBeenCalled();
  });

  it('rejects a correctly signed declined CMI callback and its replay', async () => {
    vi.stubEnv('CMI_STORE_KEY', 'synthetic-key');
    const params = { oid: '42', amount: '1299.00', currency: '504', Response: 'Declined', ProcReturnCode: '05', TransId: 'synthetic' };
    const signed = { ...params, HASH: computeCmiHash(params, 'synthetic-key') };
    expect((await processCmiCallback(signed, 129900)).ok).toBe(false);
    expect((await processCmiCallback(signed, 129900)).ok).toBe(false);
  });

  it('does not expose gateways even when environment flags list them', async () => {
    vi.stubEnv('PAYMENT_PROVIDERS', 'stripe,cmi');
    expect(getGateway('stripe')).toBeUndefined();
    expect(getGateway('cmi')).toBeUndefined();
    expect(getEnabledGateways()).toEqual([]);
    for (const gateway of [StripeGateway, CmiGateway]) {
      expect(() => registerGateway(gateway)).toThrow('unavailable');
      await expect(gateway.initiate({} as Parameters<typeof gateway.initiate>[0])).rejects.toThrow('unavailable');
      expect((await gateway.confirm({})).success).toBe(false);
    }
  });
});
