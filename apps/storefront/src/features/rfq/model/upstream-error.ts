/** Reads status and code from an unknown thrown value without trusting its shape. */
export function readUpstreamError(err: unknown): { status: number; code: string };
export function readUpstreamError<C extends string | undefined>(
  err: unknown,
  fallbackStatus: number,
  fallbackCode: C,
): { status: number; code: string | C };
export function readUpstreamError(
  err: unknown,
  fallbackStatus = 502,
  fallbackCode: string | undefined = 'UPSTREAM_ERROR',
): { status: number; code: string | undefined } {
  const e = (err && typeof err === 'object' ? err : {}) as Record<string, unknown>;
  const status = typeof e.statusCode === 'number' ? e.statusCode : fallbackStatus;
  const code =
    typeof e.errorCode === 'string'
      ? e.errorCode
      : typeof e.code === 'string'
        ? e.code
        : fallbackCode;
  return { status, code };
}
