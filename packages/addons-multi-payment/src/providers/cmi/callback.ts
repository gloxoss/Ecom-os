export type CmiCallbackResult =
  | { ok: true; orderId: string; amountMinor: number; transactionId: string }
  | { ok: false; reason: string };

export async function processCmiCallback(
  _params: Record<string, string>,
  _expectedAmountMinor: number,
): Promise<CmiCallbackResult> {
  // Re-enable only after approval/capture, amount, currency and durable replay checks.
  return { ok: false, reason: 'CMI is unavailable pending certified integration.' };
}
