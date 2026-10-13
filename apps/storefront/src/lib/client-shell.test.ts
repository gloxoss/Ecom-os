import { describe, it, expect } from 'vitest';
import { getClientShell, type ClientShellOverrides } from './client-shell';

describe('getClientShell', () => {
  it('returns no overrides for a client without a shell, so the default storefront is used', () => {
    expect(getClientShell('no-such-client', {})).toEqual({});
  });

  it('returns the overrides registered for the active client only', () => {
    const acme: ClientShellOverrides = { htmlLang: 'fr' };
    const registry = { acme };
    expect(getClientShell('acme', registry)).toBe(acme);
    expect(getClientShell('other', registry)).toEqual({});
  });

  it('falls back to the default storefront for an unknown client key', () => {
    expect(getClientShell('definitely-not-a-client')).toEqual({});
  });
});
