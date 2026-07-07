import { BrandConfig } from './schema';

export function generateTokensCSS(config: BrandConfig): string {
  return `/* AUTO-GENERATED BRAND TOKENS — DO NOT EDIT BY HAND */

@theme {
  --color-primary: var(--brand-primary);
  --color-secondary: var(--brand-secondary);
  --color-accent: var(--brand-accent);
  --color-background: var(--brand-background);
  --color-foreground: var(--brand-foreground);
  --color-muted: var(--brand-muted);
  
  --font-sans: var(--brand-font-sans);
  --font-mono: var(--brand-font-mono);
  
  --radius-sm: var(--brand-radius-sm);
  --radius-md: var(--brand-radius-md);
  --radius-lg: var(--brand-radius-lg);
}

:root {
  --brand-primary: ${config.colors.primary};
  --brand-secondary: ${config.colors.secondary};
  --brand-accent: ${config.colors.accent};
  --brand-background: ${config.colors.background};
  --brand-foreground: ${config.colors.foreground};
  --brand-muted: ${config.colors.muted};

  --brand-font-sans: ${config.fonts.sans}, ui-sans-serif, system-ui, sans-serif;
  --brand-font-mono: ${config.fonts.mono}, ui-monospace, monospace;

  --brand-radius-sm: ${config.radii.sm};
  --brand-radius-md: ${config.radii.md};
  --brand-radius-lg: ${config.radii.lg};
}
`;
}
