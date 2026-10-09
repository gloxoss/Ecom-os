import { defineRouting } from 'next-intl/routing';
import { routing as addonRouting } from '@ecom-os/addons-i18n';

const I18N_ENABLED = (process.env.ADDONS ?? '')
  .split(',')
  .map(s => s.trim())
  .includes('i18n');

const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE ?? 'en';

export const routing = I18N_ENABLED
  ? addonRouting
  : defineRouting({
      locales: [DEFAULT_LOCALE] as [string],
      defaultLocale: DEFAULT_LOCALE,
      localePrefix: 'never', // no /en/ prefix — URLs look single-language
    });

export const i18nEnabled = I18N_ENABLED;
