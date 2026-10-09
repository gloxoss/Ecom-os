import { AddonContext } from '@ecom-os/engine';
import { registeredAddons } from '@/addons.generated';

export function initAddons(ctx: AddonContext): void {
  for (const addon of registeredAddons) {
    addon.register(ctx);
  }
}
