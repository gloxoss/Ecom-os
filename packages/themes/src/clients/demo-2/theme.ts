import { EcomTheme } from '../../types';

export const demo2Theme: EcomTheme = {
  config: {
    name: 'demo-2',
    radius: '0.25rem',
    radii: {
      sm: '2px',
      md: '4px',
      lg: '6px',
    },
    colors: {
      background: '210 40% 98%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      popover: '0 0% 100%',
      popoverForeground: '222.2 84% 4.9%',
      primary: '222.2 47.4% 11.2%',
      primaryForeground: '210 40% 98%',
      secondary: '215.4 16.3% 46.9%',
      secondaryForeground: '210 40% 98%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '199 89% 48%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '199 89% 48%',
    },
    slots: {
      header: 'minimal',
      hero: 'minimal',
      productGrid: '3-column',
      variantSelector: 'dropdown',
      footer: 'simple',
    },
    fontSans: '"Inter", sans-serif',
  },
};
