import { EcomTheme } from './types';
import { defaultTheme } from './clients/default/theme';
import { minimalTheme } from './clients/minimal/theme';
import { luxuryTheme } from './clients/luxury/theme';
import { angelinaTheme } from './clients/angelina/theme';

export * from './types';

export const themeRegistry: Record<string, EcomTheme> = {
  default: defaultTheme,
  minimal: minimalTheme,
  luxury: luxuryTheme,
  angelina: angelinaTheme,
};

export function getTheme(name: string): EcomTheme {
  return themeRegistry[name] || defaultTheme;
}
