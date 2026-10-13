import { getTheme, type ThemeConfig } from '../../themes/src';
import {
  type BrandConfig,
  type CommerceConfig,
  type LayoutSlots,
  type NavigationItem,
  validateBrandConfig,
} from './schema';

export interface ResolvedBrandConfiguration {
  name: string;
  themeName: string;
  navigation: NavigationItem[];
  logos: {
    light: string;
    dark: string;
    favicon?: string | undefined;
  };
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    input: string;
    border: string;
    ring: string;
    destructive: string;
    destructiveForeground: string;
  };
  fonts: {
    sans: string;
    serif?: string | undefined;
    mono: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  slots: LayoutSlots;
  commerce: CommerceConfig;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
  };
  cssVariables: Record<string, string>;
  generateCSS: (selector?: string) => string;
}

/**
 * Trim a float to at most `digits` decimals, dropping trailing zeros, so the
 * emitted CSS stays readable ("30.4167", not "30.416700").
 */
function formatHslChannel(value: number, digits = 4): string {
  return String(Number(value.toFixed(digits)));
}

/**
 * Convert a brand colour to the bare HSL triplet the stylesheets use
 * ("30.4167 73.4694% 38.4314%"), which callers read back as `hsl(<triplet>)`.
 *
 * The channels are deliberately NOT rounded to whole numbers. Rounding is lossy:
 * #aa631a rounded to "30 73% 38%" renders as #a8611a, so every colour that took
 * the trip would come back a shade off. 4 decimals keeps the worst-case error
 * near 0.03/255, well inside the eight-bit rounding boundary, so
 * `hsl(hexToHsl(c))` renders exactly `c` and the generated tokens cannot drift
 * away from the brand file they came from.
 */
export function hexToHsl(value: string): string {
  const trimmed = value.trim();
  // If already in HSL format (e.g. "30 73% 38%" or "hsl(...)"), normalize it
  if (!trimmed.startsWith('#')) {
    return trimmed.replace(/^hsl\(/i, '').replace(/\)$/, '').replace(/,/g, ' ').trim();
  }

  let hex = trimmed.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${formatHslChannel(h * 360)} ${formatHslChannel(s * 100)}% ${formatHslChannel(l * 100)}%`;
}

export const DEFAULT_COMMERCE_CONFIG: CommerceConfig = {
  defaultLocale: 'fr',
  supportedLocales: ['fr'],
  defaultCurrency: 'MAD',
  supportedCurrencies: ['MAD'],
};

export const DEFAULT_LAYOUT_SLOTS: LayoutSlots = {
  header: 'standard',
  hero: 'split',
  productGrid: '4-column',
  footer: 'multi-column',
  variantSelector: 'pills',
};

export const DEFAULT_NAVIGATION_LINKS: NavigationItem[] = [
  { label: 'Catalog', href: '/catalog', isExternal: false },
  { label: 'About Us', href: '/about-us', isExternal: false },
  { label: 'Contact', href: '/contact-us', isExternal: false },
];

/**
 * Resolves configuration precedence across layers:
 * 1. Default system values (Base)
 * 2. Theme definitions (@ecom-os/themes)
 * 3. Client profile / BrandConfig overrides (Highest precedence)
 */
export function resolveBrandConfiguration(
  input: unknown,
  themeOverride?: string,
): ResolvedBrandConfiguration {
  const profile = validateBrandConfig(input);
  const themeName = themeOverride ?? profile.theme ?? 'default';
  const theme = getTheme(themeName);
  const themeConfig: ThemeConfig = theme.config;

  // Colors precedence: Theme defaults -> Profile overrides (normalized to HSL)
  const resolvedColors = {
    background: profile.colors.background
      ? hexToHsl(profile.colors.background)
      : themeConfig.colors.background,
    foreground: profile.colors.foreground
      ? hexToHsl(profile.colors.foreground)
      : themeConfig.colors.foreground,
    primary: profile.colors.primary
      ? hexToHsl(profile.colors.primary)
      : themeConfig.colors.primary,
    primaryForeground: themeConfig.colors.primaryForeground,
    secondary: profile.colors.secondary
      ? hexToHsl(profile.colors.secondary)
      : themeConfig.colors.secondary,
    secondaryForeground: themeConfig.colors.secondaryForeground,
    accent: profile.colors.accent
      ? hexToHsl(profile.colors.accent)
      : themeConfig.colors.accent,
    accentForeground: themeConfig.colors.accentForeground,
    muted: profile.colors.muted
      ? hexToHsl(profile.colors.muted)
      : themeConfig.colors.muted,
    mutedForeground: themeConfig.colors.mutedForeground,
    card: profile.colors.card
      ? hexToHsl(profile.colors.card)
      : themeConfig.colors.card,
    cardForeground: themeConfig.colors.cardForeground,
    // The profile schema has no popover or input colour, so these stay theme-only.
    popover: themeConfig.colors.popover,
    popoverForeground: themeConfig.colors.popoverForeground,
    input: themeConfig.colors.input,
    border: profile.colors.border
      ? hexToHsl(profile.colors.border)
      : themeConfig.colors.border,
    ring: profile.colors.ring
      ? hexToHsl(profile.colors.ring)
      : themeConfig.colors.ring,
    destructive: profile.colors.destructive
      ? hexToHsl(profile.colors.destructive)
      : themeConfig.colors.destructive,
    destructiveForeground: themeConfig.colors.destructiveForeground,
  };

  // Fonts precedence: Theme fonts -> Profile overrides
  const resolvedFonts = {
    sans: profile.fonts.sans || themeConfig.fontSans || themeConfig.fonts?.fontSans || 'sans-serif',
    serif: profile.fonts.serif || themeConfig.fontSerif || themeConfig.fonts?.fontSerif,
    mono: profile.fonts.mono || themeConfig.fonts?.fontMono || 'monospace',
  };

  // Radii precedence: Theme radii -> Profile overrides
  const resolvedRadii = {
    sm: profile.radii.sm || themeConfig.radii?.sm || '8px',
    md: profile.radii.md || themeConfig.radii?.md || themeConfig.radius || '12px',
    lg: profile.radii.lg || themeConfig.radii?.lg || '16px',
    full: profile.radii.full || themeConfig.radii?.full || '9999px',
  };

  // Slots precedence: Theme slots -> Profile slots
  const resolvedSlots: LayoutSlots = {
    header: profile.slots?.header ?? themeConfig.slots?.header ?? DEFAULT_LAYOUT_SLOTS.header,
    hero: profile.slots?.hero ?? themeConfig.slots?.hero ?? DEFAULT_LAYOUT_SLOTS.hero,
    productGrid:
      profile.slots?.productGrid ??
      themeConfig.slots?.productGrid ??
      DEFAULT_LAYOUT_SLOTS.productGrid,
    footer: profile.slots?.footer ?? themeConfig.slots?.footer ?? DEFAULT_LAYOUT_SLOTS.footer,
    variantSelector:
      profile.variantSelection ??
      profile.slots?.variantSelector ??
      themeConfig.slots?.variantSelector ??
      DEFAULT_LAYOUT_SLOTS.variantSelector,
  };

  // Commerce precedence: Default commerce -> Profile commerce
  const resolvedCommerce: CommerceConfig = {
    defaultLocale: profile.commerce?.defaultLocale ?? DEFAULT_COMMERCE_CONFIG.defaultLocale,
    supportedLocales:
      profile.commerce?.supportedLocales ?? DEFAULT_COMMERCE_CONFIG.supportedLocales,
    defaultCurrency: profile.commerce?.defaultCurrency ?? DEFAULT_COMMERCE_CONFIG.defaultCurrency,
    supportedCurrencies:
      profile.commerce?.supportedCurrencies ?? DEFAULT_COMMERCE_CONFIG.supportedCurrencies,
  };

  // Build CSS custom properties dictionary
  const cssVariables: Record<string, string> = {
    '--background': resolvedColors.background,
    '--foreground': resolvedColors.foreground,
    '--card': resolvedColors.card,
    '--card-foreground': resolvedColors.cardForeground,
    '--popover': resolvedColors.popover,
    '--popover-foreground': resolvedColors.popoverForeground,
    '--input': resolvedColors.input,
    '--primary': resolvedColors.primary,
    '--primary-foreground': resolvedColors.primaryForeground,
    '--secondary': resolvedColors.secondary,
    '--secondary-foreground': resolvedColors.secondaryForeground,
    '--accent': resolvedColors.accent,
    '--accent-foreground': resolvedColors.accentForeground,
    '--muted': resolvedColors.muted,
    '--muted-foreground': resolvedColors.mutedForeground,
    '--border': resolvedColors.border,
    '--ring': resolvedColors.ring,
    '--destructive': resolvedColors.destructive,
    '--destructive-foreground': resolvedColors.destructiveForeground,
    '--radius': resolvedRadii.md,
    '--radius-sm': resolvedRadii.sm,
    '--radius-md': resolvedRadii.md,
    '--radius-lg': resolvedRadii.lg,
    '--font-sans': resolvedFonts.sans,
    '--font-mono': resolvedFonts.mono,
  };
  if (resolvedFonts.serif) {
    cssVariables['--font-serif'] = resolvedFonts.serif;
  }

  function generateCSS(selector: string = ':root'): string {
    const entries = Object.entries(cssVariables)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    return `${selector} {\n${entries}\n}`;
  }

  return {
    name: profile.name,
    themeName,
    navigation:
      profile.navigation && profile.navigation.length > 0
        ? profile.navigation
        : DEFAULT_NAVIGATION_LINKS,
    logos: profile.logos,
    colors: resolvedColors,
    fonts: resolvedFonts,
    radii: resolvedRadii,
    slots: resolvedSlots,
    commerce: resolvedCommerce,
    contact: profile.contact,
    hero: profile.hero,
    cssVariables,
    generateCSS,
  };
}
