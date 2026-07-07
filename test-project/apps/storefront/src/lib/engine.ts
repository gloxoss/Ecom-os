import { getEngine as getBaseEngine, setEngine, EcomEngine, FakeEngine } from '@ecom-os/engine';

export async function getEngine(): Promise<EcomEngine> {
  let engine = getBaseEngine();
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
