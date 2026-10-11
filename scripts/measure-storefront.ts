/**
 * Storefront budget measurement.
 *
 * Honesty rules this module must keep (ECO-1009, audit finding 5):
 *  - Every reported property is either genuinely measured here, or explicitly
 *    reported as NOT_MEASURED. No constant ever stands in for a measurement.
 *  - `overallStatus` is PASS only when at least one property was actually
 *    measured, every measured property passed, and nothing required is missing.
 *  - A browser-driven run exits 0 (all measured budgets pass), 1 (a measured
 *    budget was violated) or 3 (nothing could be measured / blocked).
 *
 * What can be measured where:
 *  - Rendered contrast, touch targets, keyboard traversal, navigation timing and
 *    response headers require a real browser against a running storefront
 *    (`--browser`, or the Playwright specs in apps/storefront/e2e).
 *  - `runPerformanceMeasurement()` only measures an in-process code path. It
 *    reports every browser-only property as NOT_MEASURED and never returns PASS.
 */

import { performance } from 'node:perf_hooks';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { paralocaProfile } from '../clients/paraloca/profile';
import type { Page, Response } from '@playwright/test';

export type PropertyStatus = 'PASS' | 'FAIL' | 'NOT_MEASURED';

export interface MeasuredProperty {
  id: string;
  name: string;
  /** Where the number came from. Empty for unmeasured properties. */
  scope: string;
  /** The budget the property is judged against. */
  required: string;
  /** The value actually observed, or why nothing was observed. */
  observed: string;
  status: PropertyStatus;
}

export interface BudgetReport {
  timestamp: string;
  source: 'browser' | 'in-process' | 'none';
  target: string | null;
  properties: MeasuredProperty[];
  measuredCount: number;
  notMeasuredCount: number;
  failedCount: number;
  overallStatus: PropertyStatus;
}

/**
 * Thresholds. Contrast and HSTS mirror WCAG AA (1.4.3) and the header policy the
 * storefront declares in apps/storefront/src/proxy.ts. Touch target 44px is the
 * WCAG 2.5.5 (AAA) figure the earlier evidence claimed; it is kept as the budget
 * so the claim is tested rather than assumed. DOMContentLoaded is generous
 * because `next dev` compiles on demand.
 */
export const STOREFRONT_BUDGETS = {
  contrastMinimumRatio: 4.5,
  touchTargetMinimumPx: 44,
  touchTargetMinimumAaPx: 24,
  hstsMinimumMaxAgeSeconds: 15_552_000,
  domContentLoadedMaximumMs: 20_000,
  keyboardTabPresses: 12,
} as const;

export const MEASUREMENTS_ARTIFACT_DIR = path.join('docs', 'ecomos', 'evidence', 'ECO-807');
export const MEASUREMENTS_ARTIFACT_PREFIX = 'browser-measurements';

/* ------------------------------------------------------------------ *
 * Browser measurement shapes (produced by a real Chromium session)
 * ------------------------------------------------------------------ */

export interface ContrastSample {
  tag: string;
  text: string;
  ratio: number;
  color: string;
  background: string;
}

export interface ContrastMeasurement {
  scope: string;
  samples: number;
  /** Elements skipped because their backdrop is an image/gradient, not a colour. */
  indeterminate: number;
  worstRatio: number;
  minimumRequired: number;
  worst: ContrastSample | null;
}

export interface TouchTargetSample {
  label: string;
  widthPx: number;
  heightPx: number;
  shortestPx: number;
}

export interface TouchTargetMeasurement {
  scope: string;
  samples: number;
  smallestPx: number;
  minimumRequired: number;
  belowMinimum: number;
  /** The smallest targets, so a reviewer can reproduce the finding. */
  smallestTargets: TouchTargetSample[];
}

export interface KeyboardMeasurement {
  scope: string;
  tabPresses: number;
  focusMoves: number;
  visibleFocusIndicators: number;
  focusedElements: string[];
}

export interface HeaderMeasurement {
  url: string;
  status: number;
  contentSecurityPolicy: string | null;
  xFrameOptions: string | null;
  xContentTypeOptions: string | null;
  referrerPolicy: string | null;
  permissionsPolicy: string | null;
  hstsMaxAgeSeconds: number | null;
}

export interface TimingMeasurement {
  url: string;
  domContentLoadedMs: number;
  loadMs: number;
  responseStartMs: number;
  transferSizeBytes: number;
  resourceCount: number;
}

export interface StorefrontMeasurements {
  target: string;
  capturedAt: string;
  contrast: ContrastMeasurement | null;
  touchTargets: TouchTargetMeasurement | null;
  keyboard: KeyboardMeasurement | null;
  headers: HeaderMeasurement | null;
  timings: TimingMeasurement | null;
}

export interface MeasurementArtifact {
  generatedAt: string;
  source: string;
  targets: Record<string, StorefrontMeasurements>;
}

/* ------------------------------------------------------------------ *
 * Pure evaluation
 * ------------------------------------------------------------------ */

function blankBrowserProperties(
  target: string,
  reason: string,
): MeasuredProperty[] {
  const scope = '';
  const unmeasured = (id: string, name: string, required: string): MeasuredProperty => ({
    id,
    name,
    scope,
    required,
    observed: reason,
    status: 'NOT_MEASURED',
  });

  return [
    unmeasured(
      'contrast',
      'Text contrast, worst rendered element',
      `>= ${STOREFRONT_BUDGETS.contrastMinimumRatio}:1 (WCAG 1.4.3 AA)`,
    ),
    unmeasured(
      'touchTargets',
      'Touch target size, smallest rendered target',
      `>= ${STOREFRONT_BUDGETS.touchTargetMinimumPx}px (WCAG 2.5.5 AAA)`,
    ),
    unmeasured(
      'touchTargetsAA',
      'Touch target size, WCAG 2.2 AA floor',
      `>= ${STOREFRONT_BUDGETS.touchTargetMinimumAaPx}px (WCAG 2.5.8 AA)`,
    ),
    unmeasured(
      'keyboard',
      'Keyboard traversal and visible focus indicator',
      `>= 1 Tab move with a visible focus indicator`,
    ),
    unmeasured('csp', 'Content-Security-Policy header present', 'header present on the measured response'),
    unmeasured('antiFraming', 'X-Frame-Options anti-framing', 'value is DENY'),
    unmeasured('nosniff', 'X-Content-Type-Options', 'value is nosniff'),
    unmeasured(
      'hsts',
      'Strict-Transport-Security max-age',
      `>= ${STOREFRONT_BUDGETS.hstsMinimumMaxAgeSeconds}`,
    ),
    unmeasured(
      'timings',
      'DOMContentLoaded on the served page',
      `<= ${STOREFRONT_BUDGETS.domContentLoadedMaximumMs}ms`,
    ),
  ].map((property) => ({
    ...property,
    id: target === '' ? property.id : `${target} ${property.id}`,
    name: target === '' ? property.name : `${target}: ${property.name}`,
  }));
}

/**
 * Judge a set of browser measurements. Missing measurements are reported as
 * NOT_MEASURED, never as PASS.
 */
export function evaluateStorefrontBudgets(
  measurements: Partial<StorefrontMeasurements>,
  options: { target?: string } = {},
): BudgetReport {
  const target = options.target ?? measurements.target ?? '';
  const missingReason = 'not measured: no browser run supplied a value for this property';
  const properties =
    measurements.contrast === undefined &&
    measurements.touchTargets === undefined &&
    measurements.keyboard === undefined &&
    measurements.headers === undefined &&
    measurements.timings === undefined
      ? blankBrowserProperties(target, missingReason)
      : [];

  if (properties.length === 0) {
    const prefix = target === '' ? '' : `${target}: `;

    const contrast = measurements.contrast;
    properties.push(
      contrast
        ? {
            id: `${target} contrast`,
            name: `${prefix}Text contrast, worst rendered element`,
            scope: contrast.scope,
            required: `>= ${contrast.minimumRequired}:1 (WCAG 1.4.3 AA)`,
            observed: `${contrast.worstRatio.toFixed(2)}:1 across ${contrast.samples} sampled elements (${contrast.indeterminate} indeterminate)${
              contrast.worst
                ? `; worst: <${contrast.worst.tag}> "${contrast.worst.text}" ${contrast.worst.color} on ${contrast.worst.background}`
                : ''
            }`,
            status:
              contrast.samples === 0
                ? 'NOT_MEASURED'
                : contrast.worstRatio >= contrast.minimumRequired
                  ? 'PASS'
                  : 'FAIL',
          }
        : {
            id: `${target} contrast`,
            name: `${prefix}Text contrast, worst rendered element`,
            scope: '',
            required: `>= ${STOREFRONT_BUDGETS.contrastMinimumRatio}:1 (WCAG 1.4.3 AA)`,
            observed: missingReason,
            status: 'NOT_MEASURED',
          },
    );

    const touch = measurements.touchTargets;
    const smallestDetail = touch?.smallestTargets
      ?.slice(0, 3)
      .map((sample) => `${sample.shortestPx}px ${sample.label}`)
      .join('; ');
    const touchObserved = touch
      ? `${touch.smallestPx}px smallest of ${touch.samples} interactive elements; ${touch.belowMinimum} below ${touch.minimumRequired}px${smallestDetail ? `; smallest: ${smallestDetail}` : ''}`
      : missingReason;

    properties.push(
      touch
        ? {
            id: `${target} touchTargets`,
            name: `${prefix}Touch target size, smallest rendered target`,
            scope: touch.scope,
            required: `>= ${touch.minimumRequired}px (WCAG 2.5.5 AAA)`,
            observed: touchObserved,
            status:
              touch.samples === 0
                ? 'NOT_MEASURED'
                : touch.smallestPx >= touch.minimumRequired
                  ? 'PASS'
                  : 'FAIL',
          }
        : {
            id: `${target} touchTargets`,
            name: `${prefix}Touch target size, smallest rendered target`,
            scope: '',
            required: `>= ${STOREFRONT_BUDGETS.touchTargetMinimumPx}px (WCAG 2.5.5 AAA)`,
            observed: missingReason,
            status: 'NOT_MEASURED',
          },
      touch
        ? {
            id: `${target} touchTargetsAA`,
            name: `${prefix}Touch target size, WCAG 2.2 AA floor`,
            scope: touch.scope,
            required: `>= ${STOREFRONT_BUDGETS.touchTargetMinimumAaPx}px (WCAG 2.5.8 AA)`,
            observed: touchObserved,
            status:
              touch.samples === 0
                ? 'NOT_MEASURED'
                : touch.smallestPx >= STOREFRONT_BUDGETS.touchTargetMinimumAaPx
                  ? 'PASS'
                  : 'FAIL',
          }
        : {
            id: `${target} touchTargetsAA`,
            name: `${prefix}Touch target size, WCAG 2.2 AA floor`,
            scope: '',
            required: `>= ${STOREFRONT_BUDGETS.touchTargetMinimumAaPx}px (WCAG 2.5.8 AA)`,
            observed: missingReason,
            status: 'NOT_MEASURED',
          },
    );

    const keyboard = measurements.keyboard;
    properties.push(
      keyboard
        ? {
            id: `${target} keyboard`,
            name: `${prefix}Keyboard traversal and visible focus indicator`,
            scope: keyboard.scope,
            required: '>= 1 Tab move, every observed focus with a visible indicator',
            observed: `${keyboard.focusMoves}/${keyboard.tabPresses} Tab presses moved focus; ${keyboard.visibleFocusIndicators} showed a visible focus indicator`,
            status:
              keyboard.focusMoves > 0 && keyboard.visibleFocusIndicators >= keyboard.focusMoves
                ? 'PASS'
                : 'FAIL',
          }
        : {
            id: `${target} keyboard`,
            name: `${prefix}Keyboard traversal and visible focus indicator`,
            scope: '',
            required: '>= 1 Tab move, every observed focus with a visible indicator',
            observed: missingReason,
            status: 'NOT_MEASURED',
          },
    );

    const headers = measurements.headers;
    const headerProperty = (
      id: string,
      name: string,
      required: string,
      observed: string,
      status: PropertyStatus,
    ): MeasuredProperty => ({
      id: `${target} ${id}`,
      name: `${prefix}${name}`,
      scope: headers ? `response headers for ${headers.url} (HTTP ${headers.status})` : '',
      required,
      observed,
      status,
    });

    properties.push(
      headers
        ? headerProperty(
            'csp',
            'Content-Security-Policy header present',
            'header present on the measured response',
            headers.contentSecurityPolicy
              ? `present: ${headers.contentSecurityPolicy.slice(0, 80)}${headers.contentSecurityPolicy.length > 80 ? '…' : ''}`
              : 'absent (the server sent no Content-Security-Policy header)',
            headers.contentSecurityPolicy ? 'PASS' : 'FAIL',
          )
        : headerProperty(
            'csp',
            'Content-Security-Policy header present',
            'header present on the measured response',
            missingReason,
            'NOT_MEASURED',
          ),
      headers
        ? headerProperty(
            'antiFraming',
            'X-Frame-Options anti-framing',
            'value is DENY',
            headers.xFrameOptions === null ? 'absent' : `value is ${headers.xFrameOptions}`,
            headers.xFrameOptions === 'DENY' ? 'PASS' : 'FAIL',
          )
        : headerProperty(
            'antiFraming',
            'X-Frame-Options anti-framing',
            'value is DENY',
            missingReason,
            'NOT_MEASURED',
          ),
      headers
        ? headerProperty(
            'nosniff',
            'X-Content-Type-Options',
            'value is nosniff',
            headers.xContentTypeOptions === null ? 'absent' : `value is ${headers.xContentTypeOptions}`,
            headers.xContentTypeOptions === 'nosniff' ? 'PASS' : 'FAIL',
          )
        : headerProperty(
            'nosniff',
            'X-Content-Type-Options',
            'value is nosniff',
            missingReason,
            'NOT_MEASURED',
          ),
      headers
        ? headerProperty(
            'hsts',
            'Strict-Transport-Security max-age',
            `>= ${STOREFRONT_BUDGETS.hstsMinimumMaxAgeSeconds}`,
            headers.hstsMaxAgeSeconds === null
              ? 'absent or unparseable'
              : `max-age=${headers.hstsMaxAgeSeconds}`,
            headers.hstsMaxAgeSeconds !== null &&
              headers.hstsMaxAgeSeconds >= STOREFRONT_BUDGETS.hstsMinimumMaxAgeSeconds
              ? 'PASS'
              : 'FAIL',
          )
        : headerProperty(
            'hsts',
            'Strict-Transport-Security max-age',
            `>= ${STOREFRONT_BUDGETS.hstsMinimumMaxAgeSeconds}`,
            missingReason,
            'NOT_MEASURED',
          ),
    );

    const timings = measurements.timings;
    properties.push(
      timings
        ? {
            id: `${target} timings`,
            name: `${prefix}DOMContentLoaded on the served page`,
            scope: `Navigation Timing API for ${timings.url}`,
            required: `<= ${STOREFRONT_BUDGETS.domContentLoadedMaximumMs}ms`,
            observed: `DOMContentLoaded ${Math.round(timings.domContentLoadedMs)}ms, load ${Math.round(timings.loadMs)}ms, TTFB ${Math.round(timings.responseStartMs)}ms, ${timings.resourceCount} resources, ${timings.transferSizeBytes} bytes transferred`,
            status:
              timings.domContentLoadedMs <= STOREFRONT_BUDGETS.domContentLoadedMaximumMs
                ? 'PASS'
                : 'FAIL',
          }
        : {
            id: `${target} timings`,
            name: `${prefix}DOMContentLoaded on the served page`,
            scope: '',
            required: `<= ${STOREFRONT_BUDGETS.domContentLoadedMaximumMs}ms`,
            observed: missingReason,
            status: 'NOT_MEASURED',
          },
    );
  }

  return summarise(properties, 'browser', target === '' ? null : target);
}

export function summarise(
  properties: MeasuredProperty[],
  source: BudgetReport['source'],
  target: string | null,
): BudgetReport {
  const measured = properties.filter((p) => p.status !== 'NOT_MEASURED');
  const failed = properties.filter((p) => p.status === 'FAIL');
  const notMeasured = properties.filter((p) => p.status === 'NOT_MEASURED');

  let overallStatus: PropertyStatus;
  if (failed.length > 0) overallStatus = 'FAIL';
  else if (measured.length === 0 || notMeasured.length > 0) overallStatus = 'NOT_MEASURED';
  else overallStatus = 'PASS';

  return {
    timestamp: new Date().toISOString(),
    source,
    target,
    properties,
    measuredCount: measured.length,
    notMeasuredCount: notMeasured.length,
    failedCount: failed.length,
    overallStatus,
  };
}

/* ------------------------------------------------------------------ *
 * In-process measurement (no browser). Honest about its own limits.
 * ------------------------------------------------------------------ */

/**
 * Measures one real in-process code path: resolving the active client profile.
 * This is a module-resolution micro-benchmark, NOT a rendered-page metric, and
 * every browser-only property is reported as NOT_MEASURED.
 */
export function runPerformanceMeasurement(): BudgetReport {
  const start = performance.now();
  const profile = paralocaProfile;
  const durationMs = Number((performance.now() - start).toFixed(3));
  const withinBudget = durationMs <= 5.0;

  const properties: MeasuredProperty[] = [
    {
      id: 'profileResolution',
      name: 'Brand profile resolution (in-process micro-benchmark)',
      scope: 'in-process; not a rendered-page measurement',
      required: '<= 5ms',
      observed: `${durationMs}ms for profile "${profile.id}"`,
      status: withinBudget ? 'PASS' : 'FAIL',
    },
    ...blankBrowserProperties('', 'not measured: run the browser measurement to produce this value'),
  ];

  return summarise(properties, 'in-process', null);
}

/* ------------------------------------------------------------------ *
 * Browser discovery
 * ------------------------------------------------------------------ */

/**
 * The Playwright library pins an exact Chromium revision, and the machine may
 * only have a different one installed. Find the newest real Chromium build that
 * is actually on disk so the measurement can still run in a real browser.
 * Override with PLAYWRIGHT_CHROMIUM_EXECUTABLE.
 */
export function findInstalledChromium(): string | null {
  const explicit = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (explicit && fs.existsSync(explicit)) return explicit;

  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    process.platform === 'win32'
      ? path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright')
      : path.join(os.homedir(), '.cache', 'ms-playwright'),
  ].filter((value): value is string => Boolean(value));

  const relativeCandidates = [
    path.join('chrome-win64', 'chrome.exe'),
    path.join('chrome-win', 'chrome.exe'),
    path.join('chrome-linux', 'chrome'),
    path.join('chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
  ];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const builds = fs
      .readdirSync(root)
      .filter((name) => /^chromium-\d+$/.test(name))
      .sort((a, b) => Number(b.slice('chromium-'.length)) - Number(a.slice('chromium-'.length)));
    for (const build of builds) {
      for (const relative of relativeCandidates) {
        const candidate = path.join(root, build, relative);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }
  return null;
}

interface LaunchAttempt {
  label: string;
  options: Record<string, unknown>;
}

function launchAttempts(executable: string | null): LaunchAttempt[] {
  const attempts: LaunchAttempt[] = [
    { label: 'playwright default chromium', options: {} },
    { label: 'playwright chromium channel', options: { channel: 'chromium' } },
  ];
  if (executable) {
    attempts.push({ label: `installed chromium build ${executable}`, options: { executablePath: executable } });
  }
  attempts.push(
    { label: 'system chrome channel', options: { channel: 'chrome' } },
    { label: 'system msedge channel', options: { channel: 'msedge' } },
  );
  return attempts;
}

/* ------------------------------------------------------------------ *
 * Real browser measurement
 * ------------------------------------------------------------------ */

/**
 * Records exactly the headers the server actually sent. Nothing here asserts a
 * header the application does not send: a missing CSP is reported as absent.
 */
export function readHeaderMeasurement(response: Response, url: string): HeaderMeasurement {
  const headers = response.headers();
  const hsts = headers['strict-transport-security'] ?? null;
  const maxAgeMatch = hsts === null ? null : /max-age=(\d+)/i.exec(hsts);
  return {
    url,
    status: response.status(),
    contentSecurityPolicy: headers['content-security-policy'] ?? null,
    xFrameOptions: headers['x-frame-options'] ?? null,
    xContentTypeOptions: headers['x-content-type-options'] ?? null,
    referrerPolicy: headers['referrer-policy'] ?? null,
    permissionsPolicy: headers['permissions-policy'] ?? null,
    hstsMaxAgeSeconds: maxAgeMatch ? Number(maxAgeMatch[1]) : null,
  };
}

interface RawContrastSample {
  tag: string;
  text: string;
  ratio: number;
  color: string;
  background: string;
}

/**
 * Walks the rendered DOM in the page and computes WCAG contrast ratios from the
 * computed styles of elements that actually contain text.
 */
/*
 * The in-page scripts are strings on purpose. The repo runs TypeScript through
 * tsx/esbuild, which wraps function expressions with a `__name` helper; passing
 * a function to page.evaluate() then throws "ReferenceError: __name is not
 * defined" inside the browser. A string body is executed as-is in the page.
 */
const CONTRAST_IN_PAGE = `(() => {
  const parseColor = (value) => {
    const match = /rgba?\\(([^)]+)\\)/.exec(value);
    if (!match || !match[1]) return null;
    const parts = match[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3) return null;
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts.length > 3 ? parts[3] : 1];
  };

  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const luminance = (rgb) => 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);

  const contrast = (a, b) => {
    const la = luminance(a);
    const lb = luminance(b);
    const lighter = Math.max(la, lb);
    const darker = Math.min(la, lb);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const over = (fg, bg) => [
    fg[0] * fg[3] + bg[0] * (1 - fg[3]),
    fg[1] * fg[3] + bg[1] * (1 - fg[3]),
    fg[2] * fg[3] + bg[2] * (1 - fg[3]),
  ];

  const samples = [];
  let indeterminate = 0;

  const candidates = Array.from(document.querySelectorAll(
    'p, span, a, button, h1, h2, h3, h4, h5, h6, li, label, td, th, figcaption, blockquote, small, strong, em'
  ));

  // Media that geometrically sits under the text makes the backdrop unknown:
  // computed colours cannot tell us what an image looks like.
  const media = Array.from(document.querySelectorAll('img, video, canvas, picture'))
    .map((node) => node.getBoundingClientRect())
    .filter((rect) => rect.width > 4 && rect.height > 4);
  const overlapsMedia = (rect) =>
    media.some(
      (layer) =>
        !(layer.right <= rect.left || layer.left >= rect.right || layer.bottom <= rect.top || layer.top >= rect.bottom),
    );

  for (const element of candidates) {
    if (samples.length >= 400) break;
    const ownText = Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => (node.textContent || '').trim())
      .join(' ')
      .trim();
    if (ownText.length === 0) continue;

    const rect = element.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const style = window.getComputedStyle(element);
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;
    // Visually hidden helpers (sr-only) are not rendered text.
    if (style.clip !== 'auto' || style.clipPath !== 'none') continue;

    const foreground = parseColor(style.color);
    if (!foreground) continue;

    // Anything painted over an image, video or gradient cannot be judged from
    // computed colours alone; count it as indeterminate instead of guessing.
    if (overlapsMedia(rect)) { indeterminate += 1; continue; }

    // Resolve the first opaque backdrop, blending translucent layers on the way.
    // Give up (rather than guess) when the backdrop is an image or gradient.
    let backdrop = null;
    let node = element;
    const pending = [foreground];
    while (node) {
      const nodeStyle = window.getComputedStyle(node);
      if (nodeStyle.backgroundImage !== 'none') { node = null; break; }
      const layer = parseColor(nodeStyle.backgroundColor);
      if (layer && layer[3] > 0) {
        pending.push(layer);
        if (layer[3] >= 0.999) { backdrop = [layer[0], layer[1], layer[2]]; break; }
      }
      node = node.parentElement;
    }

    if (!backdrop) { indeterminate += 1; continue; }

    let composited = backdrop;
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      composited = over(pending[index], composited);
    }

    samples.push({
      tag: element.tagName.toLowerCase(),
      text: ownText.slice(0, 40),
      ratio: Number(contrast(composited, backdrop).toFixed(2)),
      color: style.color,
      background: 'rgb(' + Math.round(backdrop[0]) + ', ' + Math.round(backdrop[1]) + ', ' + Math.round(backdrop[2]) + ')',
    });
  }

  return { samples: samples, indeterminate: indeterminate };
})()`;

const BLUR_IN_PAGE = `(() => {
  const element = document.activeElement;
  if (element && typeof element.blur === 'function') element.blur();
  return true;
})()`;

const FOCUS_IN_PAGE = `(() => {
  const element = document.activeElement;
  if (!element || element === document.body || element === document.documentElement) return null;
  const style = window.getComputedStyle(element);
  const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth || '0') > 0;
  const hasShadow = style.boxShadow !== 'none';
  return {
    label: element.tagName.toLowerCase(),
    text: (element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40),
    hasIndicator: hasOutline || hasShadow,
  };
})()`;

const TIMINGS_IN_PAGE = `(() => {
  const navigation = performance.getEntriesByType('navigation')[0];
  return {
    domContentLoadedMs: navigation ? navigation.domContentLoadedEventEnd : 0,
    loadMs: navigation ? navigation.loadEventEnd : 0,
    responseStartMs: navigation ? navigation.responseStart : 0,
    transferSizeBytes: navigation ? navigation.transferSize : 0,
    resourceCount: performance.getEntriesByType('resource').length,
  };
})()`;

/**
 * Walks the rendered DOM in the page and computes WCAG contrast ratios from the
 * computed styles of elements that actually contain text.
 */
async function measureContrast(page: Page, scope: string): Promise<ContrastMeasurement> {
  const raw = (await page.evaluate(CONTRAST_IN_PAGE)) as {
    samples: RawContrastSample[];
    indeterminate: number;
  };

  const worst = raw.samples.reduce<RawContrastSample | null>(
    (lowest, sample) => (lowest === null || sample.ratio < lowest.ratio ? sample : lowest),
    null,
  );

  return {
    scope,
    samples: raw.samples.length,
    indeterminate: raw.indeterminate,
    worstRatio: worst ? worst.ratio : 0,
    minimumRequired: STOREFRONT_BUDGETS.contrastMinimumRatio,
    worst,
  };
}

const INTERACTIVE_SELECTOR =
  'a[href], button, input[type="submit"], input[type="button"], [role="button"], [role="tab"], [role="link"]';

/**
 * Every measured target, with its box and its label, in one pass.
 *
 * Labels and boxes must come from the same snapshot. Collecting them in separate
 * round-trips (a locator count, then an evaluate for labels, then per-element
 * boundingBox calls) misaligns them the moment the DOM changes in between — React
 * hydration and the reveal animations both do — which attributes a width to the
 * wrong element and can leave the smallest target unnamed. That made a real
 * failure impossible to locate.
 */
const TOUCH_TARGETS_IN_PAGE = `(() => {
  const results = [];
  const nodes = Array.from(document.querySelectorAll(${JSON.stringify(INTERACTIVE_SELECTOR)}));
  for (const element of nodes) {
    // WCAG 2.5.8 exempts links that are inline within a sentence.
    if (element.tagName === 'A' && getComputedStyle(element).display === 'inline') continue;
    const rect = element.getBoundingClientRect();
    if (rect.width < 0.5 || rect.height < 0.5) continue;
    // checkVisibility() walks display:none ancestors correctly. Do NOT use
    // offsetParent === null as a visibility test: it is also null for position:fixed
    // elements and their absolutely-positioned children, so it silently drops real
    // controls in the fixed header.
    if (typeof element.checkVisibility === 'function' && !element.checkVisibility()) continue;
    if (getComputedStyle(element).visibility === 'hidden') continue;
    const aria = element.getAttribute('aria-label');
    const cls = typeof element.className === 'string' && element.className
      ? ' .' + element.className.trim().split(/\\s+/).slice(0, 3).join('.')
      : '';
    const text = (element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30);
    results.push({
      label:
        element.tagName.toLowerCase() +
        (aria ? '[' + aria + ']' : '') +
        (text ? ' "' + text + '"' : '') +
        cls,
      widthPx: Math.round(rect.width * 100) / 100,
      heightPx: Math.round(rect.height * 100) / 100,
    });
  }
  return results;
})()`;

async function measureTouchTargets(page: Page, scope: string): Promise<TouchTargetMeasurement> {
  const all = (await page.evaluate(TOUCH_TARGETS_IN_PAGE)) as Array<{
    label: string;
    widthPx: number;
    heightPx: number;
  }>;

  let samples = 0;
  let smallest = Number.POSITIVE_INFINITY;
  let belowMinimum = 0;
  const smallestTargets: TouchTargetSample[] = [];

  for (const target of all) {
    const shortest = Math.min(target.widthPx, target.heightPx);
    samples += 1;
    if (shortest < smallest) smallest = shortest;
    if (shortest < STOREFRONT_BUDGETS.touchTargetMinimumPx) belowMinimum += 1;
    smallestTargets.push({
      label: target.label,
      widthPx: target.widthPx,
      heightPx: target.heightPx,
      shortestPx: Number(shortest.toFixed(2)),
    });
  }

  smallestTargets.sort((a, b) => a.shortestPx - b.shortestPx);

  return {
    scope,
    samples,
    smallestPx: samples === 0 ? 0 : Number(smallest.toFixed(2)),
    minimumRequired: STOREFRONT_BUDGETS.touchTargetMinimumPx,
    belowMinimum,
    smallestTargets: smallestTargets.slice(0, 6),
  };
}

async function measureKeyboard(page: Page, scope: string): Promise<KeyboardMeasurement> {
  await page.evaluate(BLUR_IN_PAGE);

  let focusMoves = 0;
  let visibleFocusIndicators = 0;
  const focusedElements: string[] = [];

  for (let index = 0; index < STOREFRONT_BUDGETS.keyboardTabPresses; index += 1) {
    await page.keyboard.press('Tab');
    const focused = (await page.evaluate(FOCUS_IN_PAGE)) as {
      label: string;
      text: string;
      hasIndicator: boolean;
    } | null;
    if (!focused) continue;
    focusMoves += 1;
    if (focused.hasIndicator) visibleFocusIndicators += 1;
    if (focusedElements.length < 8) focusedElements.push(`${focused.label}${focused.text ? `:${focused.text}` : ''}`);
  }

  return {
    scope,
    tabPresses: STOREFRONT_BUDGETS.keyboardTabPresses,
    focusMoves,
    visibleFocusIndicators,
    focusedElements,
  };
}

async function measureTimings(page: Page, url: string): Promise<TimingMeasurement> {
  const entry = (await page.evaluate(TIMINGS_IN_PAGE)) as Omit<TimingMeasurement, 'url'>;
  return { url, ...entry };
}

/**
 * Measure a page that the caller has already navigated to (the response of that
 * navigation is what the header properties come from).
 */
export async function collectBrowserMeasurements(
  page: Page,
  response: Response,
  target: string,
  source: string,
): Promise<StorefrontMeasurements> {
  return {
    target,
    capturedAt: new Date().toISOString(),
    contrast: await measureContrast(page, `computed styles of rendered text on ${target} (${source})`),
    touchTargets: await measureTouchTargets(
      page,
      `boundingBox() of interactive elements on ${target} (${source})`,
    ),
    keyboard: await measureKeyboard(page, `real Tab key presses on ${target} (${source})`),
    headers: readHeaderMeasurement(response, page.url()),
    timings: await measureTimings(page, page.url()),
  };
}

export interface BrowserRunOptions {
  url?: string;
  targets?: string[];
  timeoutMs?: number;
}

/**
 * Launch a real Chromium browser, measure each target path against the running
 * storefront, and evaluate the budgets. Never invents a value it did not see.
 */
export async function runBrowserMeasurement(
  options: BrowserRunOptions = {},
): Promise<{ report: BudgetReport; artifact: MeasurementArtifact | null; blocked: string | null }> {
  const baseUrl = (options.url ?? process.env.STOREFRONT_URL ?? 'http://localhost:3100').replace(/\/$/, '');
  const targets = options.targets ?? ['/', '/catalog'];
  const timeout = options.timeoutMs ?? 60_000;

  let chromium;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch (error) {
    return {
      report: summarise(blankBrowserProperties('', 'not measured: Playwright is not available'), 'none', null),
      artifact: null,
      blocked: `Playwright could not be loaded: ${(error as Error).message}`,
    };
  }

  const executable = findInstalledChromium();
  let browser;
  let browserLabel = '';
  const launchFailures: string[] = [];
  for (const attempt of launchAttempts(executable)) {
    try {
      browser = await chromium.launch(attempt.options);
      browserLabel = attempt.label;
      break;
    } catch (error) {
      launchFailures.push(`${attempt.label}: ${(error as Error).message.split('\n')[0]}`);
    }
  }

  if (!browser) {
    const detail = launchFailures.join(' | ');
    return {
      report: summarise(
        blankBrowserProperties('', 'not measured: no Chromium browser could be launched'),
        'none',
        null,
      ),
      artifact: null,
      blocked: `Chromium could not be launched (${detail})`,
    };
  }

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const source = `chromium ${browser.version()} via ${browserLabel} -> ${baseUrl}`;
    const collected: Record<string, StorefrontMeasurements> = {};

    for (const target of targets) {
      const response = await page.goto(`${baseUrl}${target}`, { waitUntil: 'load', timeout });
      if (!response) {
        await context.close();
        return {
          report: summarise(
            blankBrowserProperties('', `not measured: no response for ${target}`),
            'none',
            null,
          ),
          artifact: null,
          blocked: `No HTTP response was received for ${baseUrl}${target}`,
        };
      }
      collected[target] = await collectBrowserMeasurements(page, response, target, source);
    }

    await context.close();

    const artifact: MeasurementArtifact = {
      generatedAt: new Date().toISOString(),
      source,
      targets: collected,
    };

    const reports = Object.entries(collected).map(([target, measurements]) =>
      evaluateStorefrontBudgets(measurements, { target }),
    );
    const properties = reports.flatMap((report) => report.properties);
    return { report: summarise(properties, 'browser', targets.join(', ')), artifact, blocked: null };
  } catch (error) {
    return {
      report: summarise(
        blankBrowserProperties('', `not measured: ${(error as Error).message}`),
        'none',
        null,
      ),
      artifact: null,
      blocked: (error as Error).message,
    };
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

/* ------------------------------------------------------------------ *
 * Artifact I/O
 * ------------------------------------------------------------------ */

function repoRoot(): string {
  let directory = process.cwd();
  for (let depth = 0; depth < 8; depth += 1) {
    if (fs.existsSync(path.join(directory, 'pnpm-workspace.yaml'))) return directory;
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return process.cwd();
}

/**
 * One artifact file per measured page. Separate files keep concurrent writers
 * from clobbering each other's target, and each file is overwritten in full by
 * whichever run measured that page, so no value is ever merged or carried over.
 */
export function artifactPathFor(target: string, root: string = repoRoot()): string {
  const slug = target === '/' ? 'home' : target.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'root';
  return path.join(root, MEASUREMENTS_ARTIFACT_DIR, `${MEASUREMENTS_ARTIFACT_PREFIX}-${slug}.json`);
}

export function writeTargetArtifact(
  target: string,
  measurements: StorefrontMeasurements,
  source: string,
  root: string = repoRoot(),
): string {
  const destination = artifactPathFor(target, root);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const artifact: MeasurementArtifact = {
    generatedAt: new Date().toISOString(),
    source,
    targets: { [target]: measurements },
  };
  fs.writeFileSync(destination, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  return destination;
}

export function writeArtifact(artifact: MeasurementArtifact, root: string = repoRoot()): string[] {
  return Object.entries(artifact.targets).map(([target, measurements]) =>
    writeTargetArtifact(target, measurements, artifact.source, root),
  );
}

export function readArtifacts(root: string = repoRoot()): MeasurementArtifact | null {
  const directory = path.join(root, MEASUREMENTS_ARTIFACT_DIR);
  if (!fs.existsSync(directory)) return null;
  const files = fs
    .readdirSync(directory)
    .filter((name) => name.startsWith(MEASUREMENTS_ARTIFACT_PREFIX) && name.endsWith('.json'))
    .sort();

  const targets: Record<string, StorefrontMeasurements> = {};
  const sources = new Set<string>();
  let generatedAt = '';

  for (const file of files) {
    try {
      const parsed = JSON.parse(
        fs.readFileSync(path.join(directory, file), 'utf8'),
      ) as MeasurementArtifact;
      for (const [target, measurements] of Object.entries(parsed.targets ?? {})) {
        targets[target] = measurements;
      }
      sources.add(parsed.source);
      if (parsed.generatedAt > generatedAt) generatedAt = parsed.generatedAt;
    } catch {
      // A corrupt artifact must not silently become a measurement.
    }
  }

  if (Object.keys(targets).length === 0) return null;
  return { generatedAt, source: [...sources].join(' | '), targets };
}

export function evaluateArtifact(artifact: MeasurementArtifact): BudgetReport {
  const reports = Object.entries(artifact.targets).map(([target, measurements]) =>
    evaluateStorefrontBudgets(measurements, { target }),
  );
  return summarise(
    reports.flatMap((report) => report.properties),
    'browser',
    Object.keys(artifact.targets).join(', '),
  );
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

function printReport(report: BudgetReport): void {
  console.log('--- Storefront measurement (ECO-1009) ---');
  console.log(`source         : ${report.source}`);
  console.log(`target(s)      : ${report.target ?? '(none)'}`);
  console.log(`overall        : ${report.overallStatus}`);
  console.log(
    `measured ${report.measuredCount} | failed ${report.failedCount} | not measured ${report.notMeasuredCount}`,
  );
  for (const property of report.properties) {
    console.log(`  [${property.status}] ${property.name}`);
    console.log(`      required : ${property.required}`);
    console.log(`      observed : ${property.observed}`);
    if (property.scope) console.log(`      scope    : ${property.scope}`);
  }
  console.log('');
  console.log(JSON.stringify(report, null, 2));
}

async function main(argv: string[]): Promise<number> {
  const useBrowser = argv.includes('--browser');
  const urlIndex = argv.indexOf('--url');
  const url = urlIndex >= 0 ? argv[urlIndex + 1] : undefined;

  if (useBrowser) {
    const { report, artifact, blocked } = await runBrowserMeasurement(url ? { url } : {});
    if (blocked) {
      console.log(`NOT MEASURED / blocked: ${blocked}`);
    }
    if (artifact) {
      for (const destination of writeArtifact(artifact)) {
        console.log(`measurements written to ${destination}`);
      }
    }
    printReport(report);
    if (report.overallStatus === 'NOT_MEASURED') return 3;
    return report.overallStatus === 'PASS' ? 0 : 1;
  }

  const artifact = readArtifacts();
  if (!artifact) {
    const report = summarise(
      blankBrowserProperties(
        '',
        `not measured: no browser measurement artifact under ${MEASUREMENTS_ARTIFACT_DIR}/${MEASUREMENTS_ARTIFACT_PREFIX}-*.json. Run "node node_modules/tsx/dist/cli.mjs scripts/measure-storefront.ts --browser" or the Playwright specs in apps/storefront/e2e.`,
      ),
      'none',
      null,
    );
    printReport(report);
    console.log('NOT MEASURED: no browser measurement has been recorded.');
    return 3;
  }

  console.log('--- recorded browser measurements ---');
  for (const [target, measurements] of Object.entries(artifact.targets)) {
    console.log(`  ${target} captured ${measurements.capturedAt}`);
  }
  const report = evaluateArtifact(artifact);
  printReport(report);
  if (report.overallStatus === 'NOT_MEASURED') return 3;
  return report.overallStatus === 'PASS' ? 0 : 1;
}

// This module is also imported by playwright.config.ts and by a node:test file,
// so it must not depend on import.meta (Playwright loads the config as CJS).
const invokedDirectly = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  return /(^|[\\/])measure-storefront\.(ts|js|mjs)$/i.test(entry);
})();

if (invokedDirectly) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      console.error(`measurement failed: ${(error as Error).message}`);
      process.exitCode = 3;
    });
}
