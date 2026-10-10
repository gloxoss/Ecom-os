import type { RfqSubmitInput } from './submit-schema';

export interface RfqSubmitResponse {
  success: boolean;
  quoteId: string;
  quoteNumber: string;
  accessSecret: string;
  state: string;
  idempotent?: boolean;
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'idemp_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export async function submitRfqRequest(
  payload: RfqSubmitInput,
  apiEndpoint: string = '/api/rfq'
): Promise<RfqSubmitResponse> {
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': payload.idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetails = `RFQ submission failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.errors) {
        errorDetails = Array.isArray(errJson.errors) ? errJson.errors.join('; ') : String(errJson.errors);
      } else if (errJson && errJson.message) {
        errorDetails = errJson.message;
      }
    } catch {
      // fallback
    }
    throw new Error(errorDetails);
  }

  return (await response.json()) as RfqSubmitResponse;
}
