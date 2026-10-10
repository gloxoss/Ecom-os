import type { AddonManifest } from './addon-manifest.js';

export interface AddonContext {
  engineType: string;
  locale?: string;
  config?: Record<string, unknown>;
}

export interface EcomAddon {
  manifest?: AddonManifest;
  register: (ctx: AddonContext) => void;
  disable: () => void;
}

export * from './addon-manifest.js';
