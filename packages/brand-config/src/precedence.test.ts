import { describe, expect, it } from 'vitest';
import {
  ConfigurationValidationError,
  validateBrandConfig,
  type BrandConfig,
} from './schema';
import {
  hexToHsl,
  resolveBrandConfiguration,
} from './precedence';

const MOCK_PROFILE_PARALOCA: BrandConfig = {
  name: 'ParaLoca Terroir & Argan',
  theme: 'angelina',
  logos: {
    light: '/brands/paraloca/logo-light.svg',
    dark: '/brands/paraloca/logo-dark.svg',
    favicon: '/brands/paraloca/favicon.ico',
  },
  colors: {
    primary: '#aa631a', // Warm terracotta gold
    secondary: '#c69951',
    accent: '#ffcebf',
    background: '#ffffff',
    foreground: '#3f100a',
    muted: '#d9a594',
    card: '#ffffff',
  },
  fonts: {
    sans: 'Inter Tight Variable',
    serif: 'Sentient Variable',
    mono: 'monospace',
  },
  radii: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    full: '9999px',
  },
  slots: {
    header: 'centered',
    hero: 'split',
    productGrid: '3-column',
    footer: 'multi-column',
    variantSelector: 'pills',
  },
  commerce: {
    defaultLocale: 'fr',
    supportedLocales: ['fr', 'ar', 'en'],
    defaultCurrency: 'MAD',
    supportedCurrencies: ['MAD', 'EUR'],
  },
  hero: {
    headline: 'Trésors Authentiques du Terroir Marocain',
    subheadline: 'Huiles d argan pures, safran de Taliouine et cosmétiques naturels certifiés.',
    ctaLabel: 'Découvrir la Boutique',
    ctaHref: '/catalog',
    image: '/images/hero-argan.jpg',
  },
  contact: {
    email: 'contact@paraloca.ma',
    phone: '+212 524 000 000',
    address: 'Avenue Mohammed V, Marrakech, Maroc',
  },
  social: {
    instagram: 'https://instagram.com/paraloca.ma',
    facebook: 'https://facebook.com/paraloca.ma',
  },
};

const MOCK_PROFILE_MINIMAL_TECH: BrandConfig = {
  name: 'Aero Labs Medical',
  theme: 'minimal',
  logos: {
    light: '/brands/aerolabs/logo-light.svg',
    dark: '/brands/aerolabs/logo-dark.svg',
  },
  colors: {
    primary: '#0f172a', // Deep slate navy
    secondary: '#475569',
    accent: '#0ea5e9', // Medical cyan
    background: '#f8fafc',
    foreground: '#020817',
    muted: '#94a3b8',
  },
  fonts: {
    sans: 'Geist Sans',
    mono: 'Geist Mono',
  },
  radii: {
    sm: '2px',
    md: '4px',
    lg: '6px',
    full: '9999px',
  },
  slots: {
    header: 'minimal',
    hero: 'minimal',
    productGrid: '4-column',
    footer: 'simple',
    variantSelector: 'dropdown',
  },
  commerce: {
    defaultLocale: 'en',
    supportedLocales: ['en', 'fr'],
    defaultCurrency: 'EUR',
    supportedCurrencies: ['EUR', 'USD'],
  },
  hero: {
    headline: 'Precision Diagnostic Instruments',
    subheadline: 'Engineered for hospitals, certified laboratories, and specialized clinics.',
    ctaLabel: 'Browse Equipment',
    ctaHref: '/catalog',
    image: '/images/hero-tech.jpg',
  },
  contact: {
    email: 'ops@aerolabs.eu',
    phone: '+33 1 40 00 00 00',
    address: '15 Rue de la Paix, 75002 Paris, France',
  },
};

describe('ECO-401: Theme and Brand Configuration Precedence', () => {
  it('converts hex colors to normalized HSL percentage strings accurately', () => {
    expect(hexToHsl('#ffffff')).toBe('0 0% 100%');
    expect(hexToHsl('#000000')).toBe('0 0% 0%');
    expect(hexToHsl('30 73% 38%')).toBe('30 73% 38%');
  });

  it('resolves deterministic, contrasting tokens for two distinct client profiles', () => {
    const resolvedA = resolveBrandConfiguration(MOCK_PROFILE_PARALOCA);
    const resolvedB = resolveBrandConfiguration(MOCK_PROFILE_MINIMAL_TECH);

    // Profile A (Luxury / Angelina theme / Warm palette)
    expect(resolvedA.name).toBe('ParaLoca Terroir & Argan');
    expect(resolvedA.themeName).toBe('angelina');
    expect(resolvedA.colors.primary).toBe(hexToHsl('#aa631a'));
    expect(resolvedA.fonts.sans).toBe('Inter Tight Variable');
    expect(resolvedA.fonts.serif).toBe('Sentient Variable');
    expect(resolvedA.slots.header).toBe('centered');
    expect(resolvedA.slots.productGrid).toBe('3-column');
    expect(resolvedA.commerce.defaultCurrency).toBe('MAD');
    expect(resolvedA.commerce.defaultLocale).toBe('fr');

    // Profile B (Minimal Tech / Cool slate palette)
    expect(resolvedB.name).toBe('Aero Labs Medical');
    expect(resolvedB.themeName).toBe('minimal');
    expect(resolvedB.colors.primary).toBe(hexToHsl('#0f172a'));
    expect(resolvedB.fonts.sans).toBe('Geist Sans');
    expect(resolvedB.slots.header).toBe('minimal');
    expect(resolvedB.slots.productGrid).toBe('4-column');
    expect(resolvedB.commerce.defaultCurrency).toBe('EUR');
    expect(resolvedB.commerce.defaultLocale).toBe('en');

    // Contrast check: colors, fonts, slots, currencies must differ
    expect(resolvedA.colors.primary).not.toBe(resolvedB.colors.primary);
    expect(resolvedA.slots.header).not.toBe(resolvedB.slots.header);
    expect(resolvedA.slots.variantSelector).toBe('pills');
    expect(resolvedB.slots.variantSelector).toBe('dropdown');
  });

  it('allows themeOverride to supersede profile theme while retaining profile tokens', () => {
    const resolved = resolveBrandConfiguration(MOCK_PROFILE_PARALOCA, 'luxury');
    expect(resolved.themeName).toBe('luxury');
    // Profile primary color still overrides the theme primary
    expect(resolved.colors.primary).toBe(hexToHsl('#aa631a'));
  });

  it('falls back gracefully to theme defaults when optional profile fields are omitted', () => {
    const minimalProfile: BrandConfig = {
      name: 'Default Store',
      theme: 'default',
      logos: {
        light: '/logo.svg',
        dark: '/logo-dark.svg',
      },
      colors: {
        primary: '#222222',
        secondary: '#555555',
        accent: '#0088ff',
        background: '#ffffff',
        foreground: '#111111',
        muted: '#888888',
      },
      fonts: {
        sans: 'Inter',
        mono: 'monospace',
      },
      radii: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px',
      },
      hero: {
        headline: 'Welcome',
        subheadline: 'Shop our goods',
        ctaLabel: 'Shop',
        ctaHref: '/shop',
        image: '/hero.jpg',
      },
      contact: {
        email: 'info@store.com',
        phone: '123456',
        address: 'Test Address',
      },
    };

    const resolved = resolveBrandConfiguration(minimalProfile);
    expect(resolved.slots.header).toBe('standard');
    expect(resolved.slots.productGrid).toBe('4-column');
    expect(resolved.commerce.defaultLocale).toBe('fr');
    expect(resolved.commerce.defaultCurrency).toBe('MAD');
  });

  it('generates valid CSS custom properties string', () => {
    const resolved = resolveBrandConfiguration(MOCK_PROFILE_PARALOCA);
    const css = resolved.generateCSS();

    expect(css).toContain(':root {');
    expect(css).toContain('--primary:');
    expect(css).toContain('--background:');
    expect(css).toContain('--foreground:');
    expect(css).toContain('--radius:');
    expect(css).toContain('--font-sans:');
  });

  it('rejects invalid or missing critical configuration with descriptive error', () => {
    // Missing required name
    expect(() =>
      validateBrandConfig({
        ...MOCK_PROFILE_PARALOCA,
        name: '',
      }),
    ).toThrow(ConfigurationValidationError);

    // Invalid email
    expect(() =>
      validateBrandConfig({
        ...MOCK_PROFILE_PARALOCA,
        contact: {
          ...MOCK_PROFILE_PARALOCA.contact,
          email: 'not-an-email',
        },
      }),
    ).toThrow(ConfigurationValidationError);

    // Missing logos
    expect(() =>
      validateBrandConfig({
        ...MOCK_PROFILE_PARALOCA,
        logos: undefined,
      }),
    ).toThrow(ConfigurationValidationError);
  });
});
