import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('webhook dedup', () => {
  beforeEach(() => {
    // Reset module state between tests
    vi.resetModules();
  });

  it('first call is not duplicate', async () => {
    const { isDuplicate, markSeen } = await import('../dedup');
    expect(isDuplicate('evt-1')).toBe(false);
    markSeen('evt-1');
    expect(isDuplicate('evt-1')).toBe(true);
  });

  it('second event is independent', async () => {
    const { isDuplicate, markSeen } = await import('../dedup');
    markSeen('evt-1');
    expect(isDuplicate('evt-2')).toBe(false);
  });
});
