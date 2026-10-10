import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AddonRegistry } from '@ecom-os/engine';
import { manifest as dummyManifest } from '../../../plugins/dummy-addon/manifest';
import {
  setStorefrontRegistryForTesting,
  isAddonActive,
  getPublicAddonCapabilities,
} from '../src/lib/addon-capabilities';
import { guardAddonRoute, withAddonGuard } from '../src/lib/addon-route-guard';

describe('Storefront Addon Contract & Slot Gating', () => {
  let registry: AddonRegistry;

  beforeEach(() => {
    registry = new AddonRegistry('1.0.0');
    registry.register(dummyManifest);
    setStorefrontRegistryForTesting(registry);
  });

  it('guarantees disabled exemplar addon slots and routes are absent', async () => {
    // 1. Off state
    assert.equal(isAddonActive('dummy-addon'), false);

    // 2. Capability projection does NOT include dummy capability
    const projection = getPublicAddonCapabilities();
    assert.equal(projection.features['dummy-addon'], false);
    assert.equal(projection.capabilities.includes('dummy_banner'), false);

    // 3. Direct route guard returns 404
    const guard = guardAddonRoute('dummy-addon');
    assert.equal(guard.allowed, false);
    assert.equal(guard.status, 404);

    // 4. API handler execution is halted
    const dummyApiHandler = async () => new Response(JSON.stringify({ pong: true }), { status: 200 });
    const guardedEndpoint = withAddonGuard('dummy-addon', dummyApiHandler);
    const response = await guardedEndpoint();
    assert.equal((response as Response).status, 404);
  });

  it('enables exemplar addon slots and routes cleanly when activated', async () => {
    // 1. Activate
    registry.enable('dummy-addon');
    assert.equal(isAddonActive('dummy-addon'), true);

    // 2. Capability projection includes dummy capability
    const projection = getPublicAddonCapabilities();
    assert.equal(projection.features['dummy-addon'], true);
    assert.equal(projection.capabilities.includes('dummy_banner'), true);

    // 3. Direct route guard returns 200
    const guard = guardAddonRoute('dummy-addon');
    assert.equal(guard.allowed, true);
    assert.equal(guard.status, 200);

    // 4. API handler executes cleanly
    const dummyApiHandler = async () => new Response(JSON.stringify({ pong: true }), { status: 200 });
    const guardedEndpoint = withAddonGuard('dummy-addon', dummyApiHandler);
    const response = await guardedEndpoint();
    assert.equal((response as Response).status, 200);
    const body = await (response as Response).json();
    assert.equal(body.pong, true);
  });
});

