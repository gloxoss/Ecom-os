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

export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  radius: string;
  fontSans?: string;
  fontSerif?: string;
}

export interface EcomTheme {
  config: ThemeConfig;
  // Allows mapping specific named views/templates to React components
  templates?: Record<string, React.ComponentType<any>>;
}
