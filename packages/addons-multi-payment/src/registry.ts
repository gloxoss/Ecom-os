import type { PaymentGateway } from './interface';

const registry = new Map<string, PaymentGateway>();

export function registerGateway(gateway: PaymentGateway): void {
  if (gateway.id !== 'cod') throw new Error(`Payment provider ${gateway.id} is unavailable pending verified integration.`);
  registry.set(gateway.id, gateway);
}

export function getGateway(id: string): PaymentGateway | undefined {
  if (id !== 'cod') return undefined;
  return registry.get(id);
}

export function getEnabledGateways(): PaymentGateway[] {
  const enabled = (process.env.PAYMENT_PROVIDERS ?? 'cod').split(',').filter(Boolean);
  return enabled.filter(id => id === 'cod').map(id => registry.get(id)).filter((g): g is PaymentGateway => !!g);
}
