import React from 'react';

export type CssVars = Record<string, string>;

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface ThemeRadii {
  sm: string;
  md: string;
  lg: string;
  full?: string;
}

export interface ThemeTypography {
  fontSans?: string;
  fontSerif?: string;
  fontMono?: string;
}

export interface LayoutSlots {
  header?: 'standard' | 'minimal' | 'centered';
  hero?: 'split' | 'centered' | 'fullwidth' | 'minimal';
  productGrid?: '3-column' | '4-column' | 'compact';
  footer?: 'multi-column' | 'simple';
  variantSelector?: 'pills' | 'dropdown' | 'swatches';
}

export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  radius: string;
  radii?: ThemeRadii;
  fonts?: ThemeTypography;
  fontSans?: string;
  fontSerif?: string;
  slots?: LayoutSlots;
}

export interface EcomTheme {
  config: ThemeConfig;
  // Allows mapping specific named views/templates to React components
  templates?: Record<string, React.ComponentType<any>>;
}

/**
 * Maps ThemeConfig colors and radius into CSS custom properties.
 */
export function themeConfigToCssVars(config: ThemeConfig): Record<string, string> {
  const vars: Record<string, string> = {
    '--background': config.colors.background,
    '--foreground': config.colors.foreground,
    '--card': config.colors.card,
    '--card-foreground': config.colors.cardForeground,
    '--popover': config.colors.popover,
    '--popover-foreground': config.colors.popoverForeground,
    '--primary': config.colors.primary,
    '--primary-foreground': config.colors.primaryForeground,
    '--secondary': config.colors.secondary,
    '--secondary-foreground': config.colors.secondaryForeground,
    '--muted': config.colors.muted,
    '--muted-foreground': config.colors.mutedForeground,
    '--accent': config.colors.accent,
    '--accent-foreground': config.colors.accentForeground,
    '--destructive': config.colors.destructive,
    '--destructive-foreground': config.colors.destructiveForeground,
    '--border': config.colors.border,
    '--input': config.colors.input,
    '--ring': config.colors.ring,
    '--radius': config.radius,
  };

  if (config.fontSans || config.fonts?.fontSans) {
    vars['--font-sans'] = config.fontSans ?? config.fonts?.fontSans ?? '';
  }
  if (config.fontSerif || config.fonts?.fontSerif) {
    vars['--font-serif'] = config.fontSerif ?? config.fonts?.fontSerif ?? '';
  }
  if (config.fonts?.fontMono) {
    vars['--font-mono'] = config.fonts.fontMono;
  }
  if (config.radii?.sm) vars['--radius-sm'] = config.radii.sm;
  if (config.radii?.md) vars['--radius-md'] = config.radii.md;
  if (config.radii?.lg) vars['--radius-lg'] = config.radii.lg;

  return vars;
}
