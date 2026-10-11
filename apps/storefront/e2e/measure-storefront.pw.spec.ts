import { test, expect } from '@playwright/test';
import {
  collectBrowserMeasurements,
  evaluateStorefrontBudgets,
  writeTargetArtifact,
  type BudgetReport,
} from '../../../scripts/measure-storefront';

/**
 * ECO-1009: real browser measurement of the storefront.
 *
 * Every number below comes from a real Chromium session against the locally
 * served application: computed styles of rendered text, boundingBox() of real
 * interactive elements, real Tab key presses, the navigation response headers,
 * and the Navigation Timing API. No value is supplied as a constant.
 *
 * The measurements are written to one file per page, e.g.
 * docs/ecomos/evidence/ECO-807/browser-measurements-home.json, so
 * scripts/measure-storefront.ts can re-evaluate them without a browser.
 */

const TARGETS = ['/', '/catalog'] as const;

const SOURCE =
  'playwright chromium via playwright.config.ts against the locally served storefront (next dev, ECOM_ENGINE=fake)';

// Each target writes its own artifact file, so a failure on one target cannot
// stop the others from being measured and recorded.
const reports: Record<string, BudgetReport> = {};

for (const target of TARGETS) {
  test.describe(target, () => {
    test('records rendered, keyboard and header measurements', async ({ page }) => {
      const response = await page.goto(target, { waitUntil: 'load' });
      expect(response, `no HTTP response for ${target}`).not.toBeNull();

      const measurements = await collectBrowserMeasurements(
        page,
        response!,
        target,
        `playwright chromium -> ${test.info().project.name}`,
      );
      const artifactPath = writeTargetArtifact(target, measurements, SOURCE);
      console.log(`[ECO-1009] measurements for ${target} written to ${artifactPath}`);

      const report = evaluateStorefrontBudgets(measurements, { target });
      reports[target] = report;

      console.log(`[ECO-1009] ${target} -> ${report.overallStatus}`);
      for (const property of report.properties) {
        console.log(`[ECO-1009]   [${property.status}] ${property.name} :: ${property.observed}`);
      }

      // A measurement that silently measured nothing must fail, not pass.
      expect(measurements.contrast?.samples ?? 0, 'no rendered text was sampled').toBeGreaterThan(0);
      expect(measurements.touchTargets?.samples ?? 0, 'no interactive target was measured').toBeGreaterThan(0);
      expect(measurements.keyboard?.tabPresses ?? 0, 'no Tab press was performed').toBeGreaterThan(0);
      expect(measurements.headers, 'no response headers were captured').not.toBeNull();
      expect(measurements.timings?.resourceCount ?? 0, 'no resource timings were captured').toBeGreaterThan(0);

      for (const property of report.properties) {
        expect(property.status, `${property.name} was not measured: ${property.observed}`).not.toBe('NOT_MEASURED');
      }
    });

    test('meets every measured budget', () => {
      const report = reports[target];
      expect(report, 'the measurement test must run before this verdict').toBeDefined();

      const failures = report!.properties
        .filter((property) => property.status === 'FAIL')
        .map((property) => `${property.name} -> ${property.observed} (required ${property.required})`);

      expect(failures, `measured budget violations on ${target}`).toEqual([]);
    });
  });
}
