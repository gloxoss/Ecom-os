import { describe, it, expect } from 'vitest';
import { demo2Profile } from '../../../../../../clients/demo-2/profile';
import { loadClientProfile, toPublicClientProfile } from '@ecom-os/brand-config';
import { getTheme, themeRegistry } from '@ecom-os/themes';

describe('Demo-2 Neutral Client Profile & Theme (ECO-406)', () => {
  it('validates strictly against ClientProfileSchema', () => {
    const loaded = loadClientProfile(demo2Profile);
    expect(loaded.id).toBe('demo-2');
    expect(loaded.name).toBe('Nordic Craft Supplies');
    expect(loaded.brand.theme).toBe('demo-2');
    expect(loaded.industry?.industry).toBe('general_retail');
  });

  it('enforces Phase 4 invariant: customer accounts disabled', () => {
    expect(demo2Profile.capabilities.customerAccounts).toBe(false);

    const invalid = {
      ...demo2Profile,
      capabilities: {
        ...demo2Profile.capabilities,
        customerAccounts: true,
      },
    };
    expect(() => loadClientProfile(invalid)).toThrow(/Customer accounts are disabled/);
  });

  it('projects to safe PublicClientProfile without internal backend URLs', () => {
    const publicProfile = toPublicClientProfile(demo2Profile);

    // Public properties preserved
    expect(publicProfile.id).toBe('demo-2');
    expect(publicProfile.name).toBe('Nordic Craft Supplies');
    expect(publicProfile.brand.colors.primary).toBe('#0F172A');
    expect(publicProfile.environment.storefrontUrl).toBe('https://nordic-craft.example.com');
    expect(publicProfile.environment.cdnUrl).toBe('https://cdn.nordic-craft.example.com');

    // Internal secrets/URLs strictly stripped
    expect((publicProfile.environment as Record<string, unknown>).wooCommerceUrl).toBeUndefined();
    expect((publicProfile.environment as Record<string, unknown>).wordpressUrl).toBeUndefined();
  });

  it('registers demo-2 theme with contrasting tokens and layout slots', () => {
    const theme = getTheme('demo-2');
    expect(theme).toBeDefined();
    expect(theme.config.name).toBe('demo-2');

    // Layout slots contrast with Angelina
    expect(theme.config.slots?.header).toBe('minimal');
    expect(theme.config.slots?.hero).toBe('minimal');
    expect(theme.config.slots?.productGrid).toBe('3-column');
    expect(theme.config.slots?.variantSelector).toBe('dropdown');
    expect(theme.config.slots?.footer).toBe('simple');

    // Sharp radius tokens
    expect(theme.config.radius).toBe('0.25rem');
    expect(theme.config.radii?.sm).toBe('2px');
    expect(theme.config.radii?.md).toBe('4px');
    expect(theme.config.radii?.lg).toBe('6px');

    // Contrast with Angelina theme
    const angelinaTheme = themeRegistry.angelina;
    expect(angelinaTheme).toBeDefined();
    if (angelinaTheme) {
      expect(theme.config.radius).not.toBe(angelinaTheme.config.radius);
      expect(theme.config.colors.primary).not.toBe(angelinaTheme.config.colors.primary);
    }
  });
});
