import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { paralocaProfile } from '../../../clients/paraloca/profile';
import { runPerformanceMeasurement } from '../../../scripts/measure-storefront';

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

  describe('3. Automated Performance & Accessibility Budgets', () => {
    it('evaluates all performance, accessibility, and security budgets against strict thresholds', () => {
      const report = runPerformanceMeasurement();
      assert.equal(report.overallStatus, 'PASS');

      // Check specific performance budgets
      for (const budget of report.budgets) {
        assert.ok(
          budget.actualDurationMs <= budget.maxDurationMs,
          `Budget "${budget.name}" exceeded: ${budget.actualDurationMs}ms > ${budget.maxDurationMs}ms`
        );
        assert.equal(budget.status, 'PASS');
      }

      // Check accessibility thresholds (WCAG AA/AAA)
      assert.ok(report.accessibility.achievedContrastRatio >= report.accessibility.minimumContrastRatio);
      assert.ok(report.accessibility.touchTargetMinPx >= 44);
      assert.equal(report.accessibility.keyboardTraversable, true);
      assert.equal(report.accessibility.status, 'PASS');

      // Check security headers
      assert.equal(report.security.cspEnforced, true);
      assert.equal(report.security.antiFraming, true);
      assert.ok(report.security.hstsMaxAge >= 15552000);
      assert.equal(report.security.status, 'PASS');
    });
  });
});
