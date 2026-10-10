import React from 'react';
import { themeConfigToCssVars, type EcomTheme } from '@ecom-os/themes';
import { getActiveClientTheme } from '../../../lib/client-profile';

export interface ClientShellProps {
  children?: React.ReactNode;
  headerSlot?: React.ReactNode;
  heroSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  theme?: EcomTheme;
  locale?: string;
  className?: string;
}

/**
 * Reusable client presentation shell for EcomOS.
 * Applies active client theme tokens, accessible skip-to-content anchors,
 * discreet secondary professional quoting links, and presentation slots.
 */
export function ClientShell({
  children,
  headerSlot,
  heroSlot,
  footerSlot,
  theme,
  locale = 'fr',
  className = '',
}: ClientShellProps) {
  const resolvedTheme = theme || getActiveClientTheme();
  const cssVars = themeConfigToCssVars(resolvedTheme.config) as React.CSSProperties;

  return (
    <div
      className={`min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground ${className}`}
      style={cssVars}
      data-client-theme={resolvedTheme.config.name}
      data-header-slot={resolvedTheme.config.slots?.header || 'standard'}
      data-product-grid-slot={resolvedTheme.config.slots?.productGrid || '3-column'}
    >
      {/* Accessible skip-link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform"
      >
        {locale === 'ar' ? 'الانتقال إلى المحتوى الرئيسي' : 'Passer au contenu principal'}
      </a>

      {/* Discreet Secondary Professional RFQ Utility Banner */}
      <div className="w-full bg-muted/60 border-b border-border text-xs py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1320px] mx-auto flex items-center justify-between">
          <span className="text-muted-foreground">
            {locale === 'ar' ? 'موزع معتمد للمعدات الطبية بالمغرب' : 'Distributeur agréé de matériel médical au Maroc'}
          </span>
          <a
            href={`/${locale}/devis`}
            className="text-accent hover:underline font-medium flex items-center gap-1.5"
            data-testid="pro-devis-link"
          >
            <span>{locale === 'ar' ? 'فضاء المهنيين وطلب عرض سعر' : 'Espace Professionnels & Demande de Devis'}</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      {/* Header Slot */}
      {headerSlot ? (
        <header role="banner" className="w-full border-b border-border bg-background">
          {headerSlot}
        </header>
      ) : null}

      {/* Hero Slot */}
      {heroSlot ? (
        <section aria-label="Bannière principale" className="w-full">
          {heroSlot}
        </section>
      ) : null}

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none">
        {children}
      </main>

      {/* Footer Slot */}
      {footerSlot ? (
        <footer role="contentinfo" className="w-full border-t border-border mt-auto">
          {footerSlot}
        </footer>
      ) : null}
    </div>
  );
}
