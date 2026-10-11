import { EcomTheme } from './types';
import { defaultTheme } from './clients/default/theme';
import { minimalTheme } from './clients/minimal/theme';
import { luxuryTheme } from './clients/luxury/theme';
import { angelinaTheme } from './clients/angelina/theme';
import { demo2Theme } from './clients/demo-2/theme';
import { paralocaTheme } from './clients/paraloca/theme';

export * from './types';
export { defaultTheme } from './clients/default/theme';
export { minimalTheme } from './clients/minimal/theme';
export { luxuryTheme } from './clients/luxury/theme';
export { angelinaTheme } from './clients/angelina/theme';
export { demo2Theme } from './clients/demo-2/theme';
export { paralocaTheme } from './clients/paraloca/theme';

export const themeRegistry: Record<string, EcomTheme> = {
  default: defaultTheme,
  minimal: minimalTheme,
  luxury: luxuryTheme,
  angelina: angelinaTheme,
  'demo-2': demo2Theme,
  paraloca: paralocaTheme,
};

export function getTheme(name: string): EcomTheme {
  return themeRegistry[name] || defaultTheme;
}

