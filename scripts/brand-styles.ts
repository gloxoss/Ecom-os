import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  BrandConfigSchema,
  generateBrandCss,
  resolveBrandConfiguration,
} from '../packages/brand-config';
import { themeRegistry } from '../packages/themes/src';
import { loadEnv } from './generate-addons';

// Resolved from this file, not from process.cwd(), so the storefront entry point
// writes to the same place no matter which directory it was started from.
const STYLES_DIR = path.resolve(__dirname, '..', 'apps', 'storefront', 'src', 'styles');

export interface WrittenBrandStyles {
  themeName: string;
  files: string[];
}

/**
 * Write both storefront stylesheets from ONE resolution of brand.config.ts and
 * the active theme.
 *
 * `brand.tokens.css` (the Tailwind tokens) and `theme-vars.css` (the theme's CSS
 * variables) used to come from two separate generators reading two different
 * sources, so they could disagree. Both entry points call this function now, so
 * there is a single place where page colours are decided.
 */
export function writeBrandStylesheets(brandConfig: unknown): WrittenBrandStyles {
  loadEnv();

  const parsed = BrandConfigSchema.safeParse(brandConfig);
  if (!parsed.success) {
    console.error('❌ Invalid brand config:');
    parsed.error.issues.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }

  const themeName = process.env.THEME_NAME || parsed.data.theme || 'angelina';
  if (!themeRegistry[themeName]) {
    // getTheme() falls back to the default theme silently; a typo in THEME_NAME
    // would otherwise ship the wrong palette with no warning.
    console.error(`Theme "${themeName}" not found in registry!`);
    process.exit(1);
  }

  const config = resolveBrandConfiguration(parsed.data, themeName);
  const { tokensCss, themeVarsCss } = generateBrandCss(config);

  fs.mkdirSync(STYLES_DIR, { recursive: true });
  const tokensPath = path.join(STYLES_DIR, 'brand.tokens.css');
  const themeVarsPath = path.join(STYLES_DIR, 'theme-vars.css');
  fs.writeFileSync(tokensPath, tokensCss, 'utf8');
  fs.writeFileSync(themeVarsPath, themeVarsCss, 'utf8');

  return { themeName, files: [tokensPath, themeVarsPath] };
}
