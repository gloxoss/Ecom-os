import { NextResponse } from 'next/server';

/**
 * Public Health Endpoint.
 * Invariant: Never leak database passwords, internal URLs, or encryption secrets.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
