export async function handleStripeWebhook(
  _body: string,
  _signature: string | null,
  _engine: { markOrderPaid: (orderId: string, ref: any) => Promise<void> },
): Promise<{ status: number; body: string }> {
  // Re-enable only with durable reconciliation and order/amount/currency verification.
  return { status: 503, body: 'Stripe is unavailable pending verified integration.' };
}
