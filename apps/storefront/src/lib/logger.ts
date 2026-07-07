// ponytail: minimal logger — Section 10 adds PII redaction and JSON formatting
const REDACT_KEYS = /^(email|phone|address|authorization|.*token.*|.*secret.*|.*password.*|card.*)$/i;
const LOG_LEVEL_RANK = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LOG_LEVEL_RANK[(process.env.LOG_LEVEL ?? 'info') as keyof typeof LOG_LEVEL_RANK] ?? 1;

function redact(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      REDACT_KEYS.test(k) ? '[REDACTED]' : redact(v),
    ])
  );
}

function emit(level: 'debug' | 'info' | 'warn' | 'error', event: string, details?: unknown, requestId?: string) {
  if (LOG_LEVEL_RANK[level] < MIN_LEVEL) return;
  const entry = { timestamp: new Date().toISOString(), level, requestId, event, details: redact(details) };
  if (process.env.NODE_ENV !== 'production') {
    console[level](`[${level.toUpperCase()}] ${event}`, details);
  } else {
    process.stdout.write(JSON.stringify(entry) + '\n');
  }
}

export const logger = {
  debug: (event: string, details?: unknown, requestId?: string) => emit('debug', event, details, requestId),
  info:  (event: string, details?: unknown, requestId?: string) => emit('info',  event, details, requestId),
  warn:  (event: string, details?: unknown, requestId?: string) => emit('warn',  event, details, requestId),
  error: (event: string, details?: unknown, requestId?: string) => emit('error', event, details, requestId),
};
