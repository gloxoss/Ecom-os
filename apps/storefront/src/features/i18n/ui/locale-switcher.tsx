'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@ecom-os/addons-i18n/src/navigation';
import { routing, i18nEnabled } from '@/i18n/routing';

const LOCALE_LABELS: Record<string, string> = { en: 'EN', fr: 'FR', ar: 'ع' };
const activeLocales = routing.locales as string[];

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // Hidden when i18n is disabled or only one locale is configured
  if (!i18nEnabled || activeLocales.length <= 1) return null;

  return (
    <div className="flex items-center gap-1">
      {activeLocales.map(l => (
        <button
          key={l}
          onClick={() => router.replace(pathname, { locale: l })}
          className={`text-xs px-2 py-1 rounded transition ${l === locale ? 'bg-foreground text-background' : 'text-secondary hover:text-foreground'}`}
          aria-label={`Switch to ${l}`}
        >
          {LOCALE_LABELS[l] ?? l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
