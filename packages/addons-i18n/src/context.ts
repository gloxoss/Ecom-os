import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

import enMessages from '../locales/en.json';
import frMessages from '../locales/fr.json';
import arMessages from '../locales/ar.json';

const messagesMap: Record<string, any> = {
  en: enMessages,
  fr: frMessages,
  ar: arMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: messagesMap[locale] || enMessages,
  };
});
