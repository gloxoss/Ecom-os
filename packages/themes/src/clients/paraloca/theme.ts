import { EcomTheme } from '../../types';

/**
 * ParaLoca Theme Definition.
 * Editorial warmth x precise clinical commerce.
 * Derived from approved tokens in references/PARALOCA_DESIGN_REFERENCE.md.
 */
export const paralocaTheme: EcomTheme = {
  config: {
    name: 'paraloca',
    radius: '0.75rem',
    radii: {
      sm: '6px',
      md: '12px',
      lg: '18px',
    },
    colors: {
      background: '0 0% 100%', // #FFFFFF
      foreground: '120 2% 9%', // #171817
      card: '0 0% 100%',
      cardForeground: '120 2% 9%',
      popover: '0 0% 100%',
      popoverForeground: '120 2% 9%',
      primary: '120 2% 9%', // #171817
      primaryForeground: '0 0% 100%',
      secondary: '135 2% 36%', // #595D5A
      secondaryForeground: '0 0% 100%',
      muted: '60 7% 96.5%', // #F6F6F4
      mutedForeground: '133 2% 47.5%', // #767B77
      accent: '170 47% 28.8%', // #276C61
      accentForeground: '0 0% 100%',
      destructive: '0 52% 43.7%', // #A93636
      destructiveForeground: '0 0% 100%',
      border: '84 8% 88.4%', // #E2E4DF
      input: '84 8% 88.4%',
      ring: '213 79% 41%', // #165FBA
    },
    slots: {
      header: 'standard',
      hero: 'split',
      productGrid: '3-column',
      variantSelector: 'pills',
      footer: 'multi-column',
    },
    fontSans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};
