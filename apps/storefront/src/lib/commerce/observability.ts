export interface TransactionAlert {
  transactionId: string;
  eventType: 'ORDER_FAILED' | 'PAYMENT_ERROR' | 'RFQ_ERROR';
  orderTotal?: number;
  timestamp: string;
  redactedContext: Record<string, unknown>;
}

export function createRedactedAlert(
  transactionId: string,
  eventType: TransactionAlert['eventType'],
  rawPayload: Record<string, unknown>
): TransactionAlert {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rawPayload)) {
    // Redact sensitive keys
    if (/password|secret|token|key|card|cvv|phone|email/i.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return {
    transactionId,
    eventType,
    timestamp: new Date().toISOString(),
    redactedContext: sanitized,
  };
}
