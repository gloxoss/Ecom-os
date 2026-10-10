import { EcomTheme } from './types';
import { defaultTheme } from './clients/default/theme';
import { minimalTheme } from './clients/minimal/theme';
import { luxuryTheme } from './clients/luxury/theme';
import { angelinaTheme } from './clients/angelina/theme';
import { demo2Theme } from './clients/demo-2/theme';

export * from './types';
export { demo2Theme } from './clients/demo-2/theme';

export const themeRegistry: Record<string, EcomTheme> = {
  default: defaultTheme,
  minimal: minimalTheme,
  luxury: luxuryTheme,
  angelina: angelinaTheme,
  'demo-2': demo2Theme,
};

export function getTheme(name: string): EcomTheme {
  return themeRegistry[name] || defaultTheme;
}
