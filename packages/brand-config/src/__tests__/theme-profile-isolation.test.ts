import { describe, it, expect } from 'vitest';
import {
  loadClientProfile,
  toPublicClientProfile,
  resolveEnvironmentUrlsFromEnv,
  ClientProfileSchema,
  ConfigurationValidationError,
} from '../client-profile';
import { resolveBrandConfiguration, hexToHsl } from '../precedence';
import { paralocaProfile } from '../../../../clients/paraloca/profile';

describe('Client Profile & Theme Isolation Contract (ECO-1212)', () => {
  const baseValidProfile = {
    id: 'demo-client',
    name: 'Demo Client Store',
    version: '1.0.0',
    brand: {
      name: 'Demo Brand',
      slug: 'demo-brand',
      theme: 'default',
      navigation: [
        { label: 'Boutique', href: '/catalog' },
        { label: 'À Propos', href: '/about-us' },
        { label: 'Devis Pro', href: '/devis', badge: 'B2B' },
      ],
      logos: {
        light: '/brands/demo/logo-light.svg',
        dark: '/brands/demo/logo-dark.svg',
        favicon: '/brands/demo/favicon.ico',
      },
      colors: {
        primary: '#171817',
        secondary: '#595D5A',
        accent: '#276C61',
        background: '#FFFFFF',
        foreground: '#171817',
        muted: '#F6F6F4',
      },
      fonts: {
        sans: 'Inter, sans-serif',
        mono: 'monospace',
      },
      radii: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      hero: {
        headline: 'Modern Clinical Solutions',
        subheadline: 'High precision equipment delivered with care.',
        ctaLabel: 'Shop Now',
        ctaHref: '/catalog',
        image: '/brands/demo/hero.jpg',
      },
      contact: {
        email: 'contact@demobrand.ma',
        phone: '+212 5 22 11 22 33',
        address: 'Casablanca, Morocco',
      },
      commerce: {
        defaultLocale: 'fr',
        supportedLocales: ['fr', 'ar', 'en'],
        defaultCurrency: 'MAD',
        supportedCurrencies: ['MAD'],
      },
    },
    capabilities: {
      quotes: true,
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
    environment: {
      wooCommerceUrl: 'https://internal-woo.provider.net',
      wordpressUrl: 'https://internal-wp.provider.net',
      searchUrl: 'https://internal-search.provider.net',
      cdnUrl: 'https://cdn.demobrand.ma',
      storefrontUrl: 'https://demobrand.ma',
    },
  };

  it('allows customizing brand identity (logo, colors, typography, navigation, locales) cleanly', () => {
    const profile = loadClientProfile(baseValidProfile);
    expect(profile.name).toBe('Demo Client Store');
    expect(profile.brand.navigation).toHaveLength(3);
    expect(profile.brand.navigation?.[2]?.label).toBe('Devis Pro');
    expect(profile.brand.commerce?.supportedLocales).toEqual(['fr', 'ar', 'en']);

    const resolved = resolveBrandConfiguration(profile.brand);
    expect(resolved.name).toBe('Demo Brand');
    expect(resolved.navigation).toHaveLength(3);
    expect(resolved.commerce.defaultCurrency).toBe('MAD');
    expect(resolved.colors.primary).toBe(hexToHsl('#171817'));
  });

  it('protects server-only environment values when projecting to PublicClientProfile', () => {
    const profile = loadClientProfile(baseValidProfile);
    const publicProfile = toPublicClientProfile(profile);

    // Public properties present
    expect(publicProfile.id).toBe('demo-client');
    expect(publicProfile.brand.name).toBe('Demo Brand');
    expect(publicProfile.environment.cdnUrl).toBe('https://cdn.demobrand.ma');
    expect(publicProfile.environment.storefrontUrl).toBe('https://demobrand.ma');

    // Sensitive internal topology strictly stripped
    const envAny = publicProfile.environment as Record<string, unknown>;
    expect(envAny.wooCommerceUrl).toBeUndefined();
    expect(envAny.wordpressUrl).toBeUndefined();
    expect(envAny.searchUrl).toBeUndefined();
    expect('wooCommerceUrl' in publicProfile.environment).toBe(false);
    expect('wordpressUrl' in publicProfile.environment).toBe(false);
  });

  it('rejects environment URLs containing embedded credentials or secret tokens', () => {
    const hostileProfile = {
      ...baseValidProfile,
      environment: {
        ...baseValidProfile.environment,
        wooCommerceUrl: 'https://admin:supersecret@woo.provider.net',
      },
    };

    expect(() => loadClientProfile(hostileProfile)).toThrow(ConfigurationValidationError);
  });

  it('switches between themes without altering commerce configurations or payment methods', () => {
    const defaultProfile = loadClientProfile(baseValidProfile);
    const resolvedDefault = resolveBrandConfiguration(defaultProfile.brand, 'default');
    const resolvedDemo2 = resolveBrandConfiguration(defaultProfile.brand, 'demo-2');
    const resolvedParaloca = resolveBrandConfiguration(defaultProfile.brand, 'paraloca');

    // Layout slots differ according to theme
    expect(resolvedDemo2.slots.variantSelector).toBe('dropdown');
    expect(resolvedParaloca.slots.variantSelector).toBe('pills');
    expect(resolvedDemo2.slots.header).toBe('minimal');
    expect(resolvedParaloca.slots.header).toBe('standard');

    // Commerce rules remain strictly identical and untouched
    expect(defaultProfile.commerce.allowedPaymentMethods).toEqual(['cod']);
    expect(defaultProfile.brand.commerce?.defaultCurrency).toBe('MAD');
    expect(defaultProfile.commerce.allowedCountries).toEqual(['MA']);
  });


  it('validates canonical ParaLoca client profile against the strict schema', () => {
    const validated = loadClientProfile(paralocaProfile);
    expect(validated.id).toBe('paraloca');
    expect(validated.name).toBe('ParaLoca');
    expect(validated.capabilities.customerAccounts).toBe(false);
    expect(validated.commerce.allowedPaymentMethods).toEqual(['cod']);

    // Public projection strips internal backend hostnames
    const pub = toPublicClientProfile(validated);
    expect(pub.environment.storefrontUrl).toBe('https://paraloca.ma');
    expect('wooCommerceUrl' in pub.environment).toBe(false);
    expect('wordpressUrl' in pub.environment).toBe(false);
  });
});
