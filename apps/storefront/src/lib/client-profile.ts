import { paralocaProfile } from '../../../../clients/paraloca/profile';
import { generatedProfiles } from '../clients.generated';
import {
  type ClientProfile,
  type PublicClientProfile,
  toPublicClientProfile,
  resolveEnvironmentUrlsFromEnv,
  loadClientProfile,
} from '@ecom-os/brand-config';
import { paralocaTheme } from '../../../../packages/themes/src/clients/paraloca/theme';
import { themeRegistry, type EcomTheme } from '@ecom-os/themes';

// Registries are generated from clients/*/profile.ts and packages/themes/src/clients/*/theme.ts
// (scripts/generate-clients.mjs), so adding a client never edits this file.
const profileRegistry: Record<string, ClientProfile> = generatedProfiles;
const clientThemeRegistry: Record<string, EcomTheme> = themeRegistry;

/**
 * Resolves the active validated ClientProfile based on deployment configuration.
 * Priority:
 * 1. ECOM_CLIENT_PROFILE environment variable (e.g., 'paraloca', 'demo-2')
 * 2. Default: 'paraloca'
 */
/** Key of the active client (ECOM_CLIENT_PROFILE, default 'paraloca'). Shared by profile, theme and shell lookups. */
export function getActiveClientKey(): string {
  return (process.env.ECOM_CLIENT_PROFILE || 'paraloca').trim().toLowerCase();
}

export function getActiveClientProfile(): ClientProfile {
  const profileKey = getActiveClientKey();
  const rawProfile = profileRegistry[profileKey] || paralocaProfile;

  const envOverrides = resolveEnvironmentUrlsFromEnv(process.env);
  return loadClientProfile(rawProfile, envOverrides);
}

/**
 * Returns the public projection of the active client profile safe for client-side rendering.
 * Internal backend URLs (WooCommerce, WordPress, search) are stripped.
 */
export function getActivePublicClientProfile(): PublicClientProfile {
  return toPublicClientProfile(getActiveClientProfile());
}

/**
 * Resolves the theme associated with the active profile or a specified theme ID.
 */
export function getActiveClientTheme(themeId?: string): EcomTheme {
  const key = (themeId || getActiveClientProfile().brand.theme || 'paraloca').trim().toLowerCase();
  return clientThemeRegistry[key] || paralocaTheme;
}
