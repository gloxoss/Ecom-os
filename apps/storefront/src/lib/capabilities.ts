import { getEngine } from './engine';
import { StoreCapabilities } from '@ecom-os/engine';
import { cache } from 'react';

// ISR cached capabilities fetch
export const getCapabilities = cache(async (): Promise<StoreCapabilities> => {
  const engine = await getEngine();
  try {
    return await engine.getCapabilities();
  } catch (err) {
    console.error('Failed to fetch store capabilities', err);
    return {
      couponsEnabled: false,
      loyaltyEnabled: false,
      guestCheckout: false,
      multiCurrency: false,
      version: '1.0.0',
    };
  }
});
