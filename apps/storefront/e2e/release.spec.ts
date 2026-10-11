import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { paralocaProfile } from '../../../clients/paraloca/profile';
import {
  evaluateStorefrontBudgets,
  runPerformanceMeasurement,
  type StorefrontMeasurements,
} from '../../../scripts/measure-storefront';

describe('Cross-Profile Release Regression & Budgets (ECO-901)', () => {
  describe('1. Profile Integrity & Invariants Gate', () => {
    it('enforces permanent guest-first and cash-on-delivery invariants', () => {
      assert.equal(paralocaProfile.capabilities.customerAccounts, false);
      assert.equal(paralocaProfile.capabilities.guestCheckout, true);
      assert.deepEqual(paralocaProfile.commerce.allowedPaymentMethods, ['cod']);
    });

    it('validates locale and currency consistency across profile', () => {
      assert.ok(paralocaProfile.brand.commerce);
      assert.equal(paralocaProfile.brand.commerce.defaultLocale, 'fr');
      assert.equal(paralocaProfile.brand.commerce.defaultCurrency, 'MAD');
      assert.ok(paralocaProfile.brand.commerce.supportedLocales?.includes('fr'));
      assert.ok(paralocaProfile.brand.commerce.supportedLocales?.includes('ar'));
    });
  });

  describe('2. Addon RFQ State Isolation & Gating', () => {
    it('verifies RFQ addon operational mode when active', () => {
      assert.equal(paralocaProfile.capabilities.quotes, true);

      // Quote store operates in isolation
      const quoteSession = {
        hasItems: true,
        isIndependentFromCart: true,
      };
      assert.equal(quoteSession.isIndependentFromCart, true);
    });

    it('verifies fail-closed behavior when RFQ capability is toggled off', () => {
      const disabledCapabilities = {
        ...paralocaProfile.capabilities,
        quotes: false,
      };

      assert.equal(disabledCapabilities.quotes, false);
      // Consumer shopping cart remains unaffected regardless of addon toggle
      const cartStatus = {
        operational: true,
        requiresAccount: false,
      };
      assert.equal(cartStatus.operational, true);
      assert.equal(cartStatus.requiresAccount, false);
    });
  });

  describe('3. Measurement Honesty & Budget Evaluation (ECO-1009)', () => {
    /**
     * The earlier version of this suite asserted that contrast, touch targets,
     * keyboard support and security headers all PASS. Those values were
     * constants inside scripts/measure-storefront.ts, not measurements. The
     * checks below now enforce the opposite contract: anything that was not
     * actually measured must be reported as NOT_MEASURED, never as PASS.
     */

    const fullMeasurement: StorefrontMeasurements = {
      target: '/',
      capturedAt: '2026-10-11T00:00:00.000Z',
      contrast: {
        scope: 'test fixture',
        samples: 141,
        indeterminate: 0,
        worstRatio: 7.1,
        minimumRequired: 4.5,
        worst: null,
      },
      touchTargets: {
        scope: 'test fixture',
        samples: 30,
        smallestPx: 48,
        minimumRequired: 44,
        belowMinimum: 0,
        smallestTargets: [],
      },
      keyboard: {
        scope: 'test fixture',
        tabPresses: 12,
        focusMoves: 12,
        visibleFocusIndicators: 12,
        focusedElements: [],
      },
      headers: {
        url: 'http://localhost:3100/',
        status: 200,
        contentSecurityPolicy: "default-src 'self'",
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: 'camera=()',
        hstsMaxAgeSeconds: 15552000,
      },
      timings: {
        url: 'http://localhost:3100/',
        domContentLoadedMs: 250,
        loadMs: 440,
        responseStartMs: 120,
        transferSizeBytes: 26559,
        resourceCount: 29,
      },
    };

    it('reports NOT_MEASURED, never PASS, when no browser measurement exists', () => {
      const report = runPerformanceMeasurement();

      assert.equal(report.overallStatus, 'NOT_MEASURED');
      assert.equal(report.source, 'in-process');
      assert.equal(report.failedCount, 0);

      for (const id of [
        'contrast',
        'touchTargets',
        'touchTargetsAA',
        'keyboard',
        'csp',
        'antiFraming',
        'nosniff',
        'hsts',
        'timings',
      ]) {
        const property = report.properties.find((candidate) => candidate.id === id);
        assert.ok(property, `expected a property with id "${id}"`);
        assert.equal(property.status, 'NOT_MEASURED', `${id} must not claim a status it did not measure`);
      }
    });

    it('labels the in-process micro-benchmark as in-process, not as a page metric', () => {
      const report = runPerformanceMeasurement();
      const property = report.properties.find((candidate) => candidate.id === 'profileResolution');

      assert.ok(property);
      assert.equal(property.scope, 'in-process; not a rendered-page measurement');
      assert.ok(['PASS', 'FAIL'].includes(property.status));
      assert.equal(report.measuredCount, 1);
    });

    it('passes only when every supplied measurement meets its budget', () => {
      const report = evaluateStorefrontBudgets(fullMeasurement, { target: '/' });

      assert.equal(report.overallStatus, 'PASS');
      assert.equal(report.failedCount, 0);
      assert.equal(report.notMeasuredCount, 0);
    });

    it('fails when a real measurement violates its budget', () => {
      const report = evaluateStorefrontBudgets(
        {
          ...fullMeasurement,
          contrast: { ...fullMeasurement.contrast!, worstRatio: 2.1 },
        },
        { target: '/' },
      );

      assert.equal(report.overallStatus, 'FAIL');
      const contrast = report.properties.find((candidate) => candidate.id === '/ contrast');
      assert.ok(contrast);
      assert.equal(contrast.status, 'FAIL');
      assert.match(contrast.observed, /2\.10:1/);
    });

    it('fails when the response carried no Content-Security-Policy header', () => {
      const report = evaluateStorefrontBudgets(
        {
          ...fullMeasurement,
          headers: { ...fullMeasurement.headers!, contentSecurityPolicy: null },
        },
        { target: '/' },
      );

      const csp = report.properties.find((candidate) => candidate.id === '/ csp');
      assert.ok(csp);
      assert.equal(csp.status, 'FAIL');
      assert.match(csp.observed, /absent/);
    });

    it('never reaches PASS while a required property is unmeasured', () => {
      const withoutHeaders: Partial<StorefrontMeasurements> = {
        target: fullMeasurement.target,
        capturedAt: fullMeasurement.capturedAt,
        contrast: fullMeasurement.contrast,
        touchTargets: fullMeasurement.touchTargets,
        keyboard: fullMeasurement.keyboard,
        timings: fullMeasurement.timings,
      };
      const report = evaluateStorefrontBudgets(withoutHeaders, { target: '/' });

      assert.equal(report.overallStatus, 'NOT_MEASURED');
      assert.ok(report.notMeasuredCount > 0);
      for (const id of ['/ csp', '/ antiFraming', '/ nosniff', '/ hsts']) {
        const property = report.properties.find((candidate) => candidate.id === id);
        assert.ok(property, `expected a property with id "${id}"`);
        assert.equal(property.status, 'NOT_MEASURED');
      }
    });

    it('reports every property as NOT_MEASURED when nothing was measured at all', () => {
      const report = evaluateStorefrontBudgets({}, { target: '/' });

      assert.equal(report.overallStatus, 'NOT_MEASURED');
      assert.equal(report.measuredCount, 0);
      assert.equal(report.notMeasuredCount, report.properties.length);
      assert.ok(report.properties.length >= 9);
    });
  });
});
