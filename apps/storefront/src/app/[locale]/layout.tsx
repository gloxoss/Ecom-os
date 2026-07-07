import { setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isRtl } from '@ecom-os/addons-i18n/src/config';
import type { Locale } from '@ecom-os/addons-i18n/src/config';
import { routing } from '@/i18n/routing';
import { SiteHeader } from '@/components/shared/site-header';
import { BrandFooter } from '@/components/shared/brand-footer';

export function generateStaticParams() {
  return (routing.locales as string[]).map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as string[]).includes(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <NextIntlClientProvider messages={messages}>
      <div dir={isRtl(locale as Locale) ? 'rtl' : 'ltr'}>
        {/* Google Analytics — only injected when NEXT_PUBLIC_GA_ID is set */}
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        )}
        <SiteHeader />
        {children}
        <BrandFooter />
      </div>
    </NextIntlClientProvider>
  );
}
