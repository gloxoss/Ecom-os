import { NextRequest, NextResponse } from 'next/server';
import { verifyGuestOrderGrant, verifyOrderOwnership } from '@/lib/commerce/order-access';
import { getEngine } from '@/lib/engine';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const queryToken = searchParams.get('token');
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const headerToken = request.headers.get('x-order-token');
  const token = bearerToken || headerToken || queryToken;

  const challengeEmail =
    searchParams.get('challengeEmail') ||
    searchParams.get('email') ||
    request.headers.get('x-challenge-email') ||
    undefined;

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

  const isOwner = verifyOrderOwnership({
    token,
    orderId,
    ...(challengeEmail ? { challengeEmail } : {}),
  });

  if (!isOwner) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: order ownership proof missing or invalid.' },
      { status: 403, headers }
    );
  }

  const verification = verifyGuestOrderGrant(token);
  if (!verification.valid || !verification.grant) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: invalid order grant.' },
      { status: 403, headers }
    );
  }

  const engine = await getEngine();
  let status = 'processing';
  let currency: string | undefined;
  let totalMinor: number | undefined;

  if (typeof engine.getGuestOrder === 'function') {
    const order = await engine.getGuestOrder(String(orderId), verification.grant.orderKey);
    if (!order) {
      return NextResponse.json(
        { ok: false, error: 'Order not found or invalid credentials.' },
        { status: 404, headers }
      );
    }
    status = order.status;
    currency = order.total?.currency;
    totalMinor = order.total?.amount_minor;
  }

  return NextResponse.json(
    {
      ok: true,
      orderId: String(orderId),
      status,
      ...(currency ? { currency } : {}),
      ...(typeof totalMinor === 'number' ? { total_minor: totalMinor } : {}),
    },
    { status: 200, headers }
  );
}
