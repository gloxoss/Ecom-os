import type { ClientProfile } from '../../packages/brand-config/src/client-profile';

/**
 * Independent contrasting neutral client profile for EcomOS verification.
 * Demonstrates theme tokens, layout slot independence, and domain decoupling.
 */
export const demo2Profile: ClientProfile = {
  id: 'demo-2',
  name: 'Nordic Craft Supplies',
  version: '1.0.0',
  brand: {
    name: 'Nordic Craft Supplies',
    slug: 'nordic-craft',
    theme: 'demo-2',
    logos: {
      light: '/brands/demo-2/logo-light.svg',
      dark: '/brands/demo-2/logo-dark.svg',
      favicon: '/brands/demo-2/favicon.ico',
    },
    colors: {
      primary: '#0F172A',
      secondary: '#475569',
      accent: '#0284C7',
      background: '#F8FAFC',
      foreground: '#0F172A',
      muted: '#E2E8F0',
      card: '#FFFFFF',
      cardForeground: '#0F172A',
      border: '#CBD5E1',
      ring: '#0284C7',
      destructive: '#EF4444',
    },
    fonts: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", ui-monospace, monospace',
    },
    radii: {
      sm: '2px',
      md: '4px',
      lg: '6px',
    },
    slots: {
      header: 'minimal',
      hero: 'minimal',
      productGrid: '3-column',
      footer: 'simple',
      variantSelector: 'dropdown',
    },
    hero: {
      headline: 'Outillage d’artisanat & matières nobles scandinaves',
      subheadline: 'Outils forgés de précision, toiles de lin pur et argiles céramiques.',
      ctaLabel: 'Explorer les outils',
      ctaHref: '/catalog',
      image: '/brands/demo-2/hero-workshop.jpg',
    },
    contact: {
      email: 'contact@nordic-craft.example.com',
      phone: '+212 5 22 00 11 22',
      address: 'Zone Industrielle Sidi Maârouf, Casablanca, Maroc',
    },
    commerce: {
      defaultLocale: 'fr',
      supportedLocales: ['fr', 'en'],
      defaultCurrency: 'MAD',
      supportedCurrencies: ['MAD'],
    },
  },
  capabilities: {
    quotes: false,
    multiCurrency: false,
    guestCheckout: true,
    customerAccounts: false,
    reviews: false,
    wishlist: false,
    newsletter: false,
    facetedSearch: true,
  },
  commerce: {
    allowedCountries: ['MA'],
    defaultCountry: 'MA',
    allowedPaymentMethods: ['cod'],
    allowedShippingMethods: ['standard'],
    defaultShippingMethod: 'standard',
  },
  industry: {
    industry: 'general_retail',
    requiresPrescriptionValidation: false,
    requiresAgeVerification: false,
  },
  environment: {
    wooCommerceUrl: 'https://woo.nordic-craft.internal',
    wordpressUrl: 'https://wp.nordic-craft.internal',
    storefrontUrl: 'https://nordic-craft.example.com',
    cdnUrl: 'https://cdn.nordic-craft.example.com',
  },
};
