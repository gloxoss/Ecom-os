import type { ComponentType } from 'react';
import { generatedShells } from '../clients.generated';
import { getActiveClientKey } from './client-profile';

/**
 * Optional storefront overrides a client instance can provide without editing core files.
 * Add `apps/storefront/src/client-shells/<client-id>.tsx` exporting exactly one `<name>Shell`
 * constant of this type; `scripts/generate-clients.mjs` registers it. Anything left out falls
 * back to the default EcomOS storefront.
 */
export interface ClientShellOverrides {
  /** Value of `<html lang>`. Default "en". */
  htmlLang?: string;
  /** Replaces the default site header. */
  Header?: ComponentType;
  /** Replaces the default site footer. */
  Footer?: ComponentType;
  /** Replaces the whole home page. Receives the active locale. */
  Landing?: ComponentType<{ locale: string }>;
}

/** Overrides for the active client, or an empty object when the client has none. */
export function getClientShell(
  clientKey: string = getActiveClientKey(),
  registry: Record<string, ClientShellOverrides> = generatedShells
): ClientShellOverrides {
  return registry[clientKey] ?? {};
}
