import { AddonContext } from '../../packages/ecom-engine/src/addons';

export function register(ctx: AddonContext): void {
  console.log('dummy-addon registered');
}

export function disable(): void {
  console.log('dummy-addon disabled');
}
