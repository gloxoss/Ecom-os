import { NextRequest, NextResponse } from 'next/server';
import { verifyGuestOrderGrant, verifyOrderOwnership } from '@/lib/commerce/order-access';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const token = searchParams.get('token');

  const headers = {
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    Pragma: 'no-cache',
  };

  if (!orderId || !token) {
    return NextResponse.json(
      { ok: false, error: 'Missing orderId or token.' },
      { status: 400, headers }
    );
  }

  const isOwner = verifyOrderOwnership({ token, orderId });
  if (!isOwner) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: order ownership proof missing or invalid.' },
      { status: 403, headers }
    );
  }

  const verification = verifyGuestOrderGrant(token);

  return NextResponse.json(
    {
      ok: true,
      orderId: String(orderId),
      orderKey: verification.grant?.orderKey || '',
      status: 'processing',
    },
    { status: 200, headers }
  );
}

