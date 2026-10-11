import type { AddonContext } from '@ecom-os/engine';
import { DEFAULT_RFQ_POLICY } from './policy';
import type { RfqPolicy } from './types';

/**
 * RFQ lifecycle state for this process.
 *
 * The addon is opt-in per deployment (`ADDONS` includes `quotes`) and off by
 * default. Callers that must not quote while the addon is disabled should gate
 * on `isRfqActive()` instead of assuming the module is live.
 */
let activePolicy: RfqPolicy | null = null;

export function register(ctx: AddonContext): void {
  const configured = ctx.config?.rfqPolicy as RfqPolicy | undefined;
  activePolicy = configured ?? DEFAULT_RFQ_POLICY;
}

export function disable(): void {
  activePolicy = null;
}

export function isRfqActive(): boolean {
  return activePolicy !== null;
}

/**
 * Returns the policy in force. Falls back to the conservative default rather
 * than throwing, so a route reached with the addon off still gets safe limits.
 */
export function getActiveRfqPolicy(): RfqPolicy {
  return activePolicy ?? DEFAULT_RFQ_POLICY;
}
