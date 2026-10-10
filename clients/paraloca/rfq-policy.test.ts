import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultParaLocaRfqPolicy, validateRfqPolicy } from './rfq-policy';
import { paralocaProfile } from './profile';

describe('ParaLoca RFQ Policy & Capability Contract (ECO-805)', () => {
  it('validates default ParaLoca RFQ policy', () => {
    const policy = validateRfqPolicy(defaultParaLocaRfqPolicy);
    assert.equal(policy.enabled, true);
    assert.equal(policy.minItems, 1);
    assert.equal(policy.responseTimeHours, 24);
    assert.equal(policy.contactEmail, 'devis@paraloca.ma');
    assert.equal(policy.stockReservationPolicy, 'none');
  });

  it('guarantees stock reservation policy is non-destructive by default', () => {
    assert.equal(defaultParaLocaRfqPolicy.stockReservationPolicy, 'none');
  });

  it('fails closed when RFQ policy is malformed or invalid', () => {
    assert.throws(() => validateRfqPolicy(null), /RFQ policy must be a non-null object/);
    assert.throws(
      () => validateRfqPolicy({ enabled: true, minItems: 1, contactEmail: 'invalid-email' }),
      /RFQ policy contactEmail must be a valid email address/
    );
  });

  it('aligns with ParaLoca profile capabilities', () => {
    assert.equal(paralocaProfile.capabilities.quotes, true);
    assert.equal(paralocaProfile.capabilities.customerAccounts, false);
  });
});
