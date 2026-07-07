import { describe, it, expect, vi } from 'vitest';

describe('stripe webhook', () => {
  it('rejects missing signature with 400', async () => {
    const { handleStripeWebhook } = await import('../providers/stripe/webhook');
    const engine = { markOrderPaid: vi.fn() };
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    const result = await handleStripeWebhook('{}', null, engine);
    expect(result.status).toBe(400);
    expect(engine.markOrderPaid).not.toHaveBeenCalled();
  });

  it('rejects invalid signature with 400', async () => {
    const { handleStripeWebhook } = await import('../providers/stripe/webhook');
    const engine = { markOrderPaid: vi.fn() };
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    const result = await handleStripeWebhook('{}', 'bad-sig', engine);
    expect(result.status).toBe(400);
    expect(engine.markOrderPaid).not.toHaveBeenCalled();
  });
});
