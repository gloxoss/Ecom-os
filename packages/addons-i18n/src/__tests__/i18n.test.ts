import { describe, it, expect } from 'vitest';
import enMessages from '../../locales/en.json';
import frMessages from '../../locales/fr.json';
import arMessages from '../../locales/ar.json';
import { isRtl, locales } from '../config';

describe('i18n addon', () => {
  it('all locales have the same keys as English', () => {
    const enKeys = Object.keys(enMessages).sort();
    expect(Object.keys(frMessages).sort()).toEqual(enKeys);
    expect(Object.keys(arMessages).sort()).toEqual(enKeys);
  });

  it('Arabic is RTL, others are LTR', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('en')).toBe(false);
    expect(isRtl('fr')).toBe(false);
  });

  it('all locales are in the locales array', () => {
    expect(locales).toContain('en');
    expect(locales).toContain('fr');
    expect(locales).toContain('ar');
  });

  it('register and disable are exported', async () => {
    const { register, disable } = await import('../index');
    expect(typeof register).toBe('function');
    expect(typeof disable).toBe('function');
  });
});
