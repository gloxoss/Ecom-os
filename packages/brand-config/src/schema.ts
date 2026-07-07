import { z } from 'zod';

export const BrandConfigSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  logos: z.object({
    light: z.string().min(1, 'Light logo path is required'),
    dark: z.string().min(1, 'Dark logo path is required'),
  }),
  colors: z.object({
    primary: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color'),
    secondary: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color'),
    accent: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color'),
    background: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color'),
    foreground: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color'),
    muted: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color'),
  }),
  fonts: z.object({
    sans: z.string().min(1, 'Sans font is required'),
    mono: z.string().min(1, 'Mono font is required'),
  }),
  radii: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
  }),
  hero: z.object({
    headline: z.string(),
    subheadline: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
    image: z.string(),
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
  }),
  social: z.object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
  }).optional(),
});

export type BrandConfig = z.infer<typeof BrandConfigSchema>;
