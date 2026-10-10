import type { AddonManifest } from '../../packages/ecom-engine/src/index';

export const manifest: AddonManifest = {
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

export default manifest;
