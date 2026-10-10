import type { ClientProfile } from '../../packages/brand-config/src/client-profile';

/**
 * Validated ParaLoca Client Profile for EcomOS.
 * Approved Brand: ParaLoca (domain: paraloca.ma)
 * Locale: French (fr) + Arabic (ar)
 * Currency: MAD (Moroccan Dirham)
 * Region: Morocco (MA)
 * Invariants:
 *  - Only certified payment methods permitted ('cod')
 *  - Customer accounts disabled by architectural invariant
 *  - No internal backend credentials or secrets stored in profile
 */
export const paralocaProfile: ClientProfile = {
  id: 'paraloca',
  name: 'ParaLoca',
  version: '1.0.0',
  brand: {
    name: 'ParaLoca',
    slug: 'paraloca',
    theme: 'paraloca',
    logos: {
      light: '/brands/paraloca/logo-light.svg',
      dark: '/brands/paraloca/logo-dark.svg',
      favicon: '/brands/paraloca/favicon.ico',
    },
    colors: {
      primary: '#171817',
      secondary: '#595D5A',
      accent: '#276C61',
      background: '#FFFFFF',
      foreground: '#171817',
      muted: '#F6F6F4',
      card: '#FFFFFF',
      cardForeground: '#171817',
      border: '#E2E4DF',
      ring: '#165FBA',
      destructive: '#A93636',
    },
    fonts: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", ui-monospace, monospace',
    },
    radii: {
      sm: '6px',
      md: '12px',
      lg: '18px',
    },
    slots: {
      header: 'standard',
      hero: 'split',
      productGrid: '3-column',
      footer: 'multi-column',
      variantSelector: 'pills',
    },
    hero: {
      headline: "Pour chaque jour, l'essentiel du soin.",
      subheadline:
        'Équipements médicaux de précision et matériel de maintien à domicile pour particuliers et professionnels de santé au Maroc.',
      ctaLabel: 'Découvrir les équipements',
      ctaHref: '/catalog',
      image: '/brands/paraloca/hero-care.jpg',
    },
    contact: {
      email: 'contact@paraloca.ma',
      phone: '+212 5 22 00 00 00',
      address: "Boulevard d'Anfa, Casablanca, Maroc",
    },
    commerce: {
      defaultLocale: 'fr',
      supportedLocales: ['fr', 'ar'],
      defaultCurrency: 'MAD',
      supportedCurrencies: ['MAD'],
    },
  },
  capabilities: {
    quotes: true, // Discreetly activated for ParaLoca B2B healthcare professional quoting (ECO-805)
    multiCurrency: false,
    guestCheckout: true,
    customerAccounts: false,
    reviews: false,
    wishlist: true,
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
    regulatedProductNotice:
      'Dispositifs médicaux et matériel de maintien à domicile. Se référer aux notices fabricants et aux recommandations des professionnels de santé.',
    complianceDisclaimers: [
      'Dispositifs et accessoires conformes aux normes et certifications applicables au Maroc',
      'Garantie constructeur sur les équipements homologués',
    ],
  },
  environment: {
    wooCommerceUrl: 'https://woo.paraloca.ma',
    wordpressUrl: 'https://wp.paraloca.ma',
    storefrontUrl: 'https://paraloca.ma',
    cdnUrl: 'https://cdn.paraloca.ma',
  },
};
