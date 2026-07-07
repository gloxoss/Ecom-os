import type { AddonContext } from '@ecom-os/engine';
import { registerGateway } from './registry';
import { CodGateway } from './providers/cod/provider';
import { StripeGateway } from './providers/stripe/provider';
import { CmiGateway } from './providers/cmi/provider';

const PROVIDERS = { cod: CodGateway, stripe: StripeGateway, cmi: CmiGateway } as const;

export function register(ctx: AddonContext): void {
  try {
    const enabled = (process.env.PAYMENT_PROVIDERS ?? 'cod').split(',').filter(Boolean);
    for (const id of enabled) {
      const gateway = PROVIDERS[id as keyof typeof PROVIDERS];
      if (gateway) registerGateway(gateway);
    }
  } catch (err) {
    // Graceful degradation — log but don't crash the storefront
    console.warn('[multi-payment] Failed to register:', err);
  }
}

export function disable(): void {
  // Registry cleared on process restart — stateless
}
