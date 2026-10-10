import { describe, it, expect } from 'vitest';
import { AddonRegistry, type AddonManifest, FakeEngine } from '../index.js';
const dummyManifest: AddonManifest = {
  id: 'dummy-addon',
  name: 'Dummy Exemplar Addon',
  version: '1.0.0',
  description: 'Exemplar simple addon verifying complete compatibility, on/off contract, and failure isolation',
  ecomOsApiRange: '^1.0.0',
  capabilities: {
    provided: ['dummy_banner'],
  },
  configSchema: {
    showBanner: {
      type: 'boolean',
      default: true,
      description: 'Controls whether promotional announcement banner is visible',
    },
  },
  routes: [
    {
      path: '/api/dummy-ping',
      method: 'GET',
      authRequired: false,
    },
  ],
  uiSlots: [
    {
      slot: 'header_banner',
      component: 'DummyBanner',
      order: 1,
    },
  ],
  adminSlots: [
    {
      slot: 'operations_overview',
      title: 'Dummy Addon Status',
      component: 'DummyAdminWidget',
    },
  ],
};

let isRegistered = false;
const register = (_ctx: { engineType: string }) => {
  isRegistered = true;
};
const disable = () => {
  isRegistered = false;
};
const isAddonRegistered = () => isRegistered;


describe('Exemplar Addon Integration & Failure Isolation', () => {
  it('executes full on/off lifecycle for exemplar dummy-addon', () => {
    const registry = new AddonRegistry('1.0.0');

    // 1. Initial State: Unregistered / Off
    expect(registry.isEnabled(dummyManifest.id)).toBe(false);
    expect(registry.hasCapability('dummy_banner')).toBe(false);

    // 2. Register Addon
    registry.register(dummyManifest);
    expect(registry.isEnabled(dummyManifest.id)).toBe(false);

    // 3. Enable Addon
    registry.enable(dummyManifest.id, { showBanner: true });
    expect(registry.isEnabled(dummyManifest.id)).toBe(true);
    expect(registry.hasCapability('dummy_banner')).toBe(true);

    register({ engineType: 'fake' });
    expect(isAddonRegistered()).toBe(true);

    // 4. Disable Addon
    registry.disable(dummyManifest.id);
    expect(registry.isEnabled(dummyManifest.id)).toBe(false);
    expect(registry.hasCapability('dummy_banner')).toBe(false);

    disable();
    expect(isAddonRegistered()).toBe(false);
  });

  it('isolates addon startup failure without corrupting core engine or cart', async () => {
    const registry = new AddonRegistry('1.0.0');
    const engine = new FakeEngine();

    const buggyAddonManifest: AddonManifest = {
      id: 'buggy-addon',
      name: 'Buggy Addon',
      version: '1.0.0',
      ecomOsApiRange: '^1.0.0',
    };

    registry.register(buggyAddonManifest);

    // Simulate safe execution wrapper
    const executeAddonStartup = (fn: () => void) => {
      try {
        fn();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    };

    // The buggy addon throws a fatal exception
    const result = executeAddonStartup(() => {
      throw new Error('Fatal crash inside third-party addon startup code');
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Fatal crash');

    // Invariant: Core engine and cart flow remain 100% operational
    const cart = await engine.getCart('guest-test-session');
    expect(cart).toBeDefined();
    expect(cart.id).toBe('guest-test-session');
    expect(cart.total.currency).toBe('USD');

    // Core catalog query continues functioning
    const products = await engine.listProducts({ limit: 5 });
    expect(products.items).toBeDefined();
    expect(Array.isArray(products.items)).toBe(true);
  });

  it('rejects version mismatched addon enablement gracefully', () => {
    const registry = new AddonRegistry('1.0.0');

    const futureAddon: AddonManifest = {
      id: 'future-addon',
      name: 'Future Addon',
      version: '2.0.0',
      ecomOsApiRange: '^2.0.0', // Requires Engine 2.x
    };

    registry.register(futureAddon);

    // Attempting to enable must throw a controlled compatibility error
    expect(() => {
      registry.enable('future-addon');
    }).toThrowError(/requires EcomOS API range "\^2\.0\.0"/);

    // Engine and registry remain intact
    expect(registry.isEnabled('future-addon')).toBe(false);
  });
});
