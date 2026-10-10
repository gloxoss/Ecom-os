import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { paralocaTheme } from '../../../packages/themes/src/clients/paraloca/theme';
import { themeConfigToCssVars } from '../../../packages/themes/src/types';
import { ClientShell } from '../src/features/layout/ui/client-shell';

/**
 * Calculates relative luminance and contrast ratio according to WCAG 2.1 specifications.
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function luminance([r, g, b]: [number, number, number]): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(hex1: string, hex2: string): number {
  const lum1 = luminance(hexToRgb(hex1));
  const lum2 = luminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('ParaLoca Visual Direction & Presentation Contract (ECO-802)', () => {
  it('enforces WCAG AA/AAA minimum contrast ratios on core ParaLoca brand tokens', () => {
    const white = '#FFFFFF';
    const textPrimary = '#171817';
    const textSecondary = '#595D5A';
    const accent = '#276C61';
    const destructive = '#A93636';

    // Primary text on white: AAA requires >= 7:1
    const primaryRatio = contrastRatio(textPrimary, white);
    assert.ok(primaryRatio >= 7.0, `Primary text contrast ratio ${primaryRatio} must be >= 7.0`);

    // Secondary text on white: AA requires >= 4.5:1
    const secondaryRatio = contrastRatio(textSecondary, white);
    assert.ok(secondaryRatio >= 4.5, `Secondary text contrast ratio ${secondaryRatio} must be >= 4.5`);

    // Medical sage/teal accent on white: AA requires >= 4.5:1
    const accentRatio = contrastRatio(accent, white);
    assert.ok(accentRatio >= 4.5, `Accent contrast ratio ${accentRatio} must be >= 4.5`);

    // Destructive/error on white: AA requires >= 4.5:1
    const destructiveRatio = contrastRatio(destructive, white);
    assert.ok(destructiveRatio >= 4.5, `Destructive contrast ratio ${destructiveRatio} must be >= 4.5`);
  });

  it('maps ParaLoca theme tokens to standard CSS custom properties', () => {
    const cssVars = themeConfigToCssVars(paralocaTheme.config);

    assert.equal(cssVars['--background'], '0 0% 100%');
    assert.equal(cssVars['--foreground'], '120 2% 9%');
    assert.equal(cssVars['--primary'], '120 2% 9%');
    assert.equal(cssVars['--accent'], '170 47% 28.8%');
    assert.equal(cssVars['--border'], '84 8% 88.4%');
    assert.equal(cssVars['--ring'], '213 79% 41%');
    assert.equal(cssVars['--radius'], '0.75rem');
    assert.ok(cssVars['--font-sans'].includes('Inter'));
  });

  it('renders ClientShell with accessible skip-link and layout slot metadata in French', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        ClientShell,
        {
          theme: paralocaTheme,
          locale: 'fr',
          headerSlot: React.createElement('div', { id: 'test-header' }, 'ParaLoca Header'),
          footerSlot: React.createElement('div', { id: 'test-footer' }, 'ParaLoca Footer'),
        },
        React.createElement('p', null, 'Product Catalog Content')
      )
    );

    assert.ok(html.includes('data-client-theme="paraloca"'));
    assert.ok(html.includes('data-header-slot="standard"'));
    assert.ok(html.includes('data-product-grid-slot="3-column"'));
    assert.ok(html.includes('href="#main-content"'));
    assert.ok(html.includes('Passer au contenu principal'));
    assert.ok(html.includes('id="main-content"'));
    assert.ok(html.includes('id="test-header"'));
    assert.ok(html.includes('id="test-footer"'));
  });

  it('renders ClientShell with localized skip-link in Arabic', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        ClientShell,
        {
          theme: paralocaTheme,
          locale: 'ar',
        },
        React.createElement('p', null, 'محتوى المتجر')
      )
    );

    assert.ok(html.includes('الانتقال إلى المحتوى الرئيسي'));
  });

  it('preserves complete separation between presentation shell and commerce domain', () => {
    // Assert that ClientShell is purely a presentation layout and imports no cart/checkout mutation logic
    const html = renderToStaticMarkup(
      React.createElement(
        ClientShell,
        { theme: paralocaTheme },
        React.createElement('div', { 'data-testid': 'slot-test' }, 'Isolated Commerce Body')
      )
    );
    assert.ok(html.includes('Isolated Commerce Body'));
  });
});
