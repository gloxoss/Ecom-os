import { getRequestConfig } from 'next-intl/server';
import { routing, i18nEnabled } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  // When disabled: always load default locale only — no dynamic locale switching
  const messageLocale = i18nEnabled ? locale : routing.defaultLocale;
  const messages = (
    await import(`@ecom-os/addons-i18n/locales/${messageLocale}.json`)
  ).default;

  return { locale, messages };
});
