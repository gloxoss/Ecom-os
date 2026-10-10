import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../../app/api/health/route';
import { createRedactedAlert } from '../../lib/commerce/observability';

describe('Public Health & Observability Security Contract (ECO-903)', () => {
  it('guarantees public health route exposes zero internal credentials or secrets', async () => {
    const response = await GET();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store, max-age=0');

    const body = await response.json();
    assert.equal(body.status, 'ok');
    assert.ok(typeof body.uptime === 'number');
    assert.ok(typeof body.timestamp === 'string');

    // Asserts zero secrets in body
    const bodyStr = JSON.stringify(body).toLowerCase();
    assert.equal(bodyStr.includes('password'), false);
    assert.equal(bodyStr.includes('secret'), false);
    assert.equal(bodyStr.includes('key'), false);
    assert.equal(bodyStr.includes('database'), false);
  });

  it('redacts sensitive fields in transaction error alerts', () => {
    const rawPayload = {
      orderId: 'ord-1234',
      total: 1850,
      customerEmail: 'patient@example.ma',
      customerPhone: '+212661000000',
      apiSecret: 'super-secret-token',
      creditCard: '4111222233334444',
      status: 'declined',
    };

    const alert = createRedactedAlert('tx-999', 'PAYMENT_ERROR', rawPayload);
    assert.equal(alert.transactionId, 'tx-999');
    assert.equal(alert.eventType, 'PAYMENT_ERROR');
    assert.equal(alert.redactedContext.orderId, 'ord-1234');
    assert.equal(alert.redactedContext.total, 1850);
    assert.equal(alert.redactedContext.status, 'declined');

    // Sensitive fields must be redacted
    assert.equal(alert.redactedContext.customerEmail, '[REDACTED]');
    assert.equal(alert.redactedContext.customerPhone, '[REDACTED]');
    assert.equal(alert.redactedContext.apiSecret, '[REDACTED]');
    assert.equal(alert.redactedContext.creditCard, '[REDACTED]');
  });
});
