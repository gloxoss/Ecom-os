import { describe, it, expect } from 'vitest';
import { getTheme, themeRegistry } from '../../..';
import { demo2Theme } from '../theme';

describe('Demo-2 Neutral Client Theme (ECO-406)', () => {
  it('registers demo-2 theme in themeRegistry and provides getTheme("demo-2")', () => {
    expect(themeRegistry['demo-2']).toBe(demo2Theme);
    const resolved = getTheme('demo-2');
    expect(resolved.config.name).toBe('demo-2');
  });

  it('provides distinct contrasting layout slots for demo-2', () => {
    const theme = getTheme('demo-2');
    expect(theme.config.slots?.header).toBe('minimal');
    expect(theme.config.slots?.hero).toBe('minimal');
    expect(theme.config.slots?.productGrid).toBe('3-column');
    expect(theme.config.slots?.variantSelector).toBe('dropdown');
    expect(theme.config.slots?.footer).toBe('simple');
  });

  it('provides distinct contrasting tokens (radius, slate colors)', () => {
    const theme = getTheme('demo-2');
    expect(theme.config.radius).toBe('0.25rem');
    expect(theme.config.radii?.sm).toBe('2px');
    expect(theme.config.radii?.md).toBe('4px');
    expect(theme.config.radii?.lg).toBe('6px');
    expect(theme.config.colors.primary).toBe('222.2 47.4% 11.2%');
    expect(theme.config.colors.accent).toBe('199 89% 48%');

    // Confirms it differs from luxury angelina theme
    const angelinaTheme = themeRegistry.angelina;
    expect(angelinaTheme).toBeDefined();
    if (angelinaTheme) {
      expect(theme.config.radius).not.toBe(angelinaTheme.config.radius);
      expect(theme.config.colors.primary).not.toBe(angelinaTheme.config.colors.primary);
    }
  });
});
