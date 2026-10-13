import { EcomTheme } from './types';
import { defaultTheme } from './clients/default/theme';
import { generatedThemes } from "./registry.generated";

export * from './types';
export { defaultTheme } from './clients/default/theme';
export { minimalTheme } from './clients/minimal/theme';
export { luxuryTheme } from './clients/luxury/theme';
export { angelinaTheme } from './clients/angelina/theme';
export { demo2Theme } from './clients/demo-2/theme';
export { paralocaTheme } from './clients/paraloca/theme';

// Built from packages/themes/src/clients/*/theme.ts by scripts/generate-clients.mjs.
export const themeRegistry: Record<string, EcomTheme> = generatedThemes;

export function getTheme(name: string): EcomTheme {
  return themeRegistry[name] || defaultTheme;
}

