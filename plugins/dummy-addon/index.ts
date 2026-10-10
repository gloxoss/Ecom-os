import type { EcomAddon, AddonContext, AddonManifest } from '../../packages/ecom-engine/src/index';
import { manifest } from './manifest';

export { manifest };

let isRegistered = false;

export const register = (ctx: AddonContext): void => {
  // Harmless visible capability: records registered state
  isRegistered = true;
};

export const disable = (): void => {
  isRegistered = false;
};

export const isAddonRegistered = (): boolean => isRegistered;

export const addon: EcomAddon = {
  manifest,
  register,
  disable,
};

export default addon;
