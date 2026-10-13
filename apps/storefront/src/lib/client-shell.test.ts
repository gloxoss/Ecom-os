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

  it('starter ships no client shells', () => {
    // Client content belongs to instances. If this fails, move that content to the instance.
    expect(getClientShell('paraloca')).toEqual({});
  });
});
