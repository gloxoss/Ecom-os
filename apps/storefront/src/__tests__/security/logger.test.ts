import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('LOG_LEVEL', 'debug');
vi.stubEnv('NODE_ENV', 'production');

// Re-import after env stub
const { logger } = await import('../../lib/logger');

describe('logger', () => {
  it('redacts PII fields', () => {
    const out: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => { out.push(s as string); return true; });
    logger.info('test_event', { email: 'a@b.com', name: 'Alice', password: 'secret' });
    const parsed = JSON.parse(out[0]);
    expect(parsed.details.email).toBe('[REDACTED]');
    expect(parsed.details.password).toBe('[REDACTED]');
    expect(parsed.details.name).toBe('Alice');
  });

  it('redacts nested token fields', () => {
    const out: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => { out.push(s as string); return true; });
    logger.info('test', { session: { authToken: 'abc123' } });
    const parsed = JSON.parse(out[0]);
    expect(parsed.details.session.authToken).toBe('[REDACTED]');
  });
});
