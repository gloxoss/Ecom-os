import type { EcomAddon, AddonContext, AddonManifest } from '@ecom-os/engine';
import manifestData from './manifest.json';

export const manifest: AddonManifest = manifestData as unknown as AddonManifest;

export const register = (ctx: AddonContext): void => {
  // Exemplar dummy addon registration hook
};

export const disable = (): void => {
  // Exemplar dummy addon disable hook
};

export const addon: EcomAddon = {
  manifest,
  register,
  disable,
};

export default addon;
