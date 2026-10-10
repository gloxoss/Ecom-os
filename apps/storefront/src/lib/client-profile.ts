import { paralocaProfile } from '../../../../clients/paraloca/profile';
import { demo2Profile } from '../../../../clients/demo-2/profile';
import {
  type ClientProfile,
  type PublicClientProfile,
  toPublicClientProfile,
  resolveEnvironmentUrlsFromEnv,
  loadClientProfile,
} from '@ecom-os/brand-config';
import { paralocaTheme } from '../../../../packages/themes/src/clients/paraloca/theme';
import { demo2Theme } from '../../../../packages/themes/src/clients/demo-2/theme';
import { defaultTheme } from '../../../../packages/themes/src/clients/default/theme';
import type { EcomTheme } from '@ecom-os/themes';

const profileRegistry: Record<string, ClientProfile> = {
  paraloca: paralocaProfile,
  'demo-2': demo2Profile,
};

const clientThemeRegistry: Record<string, EcomTheme> = {
  paraloca: paralocaTheme,
  'demo-2': demo2Theme,
  default: defaultTheme,
};

/**
 * Resolves the active validated ClientProfile based on deployment configuration.
 * Priority:
 * 1. ECOM_CLIENT_PROFILE environment variable (e.g., 'paraloca', 'demo-2')
 * 2. Default: 'paraloca'
 */
export function getActiveClientProfile(): ClientProfile {
  const profileKey = (process.env.ECOM_CLIENT_PROFILE || 'paraloca').trim().toLowerCase();
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
