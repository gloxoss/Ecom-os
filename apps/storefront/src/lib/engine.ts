import { getEngine as getBaseEngine, setEngine, EcomEngine, FakeEngine } from '@ecom-os/engine';
import { validateRuntimeConfig } from './runtime-config';

export async function getEngine(): Promise<EcomEngine> {
  validateRuntimeConfig();
  let engine = getBaseEngine();
  if (process.env.NODE_ENV === 'production' && engine instanceof FakeEngine) {
    throw new Error('FakeEngine is unavailable in production.');
  }
  if (engine) return engine;

  const type = process.env.ECOM_ENGINE || 'fake';

  if (type === 'woocommerce') {
    const { WooCommerceEngine } = await import('@ecom-os/engine-woocommerce');
    engine = new WooCommerceEngine();
  } else if (type === 'fake') {
    engine = new FakeEngine();
  } else {
    throw new Error(`Unknown ECOM_ENGINE type: "${type}".`);
  }

  setEngine(engine);
  return engine;
}
