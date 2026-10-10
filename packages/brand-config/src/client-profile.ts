import { z } from 'zod';
import { BrandConfigSchema, ConfigurationValidationError, type BrandConfig } from './schema';

/**
 * Capability flags defining what features this client deployment enables.
 * Disallows unknown fields to prevent unauthorized capability injection.
 */
export const ClientCapabilitiesSchema = z
  .object({
    quotes: z.boolean().default(false),
    multiCurrency: z.boolean().default(false),
    guestCheckout: z.boolean().default(true),
    customerAccounts: z.boolean().default(false),
    reviews: z.boolean().default(false),
    wishlist: z.boolean().default(false),
    newsletter: z.boolean().default(false),
    facetedSearch: z.boolean().default(true),
  })
  .strict();

export type ClientCapabilities = z.infer<typeof ClientCapabilitiesSchema>;

/**
 * Certified payment methods supported by EcomOS in this phase.
 * Invariant: uncertified payment gateways (like direct Stripe/CMI without certification)
 * cannot be enabled arbitrarily.
 */
export const CERTIFIED_PAYMENT_METHODS = ['cod'] as const;
export type CertifiedPaymentMethod = (typeof CERTIFIED_PAYMENT_METHODS)[number];

/**
 * Commerce, country, currency, payment and shipping rules for the client.
 */
export const CommerceRulesSchema = z
  .object({
    allowedCountries: z
      .array(z.string().length(2).regex(/^[A-Z]{2}$/, 'Country code must be 2 uppercase ISO letters'))
      .min(1, 'At least one allowed country is required'),
    defaultCountry: z.string().length(2).regex(/^[A-Z]{2}$/),
    allowedPaymentMethods: z.array(z.string().min(1)).min(1, 'At least one payment method is required'),
    allowedShippingMethods: z.array(z.string().min(1)).min(1, 'At least one shipping method is required'),
    defaultShippingMethod: z.string().min(1),
  })
  .strict()
  .refine((data) => data.allowedCountries.includes(data.defaultCountry), {
    message: 'defaultCountry must be one of the allowedCountries',
    path: ['defaultCountry'],
  })
  .refine((data) => data.allowedShippingMethods.includes(data.defaultShippingMethod), {
    message: 'defaultShippingMethod must be one of the allowedShippingMethods',
    path: ['defaultShippingMethod'],
  });

export type CommerceRules = z.infer<typeof CommerceRulesSchema>;

/**
 * Industry metadata and compliance parameters.
 */
export const IndustryMetadataSchema = z
  .object({
    industry: z.enum([
      'pharmaceutical',
      'general_retail',
      'cosmetics',
      'food_beverage',
      'b2b_industrial',
      'fashion',
      'services',
    ]),
    complianceDisclaimers: z.array(z.string().min(1)).optional(),
    requiresPrescriptionValidation: z.boolean().default(false),
    requiresAgeVerification: z.boolean().default(false),
    minimumAge: z.number().int().min(1).max(120).optional(),
    regulatedProductNotice: z.string().min(1).optional(),
    licenseNumber: z.string().min(1).optional(),
  })
  .strict()
  .refine(
    (data) => !data.requiresAgeVerification || (typeof data.minimumAge === 'number' && data.minimumAge > 0),
    {
      message: 'minimumAge must be specified and greater than 0 when requiresAgeVerification is true',
      path: ['minimumAge'],
    }
  );

export type IndustryMetadata = z.infer<typeof IndustryMetadataSchema>;

/**
 * Helper to validate URL string and ensure it contains no embedded secrets/credentials.
 */
function isSafeUrl(val: string): boolean {
  try {
    const parsed = new URL(val);
    if (parsed.username || parsed.password) {
      return false;
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * External environment URLs separated from application code.
 * Decoupled from static code and deployment artifacts.
 * Secrets/tokens are strictly forbidden in environment URL configurations.
 */
export const EnvironmentUrlsSchema = z
  .object({
    wooCommerceUrl: z
      .string()
      .refine(isSafeUrl, 'Invalid or insecure wooCommerceUrl; must be valid HTTP/S without embedded credentials'),
    wordpressUrl: z
      .string()
      .refine(isSafeUrl, 'Invalid or insecure wordpressUrl; must be valid HTTP/S without embedded credentials'),
    searchUrl: z
      .string()
      .refine(isSafeUrl, 'Invalid or insecure searchUrl; must be valid HTTP/S without embedded credentials')
      .optional(),
    cdnUrl: z
      .string()
      .refine(isSafeUrl, 'Invalid or insecure cdnUrl; must be valid HTTP/S without embedded credentials')
      .optional(),
    storefrontUrl: z
      .string()
      .refine(isSafeUrl, 'Invalid or insecure storefrontUrl; must be valid HTTP/S without embedded credentials')
      .optional(),
  })
  .strict();

export type EnvironmentUrls = z.infer<typeof EnvironmentUrlsSchema>;

/**
 * Complete ClientProfile manifest schema.
 */
export const ClientProfileSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Client profile ID is required')
      .regex(/^[a-z0-9-]+$/, 'Client profile ID must be kebab-case or alphanumeric'),
    name: z.string().min(1, 'Client profile name is required'),
    version: z.string().min(1, 'Profile version is required'),
    brand: BrandConfigSchema,
    capabilities: ClientCapabilitiesSchema,
    commerce: CommerceRulesSchema,
    industry: IndustryMetadataSchema.optional(),
    environment: EnvironmentUrlsSchema,
  })
  .strict()
  .refine(
    (data) => {
      // Invariant: Customer accounts stay disabled in current phase architecture
      if (data.capabilities.customerAccounts) {
        return false;
      }
      return true;
    },
    {
      message: 'Customer accounts are disabled by architectural invariant in Phase 4',
      path: ['capabilities', 'customerAccounts'],
    }
  )
  .refine(
    (data) => {
      // Invariant: uncertified payment gateways cannot be enabled without certification
      const certified = CERTIFIED_PAYMENT_METHODS as readonly string[];
      return data.commerce.allowedPaymentMethods.every((method) => certified.includes(method));
    },
    {
      message: 'Only certified payment methods are permitted (certified: "cod")',
      path: ['commerce', 'allowedPaymentMethods'],
    }
  );

export type ClientProfile = z.infer<typeof ClientProfileSchema>;

/**
 * Public client profile projection safe for transmission to client-side components and browser bundles.
 * Strips internal backend URLs (wooCommerceUrl, wordpressUrl, searchUrl) and sensitive topology.
 */
export interface PublicClientProfile {
  id: string;
  name: string;
  version: string;
  brand: BrandConfig;
  capabilities: ClientCapabilities;
  commerce: {
    allowedCountries: string[];
    defaultCountry: string;
    allowedPaymentMethods: string[];
    allowedShippingMethods: string[];
    defaultShippingMethod: string;
  };
  industry?: IndustryMetadata | undefined;
  environment: {
    cdnUrl?: string | undefined;
    storefrontUrl?: string | undefined;
  };
}

/**
 * Projects a validated ClientProfile to a safe public payload without backend topology secrets.
 */
export function toPublicClientProfile(profile: ClientProfile): PublicClientProfile {
  return {
    id: profile.id,
    name: profile.name,
    version: profile.version,
    brand: profile.brand,
    capabilities: profile.capabilities,
    commerce: {
      allowedCountries: [...profile.commerce.allowedCountries],
      defaultCountry: profile.commerce.defaultCountry,
      allowedPaymentMethods: [...profile.commerce.allowedPaymentMethods],
      allowedShippingMethods: [...profile.commerce.allowedShippingMethods],
      defaultShippingMethod: profile.commerce.defaultShippingMethod,
    },
    ...(profile.industry ? { industry: profile.industry } : {}),
    environment: {
      ...(profile.environment.cdnUrl ? { cdnUrl: profile.environment.cdnUrl } : {}),
      ...(profile.environment.storefrontUrl ? { storefrontUrl: profile.environment.storefrontUrl } : {}),
    },
  };
}

/**
 * Resolves environment URLs from standard environment variables.
 */
export function resolveEnvironmentUrlsFromEnv(
  env: Record<string, string | undefined> = process.env
): Partial<EnvironmentUrls> {
  const result: Partial<EnvironmentUrls> = {};
  if (env.WOOCOMMERCE_URL) result.wooCommerceUrl = env.WOOCOMMERCE_URL;
  if (env.WORDPRESS_URL) result.wordpressUrl = env.WORDPRESS_URL;
  if (env.SEARCH_URL) result.searchUrl = env.SEARCH_URL;
  if (env.CDN_URL) result.cdnUrl = env.CDN_URL;
  if (env.STOREFRONT_URL) result.storefrontUrl = env.STOREFRONT_URL;
  return result;
}

/**
 * Loads and validates a client profile manifest with optional runtime environment overrides.
 * Ensures environment URLs are cleanly separated and validated.
 * Throws ConfigurationValidationError with actionable issues if invalid.
 */
export function loadClientProfile(
  rawManifest: unknown,
  envOverrides?: Partial<EnvironmentUrls>
): ClientProfile {
  if (typeof rawManifest !== 'object' || rawManifest === null) {
    throw new ConfigurationValidationError('Raw manifest must be a non-null object');
  }

  const manifest = { ...(rawManifest as Record<string, unknown>) };

  if (envOverrides) {
    const rawEnv = (manifest.environment as Record<string, unknown>) ?? {};
    const filteredOverrides: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(envOverrides)) {
      if (v !== undefined) {
        filteredOverrides[k] = v;
      }
    }
    manifest.environment = {
      ...rawEnv,
      ...filteredOverrides,
    };
  }

  const result = ClientProfileSchema.safeParse(manifest);
  if (!result.success) {
    const issues = result.error.issues;
    const msg = issues.map((i) => `[${i.path.join('.') || 'root'}]: ${i.message}`).join('; ');
    throw new ConfigurationValidationError(`Invalid client profile: ${msg}`, issues);
  }

  return result.data;
}
