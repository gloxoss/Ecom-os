import { verifyCmiHash } from './hash';
import { isDuplicate, markSeen } from '../../dedup';

export type CmiCallbackResult =
  | { ok: true; orderId: string; amountMinor: number; transactionId: string }
  | { ok: false; reason: string };

export async function processCmiCallback(
  params: Record<string, string>,
  expectedAmountMinor: number,
): Promise<CmiCallbackResult> {
  const storeKey = process.env.CMI_STORE_KEY;
  if (!storeKey) return { ok: false, reason: 'CMI_STORE_KEY not configured' };

  // 1. Verify signature FIRST
  if (!verifyCmiHash(params, storeKey)) {
    console.warn(JSON.stringify({ signature_status: 'invalid', source: 'cmi', ts: new Date().toISOString() }));
    return { ok: false, reason: 'Invalid HASH' };
  }

  // 2. Replay check
  const txId = params['TransId'] ?? params['oid'] ?? '';
  const dedupKey = `${params['oid']}-${txId}`;
  if (isDuplicate(dedupKey)) {
    return { ok: false, reason: 'Duplicate callback' };
  }
  markSeen(dedupKey);

  // 3. Amount integrity — callback amount must match server order total
  const callbackAmount = Math.round(parseFloat(params['amount'] ?? '0') * 100);
  if (callbackAmount !== expectedAmountMinor) {
    console.warn(JSON.stringify({
      signature_status: 'amount_mismatch',
      expected: expectedAmountMinor,
      received: callbackAmount,
      ts: new Date().toISOString(),
    }));
    return { ok: false, reason: 'Amount mismatch' };
  }

  const orderId = params['oid'];
  if (!orderId) return { ok: false, reason: 'Missing oid' };

  return { ok: true, orderId, amountMinor: callbackAmount, transactionId: txId };
}
