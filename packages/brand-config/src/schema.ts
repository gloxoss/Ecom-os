import { z } from 'zod';

export class ConfigurationValidationError extends Error {
  public readonly issues: z.ZodIssue[];

  constructor(message: string, issues: z.ZodIssue[] = []) {
    super(message);
    this.name = 'ConfigurationValidationError';
    this.issues = issues;
  }
}

export const LayoutSlotsSchema = z.object({
  header: z.enum(['standard', 'minimal', 'centered']).default('standard'),
  hero: z.enum(['split', 'centered', 'fullwidth', 'minimal']).default('split'),
  productGrid: z.enum(['3-column', '4-column', 'compact']).default('4-column'),
  footer: z.enum(['multi-column', 'simple']).default('multi-column'),
  variantSelector: z.enum(['pills', 'dropdown', 'swatches']).default('pills'),
});

export const NavigationItemSchema = z.object({
  label: z.string().min(1, 'Navigation item label is required'),
  href: z.string().min(1, 'Navigation item href is required'),
  badge: z.string().optional(),
  isExternal: z.boolean().default(false),
});

export const CommerceConfigSchema = z.object({
  defaultLocale: z.string().min(2).default('fr'),
  supportedLocales: z.array(z.string().min(2)).min(1).default(['fr']),
  defaultCurrency: z.string().length(3).default('MAD'),
  supportedCurrencies: z.array(z.string().length(3)).min(1).default(['MAD']),
});

export const BrandConfigSchema = z.object({
  name: z.string().min(1, 'Brand name is required and cannot be empty'),
  slug: z.string().min(1).optional(),
  theme: z.string().default('default'),
  navigation: z.array(NavigationItemSchema).optional(),

  logos: z.object({
    light: z.string().min(1, 'Light logo path is required'),
    dark: z.string().min(1, 'Dark logo path is required'),
    favicon: z.string().optional(),
  }),
  colors: z.object({
    primary: z.string().min(1, 'Primary color is required'),
    secondary: z.string().min(1, 'Secondary color is required'),
    accent: z.string().min(1, 'Accent color is required'),
    background: z.string().min(1, 'Background color is required'),
    foreground: z.string().min(1, 'Foreground color is required'),
    muted: z.string().min(1, 'Muted color is required'),
    card: z.string().optional(),
    cardForeground: z.string().optional(),
    border: z.string().optional(),
    ring: z.string().optional(),
    destructive: z.string().optional(),
  }),
  fonts: z.object({
    sans: z.string().min(1, 'Sans font is required'),
    serif: z.string().optional(),
    mono: z.string().min(1, 'Mono font is required'),
  }),
  radii: z.object({
    sm: z.string().default('8px'),
    md: z.string().default('12px'),
    lg: z.string().default('16px'),
    full: z.string().optional(),
  }),
  slots: LayoutSlotsSchema.partial().optional(),
  commerce: CommerceConfigSchema.partial().optional(),
  variantSelection: z.enum(['pills', 'dropdown', 'swatches']).optional(),
  hero: z.object({
    headline: z.string().min(1, 'Hero headline is required'),
    subheadline: z.string(),
    ctaLabel: z.string().min(1, 'CTA label is required'),
    ctaHref: z.string().min(1, 'CTA link is required'),
    image: z.string().min(1, 'Hero image path is required'),
  }),
  contact: z.object({
    email: z.string().email('Contact email must be a valid email address'),
    phone: z.string().min(1, 'Contact phone is required'),
    address: z.string().min(1, 'Contact address is required'),
  }),
  social: z.object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  }).optional(),
});

export type BrandConfig = z.infer<typeof BrandConfigSchema>;
export type LayoutSlots = z.infer<typeof LayoutSlotsSchema>;
export type CommerceConfig = z.infer<typeof CommerceConfigSchema>;
export type NavigationItem = z.infer<typeof NavigationItemSchema>;

/**
 * Validates brand configuration data at build or runtime.
 * Throws a descriptive ConfigurationValidationError if required fields are missing.
 */
export function validateBrandConfig(input: unknown): BrandConfig {
  const result = BrandConfigSchema.safeParse(input);
  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => `[${issue.path.join('.') || 'root'}]: ${issue.message}`)
      .join('; ');
    throw new ConfigurationValidationError(
      `Invalid brand configuration: ${errorMessages}`,
      result.error.issues,
    );
  }
  return result.data;
}
