import { describe, expect, it } from 'vitest';
import { generateBrandCss } from '../tokens';
import { resolveBrandConfiguration } from '../precedence';
import type { BrandConfig } from '../schema';

/**
 * Ledger item 18: page colours had two sources of truth. Tailwind tokens came
 * from brand.config.ts through one generator, the theme's HSL variables came
 * from the theme registry through another, and nothing connected them.
 *
 * These tests pin the single-source contract: one resolution feeds both
 * stylesheets, so whatever a client sets once is what the page renders.
 */

const CLIENT_COLOURS = {
  primary: '#123456',
  secondary: '#654321',
  accent: '#abcdef',
  background: '#fefefe',
  foreground: '#101010',
  muted: '#dddddd',
};

const ANGELINA_COLOURS = {
  primary: '#aa631a',
  secondary: '#c69951',
  accent: '#ffcebf',
  background: '#ffffff',
  foreground: '#3f100a',
  muted: '#d9a594',
};

function clientConfig(colors: Partial<BrandConfig['colors']> = {}): BrandConfig {
  return {
    name: 'Test Client',
    theme: 'angelina',
    logos: { light: '/l.svg', dark: '/d.svg' },
    colors: { ...CLIENT_COLOURS, ...colors },
    fonts: { sans: 'Inter Tight Variable', mono: 'monospace' },
    radii: { sm: '12px', md: '16px', lg: '20px' },
    hero: { headline: 'h', subheadline: 's', ctaLabel: 'c', ctaHref: '/catalog', image: '/h.jpg' },
    contact: { email: 'a@b.test', phone: '0', address: 'x' },
  } as BrandConfig;
}

/** Read the custom properties a stylesheet declares. */
function readVars(css: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const match of css.matchAll(/--([a-z-]+):\s*([^;]+);/g)) {
    vars[match[1] ?? ''] = (match[2] ?? '').trim();
  }
  return vars;
}

/** Read one variable, failing loudly rather than comparing against undefined. */
function varOf(vars: Record<string, string>, name: string): string {
  const value = vars[name];
  if (value === undefined) throw new Error(`--${name} is missing from the stylesheet`);
  return value;
}

/** Render an "H S% L%" triplet the way a browser would, for exact comparison. */
function hslTripletToHex(triplet: string): string {
  const parts = triplet.trim().split(/\s+/);
  const h = Number.parseFloat(parts[0] ?? '');
  const s = Number.parseFloat(parts[1] ?? '');
  const l = Number.parseFloat(parts[2] ?? '');
  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) {
    throw new Error(`Not an HSL triplet: "${triplet}"`);
  }

  const saturation = s / 100;
  const lightness = l / 100;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - c / 2;

  let channels: [number, number, number];
  if (h < 60) channels = [c, x, 0];
  else if (h < 120) channels = [x, c, 0];
  else if (h < 180) channels = [0, c, x];
  else if (h < 240) channels = [0, x, c];
  else if (h < 300) channels = [x, 0, c];
  else channels = [c, 0, x];

  return (
    '#' +
    channels
      .map((channel) =>
        Math.round((channel + m) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

describe('single theming source (ledger item 18)', () => {
  const resolved = resolveBrandConfiguration(clientConfig());
  const { tokensCss, themeVarsCss } = generateBrandCss(resolved);
  const themeVars = readVars(themeVarsCss);
  const tokenVars = readVars(tokensCss);

  it('renders the colour the client set once, not the theme default', () => {
    // The theme ships its own primary; the client's must win, and it must win
    // through the shared variables rather than a second hardcoded copy.
    expect(hslTripletToHex(varOf(themeVars, 'primary'))).toBe(CLIENT_COLOURS.primary);
    expect(hslTripletToHex(varOf(themeVars, 'accent'))).toBe(CLIENT_COLOURS.accent);
  });

  it('points every Tailwind colour token at a variable the theme stylesheet defines', () => {
    const aliases = Object.entries(tokenVars).filter(([, value]) => value.startsWith('hsl(var('));

    expect(aliases.length).toBeGreaterThan(0);
    for (const [name, value] of aliases) {
      const referenced = value.replace(/^hsl\(var\(--/, '').replace(/\)\)$/, '');
      expect(varOf(themeVars, referenced), `${name} points at --${referenced}`).toBeDefined();
    }
  });

  it('generates both stylesheets from one resolution, so they cannot disagree', () => {
    // Changing the client colour alone has to move BOTH outputs: the variable
    // the theme reads and the token Tailwind compiles.
    const changed = generateBrandCss(
      resolveBrandConfiguration(clientConfig({ primary: '#ff0000' })),
    );
    expect(varOf(readVars(changed.themeVarsCss), 'primary')).not.toBe(
      varOf(themeVars, 'primary'),
    );
    expect(changed.tokensCss).toContain('--brand-primary: hsl(var(--primary))');
  });

  it('keeps the starter default look exact for Angelina', () => {
    // The conversion is lossy if the HSL channels are rounded, so #aa631a would
    // come back as #a8611a. The triplet must survive a render round-trip.
    const angelina = resolveBrandConfiguration({
      ...clientConfig(),
      colors: { ...ANGELINA_COLOURS },
    });
    const vars = readVars(generateBrandCss(angelina).themeVarsCss);

    for (const [token, hex] of Object.entries(ANGELINA_COLOURS)) {
      expect(hslTripletToHex(varOf(vars, token)), token).toBe(hex);
    }
  });
});
