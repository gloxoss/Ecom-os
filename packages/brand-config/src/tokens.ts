import type { ResolvedBrandConfiguration } from './precedence';

/**
 * The palette, in the order the stylesheet lists it. `theme-vars.css` defines
 * each of these as an HSL triplet; the Tailwind tokens below point at the same
 * variables, so a colour a client sets once in `brand.config.ts` reaches
 * Tailwind and the theme system alike.
 */
const PALETTE: ReadonlyArray<readonly [string, keyof ResolvedBrandConfiguration['colors']]> = [
  ['--background', 'background'],
  ['--foreground', 'foreground'],
  ['--card', 'card'],
  ['--card-foreground', 'cardForeground'],
  ['--popover', 'popover'],
  ['--popover-foreground', 'popoverForeground'],
  ['--primary', 'primary'],
  ['--primary-foreground', 'primaryForeground'],
  ['--secondary', 'secondary'],
  ['--secondary-foreground', 'secondaryForeground'],
  ['--muted', 'muted'],
  ['--muted-foreground', 'mutedForeground'],
  ['--accent', 'accent'],
  ['--accent-foreground', 'accentForeground'],
  ['--destructive', 'destructive'],
  ['--destructive-foreground', 'destructiveForeground'],
  ['--border', 'border'],
  ['--input', 'input'],
  ['--ring', 'ring'],
];

/**
 * The Tailwind token names that existed before the palette was shared. They are
 * kept as aliases so anything reading `--brand-primary` keeps working; the value
 * now comes from the theme variable rather than from a second copy of the hex.
 */
const BRAND_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ['--brand-primary', '--primary'],
  ['--brand-secondary', '--secondary'],
  ['--brand-accent', '--accent'],
  ['--brand-background', '--background'],
  ['--brand-foreground', '--foreground'],
  ['--brand-muted', '--muted'],
];

export interface BrandCss {
  /** apps/storefront/src/styles/brand.tokens.css */
  tokensCss: string;
  /** apps/storefront/src/styles/theme-vars.css */
  themeVarsCss: string;
}

/**
 * Generate both stylesheets from one resolved configuration.
 *
 * They used to come from two generators reading two different sources, so the
 * Tailwind tokens and the theme variables could disagree, and did: the theme's
 * HSL variables were never mapped onto a Tailwind token, which left a client
 * setting its colours twice and changing the theme changed nothing on the page.
 * One input, two outputs, no second opinion.
 */
export function generateBrandCss(config: ResolvedBrandConfiguration): BrandCss {
  const themeVarLines = PALETTE.map(
    ([cssVar]) => `    ${cssVar}: ${config.cssVariables[cssVar]};`,
  );
  themeVarLines.push(`    --radius: ${config.cssVariables['--radius']};`);

  const themeVarsCss = [
    '/* AUTO-GENERATED from apps/storefront/brand.config.ts and the active theme — DO NOT EDIT BY HAND */',
    '@layer base {',
    '  :root {',
    ...themeVarLines,
    '  }',
    '}',
    '',
  ].join('\n');

  const aliasLines = BRAND_ALIASES.map(
    ([brandVar, themeVar]) => `  ${brandVar}: hsl(var(${themeVar}));`,
  );

  const tokensCss = [
    '/* AUTO-GENERATED BRAND TOKENS — DO NOT EDIT BY HAND */',
    '',
    '@theme {',
    '  --color-primary: var(--brand-primary);',
    '  --color-secondary: var(--brand-secondary);',
    '  --color-accent: var(--brand-accent);',
    '  --color-background: var(--brand-background);',
    '  --color-foreground: var(--brand-foreground);',
    '  --color-muted: var(--brand-muted);',
    '',
    '  --font-sans: var(--brand-font-sans);',
    '  --font-mono: var(--brand-font-mono);',
    '',
    '  --radius-sm: var(--brand-radius-sm);',
    '  --radius-md: var(--brand-radius-md);',
    '  --radius-lg: var(--brand-radius-lg);',
    '}',
    '',
    '/* The palette itself lives in theme-vars.css, written from this same',
    '   resolution. Pointing the tokens at it is what keeps the two systems',
    '   from disagreeing. */',
    ':root {',
    ...aliasLines,
    '',
    `  --brand-font-sans: ${config.fonts.sans}, ui-sans-serif, system-ui, sans-serif;`,
    `  --brand-font-mono: ${config.fonts.mono}, ui-monospace, monospace;`,
    '',
    `  --brand-radius-sm: ${config.radii.sm};`,
    `  --brand-radius-md: ${config.radii.md};`,
    `  --brand-radius-lg: ${config.radii.lg};`,
    '}',
    '',
  ].join('\n');

  return { tokensCss, themeVarsCss };
}
