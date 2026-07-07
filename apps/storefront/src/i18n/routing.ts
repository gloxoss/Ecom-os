import { defineRouting } from 'next-intl/routing';

const I18N_ENABLED = (process.env.ADDONS ?? '')
  .split(',')
  .map(s => s.trim())
  .includes('i18n');

const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE ?? 'en';

// ponytail: require() used intentionally — module-level conditional ESM import
// is not possible without top-level await. addons-i18n is always installed
// (workspace dep), so this never fails; it's a build-time routing switch.
export const routing = I18N_ENABLED
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  ? (require('@ecom-os/addons-i18n/src/routing') as any).routing
  : defineRouting({
      locales: [DEFAULT_LOCALE] as [string],
      defaultLocale: DEFAULT_LOCALE,
      localePrefix: 'never', // no /en/ prefix — URLs look single-language
    });

export const i18nEnabled = I18N_ENABLED;
