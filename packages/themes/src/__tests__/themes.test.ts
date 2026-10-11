import { describe, it, expect } from 'vitest';
import {
  themeRegistry,
  getTheme,
  themeConfigToCssVars,
  defaultTheme,
  minimalTheme,
  luxuryTheme,
  angelinaTheme,
  demo2Theme,
  paralocaTheme,
} from '../index';

describe('EcomOS Themes Registry and Design Tokens (ECO-1212)', () => {
  it('registers all approved multi-tenant client themes in themeRegistry', () => {
    const registeredKeys = Object.keys(themeRegistry);
    expect(registeredKeys).toContain('default');
    expect(registeredKeys).toContain('minimal');
    expect(registeredKeys).toContain('luxury');
    expect(registeredKeys).toContain('angelina');
    expect(registeredKeys).toContain('demo-2');
    expect(registeredKeys).toContain('paraloca');
  });

  it('resolves named themes correctly via getTheme()', () => {
    expect(getTheme('default')).toBe(defaultTheme);
    expect(getTheme('minimal')).toBe(minimalTheme);
    expect(getTheme('luxury')).toBe(luxuryTheme);
    expect(getTheme('angelina')).toBe(angelinaTheme);
    expect(getTheme('demo-2')).toBe(demo2Theme);
    expect(getTheme('paraloca')).toBe(paralocaTheme);
  });

  it('safely falls back to defaultTheme when an unknown theme is requested', () => {
    const fallback = getTheme('non-existent-theme-xyz');
    expect(fallback).toBe(defaultTheme);
    expect(fallback.config.name).toBe('default');
  });

  it('verifies ParaLoca theme tokens match approved medical-lifestyle design reference', () => {
    const theme = getTheme('paraloca');
    expect(theme.config.name).toBe('paraloca');
    expect(theme.config.radius).toBe('0.75rem');
    expect(theme.config.radii).toEqual({
      sm: '6px',
      md: '12px',
      lg: '18px',
    });

    // Color tokens
    expect(theme.config.colors.background).toBe('0 0% 100%');
    expect(theme.config.colors.foreground).toBe('120 2% 9%');
    expect(theme.config.colors.primary).toBe('120 2% 9%');
    expect(theme.config.colors.accent).toBe('170 47% 28.8%');
    expect(theme.config.colors.secondary).toBe('135 2% 36%');
    expect(theme.config.colors.border).toBe('84 8% 88.4%');

    // Slots
    expect(theme.config.slots).toEqual({
      header: 'standard',
      hero: 'split',
      productGrid: '3-column',
      variantSelector: 'pills',
      footer: 'multi-column',
    });

    // Typography
    expect(theme.config.fontSans).toContain('Inter');
  });

  it('converts every registered theme into complete CSS custom properties without NaN or undefined', () => {
    for (const [name, theme] of Object.entries(themeRegistry)) {
      const vars = themeConfigToCssVars(theme.config);

      // Core variables required by Tailwind / UI
      expect(vars['--background'], `Missing --background in ${name}`).toBeDefined();
      expect(vars['--foreground'], `Missing --foreground in ${name}`).toBeDefined();
      expect(vars['--primary'], `Missing --primary in ${name}`).toBeDefined();
      expect(vars['--secondary'], `Missing --secondary in ${name}`).toBeDefined();
      expect(vars['--accent'], `Missing --accent in ${name}`).toBeDefined();
      expect(vars['--muted'], `Missing --muted in ${name}`).toBeDefined();
      expect(vars['--border'], `Missing --border in ${name}`).toBeDefined();
      expect(vars['--radius'], `Missing --radius in ${name}`).toBeDefined();

      // No undefined or empty strings for mandatory variables
      for (const [varName, val] of Object.entries(vars)) {
        expect(val, `${varName} in theme ${name} must not be undefined`).not.toBeUndefined();
        expect(val.includes('undefined'), `${varName} in theme ${name} has "undefined"`).toBe(false);
      }
    }
  });

  it('ensures distinct themes produce contrasting tokens and layout slots', () => {
    const paraloca = getTheme('paraloca');
    const demo2 = getTheme('demo-2');
    const luxury = getTheme('luxury');

    // Distinct radii
    expect(paraloca.config.radius).not.toBe(demo2.config.radius);

    // Distinct primary colors
    expect(paraloca.config.colors.primary).not.toBe(demo2.config.colors.primary);
    expect(paraloca.config.colors.accent).not.toBe(luxury.config.colors.accent);

    // Distinct variant selectors
    expect(paraloca.config.slots?.variantSelector).toBe('pills');
    expect(demo2.config.slots?.variantSelector).toBe('dropdown');
  });
});
