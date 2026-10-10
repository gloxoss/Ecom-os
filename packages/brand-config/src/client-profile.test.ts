import { describe, it, expect } from 'vitest';
import {
  ClientProfileSchema,
  loadClientProfile,
  toPublicClientProfile,
  resolveEnvironmentUrlsFromEnv,
  type ClientProfile,
} from './client-profile';
import { ConfigurationValidationError, type BrandConfig } from './schema';

const sampleBrandConfig: BrandConfig = {
  name: 'ParaLoca Santé',
  slug: 'paraloca',
  theme: 'paraloca',
  logos: {
    light: '/images/paraloca-light.svg',
    dark: '/images/paraloca-dark.svg',
    favicon: '/favicon.ico',
  },
  colors: {
    primary: '#0ea5e9',
    secondary: '#0284c7',
    accent: '#f59e0b',
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#f1f5f9',
  },
  fonts: {
    sans: 'Inter, sans-serif',
    mono: 'monospace',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  hero: {
    headline: 'Votre Parapharmacie en Ligne au Maroc',
    subheadline: 'Produits certifiés et livraison rapide',
    ctaLabel: 'Découvrir le catalogue',
    ctaHref: '/catalog',
    image: '/images/hero-paraloca.webp',
  },
  contact: {
    email: 'contact@paraloca.ma',
    phone: '+212522000000',
    address: 'Casablanca, Maroc',
  },
};

const validManifest: ClientProfile = {
  id: 'paraloca-sante',
  name: 'ParaLoca Santé',
  version: '1.0.0',
  brand: sampleBrandConfig,
  capabilities: {
    quotes: true,
    multiCurrency: false,
    guestCheckout: true,
    customerAccounts: false,
    reviews: false,
    wishlist: false,
    newsletter: true,
    facetedSearch: true,
  },
  commerce: {
    allowedCountries: ['MA'],
    defaultCountry: 'MA',
    allowedPaymentMethods: ['cod'],
    allowedShippingMethods: ['standard_delivery', 'express_delivery'],
    defaultShippingMethod: 'standard_delivery',
  },
  industry: {
    industry: 'pharmaceutical',
    complianceDisclaimers: [
      'Produits de parapharmacie conformes aux normes sanitaires marocaines.',
      'Ne remplace pas un avis médical professionnel.',
    ],
    requiresPrescriptionValidation: false,
    requiresAgeVerification: true,
    minimumAge: 18,
    regulatedProductNotice: 'Vente réservée aux personnes majeures.',
  },
  environment: {
    wooCommerceUrl: 'https://woo.paraloca.internal',
    wordpressUrl: 'https://wp.paraloca.internal',
    searchUrl: 'https://search.paraloca.internal',
    cdnUrl: 'https://cdn.paraloca.ma',
    storefrontUrl: 'https://paraloca.ma',
  },
};

describe('ClientProfile manifest validation (ECO-402)', () => {
  it('validates a complete, compliant client profile manifest', () => {
    const profile = loadClientProfile(validManifest);
    expect(profile.id).toBe('paraloca-sante');
    expect(profile.brand.name).toBe('ParaLoca Santé');
    expect(profile.capabilities.quotes).toBe(true);
    expect(profile.capabilities.guestCheckout).toBe(true);
    expect(profile.capabilities.customerAccounts).toBe(false);
    expect(profile.commerce.allowedCountries).toEqual(['MA']);
    expect(profile.industry?.industry).toBe('pharmaceutical');
    expect(profile.environment.wooCommerceUrl).toBe('https://woo.paraloca.internal');
  });

  describe('Capability boundaries and invariants', () => {
    it('applies default capability flags when not explicitly provided', () => {
      const parsed = ClientProfileSchema.parse({
        ...validManifest,
        capabilities: {},
      });
      expect(parsed.capabilities.guestCheckout).toBe(true);
      expect(parsed.capabilities.customerAccounts).toBe(false);
      expect(parsed.capabilities.quotes).toBe(false);
      expect(parsed.capabilities.facetedSearch).toBe(true);
    });

    it('rejects client profile if customerAccounts capability is enabled (Phase 4 invariant)', () => {
      const invalid = {
        ...validManifest,
        capabilities: {
          ...validManifest.capabilities,
          customerAccounts: true,
        },
      };

      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
      expect(() => loadClientProfile(invalid)).toThrow(/Customer accounts are disabled/);
    });

    it('rejects unknown or arbitrary capability keys (prevent unauthorized privilege escalation)', () => {
      const invalid = {
        ...validManifest,
        capabilities: {
          ...validManifest.capabilities,
          arbitraryAdminBypass: true,
        },
      };

      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
    });
  });

  describe('Commerce and payment boundaries', () => {
    it('rejects uncertified payment methods (only certified "cod" permitted)', () => {
      const invalid = {
        ...validManifest,
        commerce: {
          ...validManifest.commerce,
          allowedPaymentMethods: ['stripe', 'cmi'],
        },
      };

      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
      expect(() => loadClientProfile(invalid)).toThrow(/Only certified payment methods are permitted/);
    });

    it('rejects if allowedCountries is empty', () => {
      const invalid = {
        ...validManifest,
        commerce: {
          ...validManifest.commerce,
          allowedCountries: [],
        },
      };

      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
    });

    it('rejects if defaultCountry is not in allowedCountries', () => {
      const invalid = {
        ...validManifest,
        commerce: {
          ...validManifest.commerce,
          allowedCountries: ['MA'],
          defaultCountry: 'FR',
        },
      };

      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
      expect(() => loadClientProfile(invalid)).toThrow(/defaultCountry must be one of the allowedCountries/);
    });

    it('rejects invalid country ISO format (must be 2 uppercase characters)', () => {
      const invalid = {
        ...validManifest,
        commerce: {
          ...validManifest.commerce,
          allowedCountries: ['morocco'],
          defaultCountry: 'morocco',
        },
      };

      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
    });

    it('rejects if defaultShippingMethod is not in allowedShippingMethods', () => {
      const invalid = {
        ...validManifest,
        commerce: {
          ...validManifest.commerce,
          defaultShippingMethod: 'drone_delivery',
        },
      };

      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
      expect(() => loadClientProfile(invalid)).toThrow(/defaultShippingMethod must be one of the allowedShippingMethods/);
    });
  });

  describe('Industry metadata and regulatory compliance', () => {
    it('accepts valid industry metadata and regulatory notices', () => {
      const profile = loadClientProfile(validManifest);
      expect(profile.industry?.industry).toBe('pharmaceutical');
      expect(profile.industry?.requiresAgeVerification).toBe(true);
      expect(profile.industry?.minimumAge).toBe(18);
    });

    it('rejects invalid industry enum value', () => {
      const invalid = {
        ...validManifest,
        industry: {
          ...validManifest.industry,
          industry: 'aerospace_defense',
        },
      };

      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
    });

    it('rejects if requiresAgeVerification is true but minimumAge is missing or 0', () => {
      const invalid = {
        ...validManifest,
        industry: {
          ...validManifest.industry,
          requiresAgeVerification: true,
          minimumAge: 0,
        },
      };

      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
      expect(() => loadClientProfile(invalid)).toThrow(/minimumAge must be specified and greater than 0/);
    });
  });

  describe('Environment URLs and secret decoupling', () => {
    it('accepts valid HTTP/HTTPS URLs', () => {
      const profile = loadClientProfile(validManifest);
      expect(profile.environment.wooCommerceUrl).toBe('https://woo.paraloca.internal');
      expect(profile.environment.wordpressUrl).toBe('https://wp.paraloca.internal');
    });

    it('rejects environment URLs containing embedded credentials or secrets', () => {
      const invalid = {
        ...validManifest,
        environment: {
          ...validManifest.environment,
          wooCommerceUrl: 'https://admin:supersecret@woo.paraloca.internal',
        },
      };

      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
      expect(() => loadClientProfile(invalid)).toThrow(/insecure wooCommerceUrl/);
    });

    it('rejects insecure protocols (e.g. javascript:, file:, ftp:)', () => {
      const invalid = {
        ...validManifest,
        environment: {
          ...validManifest.environment,
          wordpressUrl: 'file:///etc/passwd',
        },
      };

      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
    });

    it('overrides environment URLs with runtime envOverrides', () => {
      const overridden = loadClientProfile(validManifest, {
        wooCommerceUrl: 'https://staging-woo.paraloca.internal',
        searchUrl: 'https://staging-search.paraloca.internal',
      });

      expect(overridden.environment.wooCommerceUrl).toBe('https://staging-woo.paraloca.internal');
      expect(overridden.environment.searchUrl).toBe('https://staging-search.paraloca.internal');
      expect(overridden.environment.wordpressUrl).toBe('https://wp.paraloca.internal');
    });

    it('resolves environment URLs from environment variables', () => {
      const mockEnv = {
        WOOCOMMERCE_URL: 'https://env-woo.example.com',
        WORDPRESS_URL: 'https://env-wp.example.com',
        CDN_URL: 'https://env-cdn.example.com',
      };

      const resolved = resolveEnvironmentUrlsFromEnv(mockEnv);
      expect(resolved.wooCommerceUrl).toBe('https://env-woo.example.com');
      expect(resolved.wordpressUrl).toBe('https://env-wp.example.com');
      expect(resolved.cdnUrl).toBe('https://env-cdn.example.com');
      expect(resolved.searchUrl).toBeUndefined();
    });
  });

  describe('Public client profile projection (toPublicClientProfile)', () => {
    it('strips private backend topology and retains safe presentation settings', () => {
      const profile = loadClientProfile(validManifest);
      const publicProfile = toPublicClientProfile(profile);

      // Verify identity and presentation
      expect(publicProfile.id).toBe('paraloca-sante');
      expect(publicProfile.name).toBe('ParaLoca Santé');
      expect(publicProfile.brand.name).toBe('ParaLoca Santé');
      expect(publicProfile.capabilities.guestCheckout).toBe(true);

      // Verify public environment URLs
      expect(publicProfile.environment.cdnUrl).toBe('https://cdn.paraloca.ma');
      expect(publicProfile.environment.storefrontUrl).toBe('https://paraloca.ma');

      // CRITICAL: internal backend URLs must NOT exist on public projection
      const rawEnv = publicProfile.environment as Record<string, unknown>;
      expect(rawEnv.wooCommerceUrl).toBeUndefined();
      expect(rawEnv.wordpressUrl).toBeUndefined();
      expect(rawEnv.searchUrl).toBeUndefined();
    });

    it('retains industry compliance disclaimers on public projection', () => {
      const profile = loadClientProfile(validManifest);
      const publicProfile = toPublicClientProfile(profile);

      expect(publicProfile.industry?.industry).toBe('pharmaceutical');
      expect(publicProfile.industry?.complianceDisclaimers).toHaveLength(2);
      expect(publicProfile.industry?.minimumAge).toBe(18);
    });
  });

  describe('Edge cases and malformed inputs', () => {
    it('throws when rawManifest is null or not an object', () => {
      expect(() => loadClientProfile(null)).toThrow(ConfigurationValidationError);
      expect(() => loadClientProfile('not-an-object')).toThrow(ConfigurationValidationError);
    });

    it('rejects invalid client profile ID format', () => {
      const invalid = {
        ...validManifest,
        id: 'ParaLoca Invalid With Spaces',
      };
      expect(() => loadClientProfile(invalid)).toThrow(ConfigurationValidationError);
    });
  });
});
