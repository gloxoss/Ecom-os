# ECO-807 / ECO-1009 Browser Measurement Record

- **Task**: `ECO-1009` (remediation of audit finding 5 for `ECO-807` / `ECO-904`)
- **Date**: 2026-10-11
- **Machine**: Windows 11, Node 24, no WordPress / MySQL / Docker daemon present
- **Engine**: `ECOM_ENGINE=fake` (the FakeEngine). It renders real pages but returns zero products.

---

## 1. What this replaces

`docs/ecomos/evidence/ECO-807/uat.md` claimed a browser UAT pass on `staging.paraloca.ma`.
No browser was ever launched and no staging host was contacted. The numbers it reported for
contrast and touch targets were constants inside `scripts/measure-storefront.ts`.

This document records measurements that were actually taken by a real Chromium browser
against the locally served storefront. Where something could not be measured, it says so.

---

## 2. Exact commands

Run from the repository root.

```bash
# 1. Serve the storefront (no live WooCommerce exists, so the fake engine is used)
cd apps/storefront
ECOM_ENGINE=fake node node_modules/next/dist/bin/next dev -p 3100

# 2. Real browser measurement + budget assertions (Playwright)
node node_modules/@playwright/test/cli.js test

# 3. Same measurement driven directly by the script (launches Chromium itself)
node node_modules/tsx/dist/cli.mjs scripts/measure-storefront.ts --browser

# 4. Re-evaluate the recorded measurements without a browser
node node_modules/tsx/dist/cli.mjs scripts/measure-storefront.ts

# 5. The node:test suites that live in the same folder and are NOT Playwright specs
node node_modules/tsx/dist/cli.mjs --test apps/storefront/e2e/release.spec.ts
```

Exit codes from `scripts/measure-storefront.ts`: `0` every measured budget passed,
`1` a measured budget was violated, `3` NOT MEASURED / blocked (nothing to measure).

---

## 3. Measured values

Browser: Chromium `153.0.8010.12`, launched from the installed build
`%LOCALAPPDATA%\ms-playwright\chromium-1243\chrome-win64\chrome.exe`
(the Playwright library pins revision 1248, which is not installed on this machine;
`--browser` falls back through the installed builds and the `chrome`/`msedge` channels).

Artifacts: `browser-measurements-home.json`, `browser-measurements-catalog.json`
(one file per page, written by the Playwright spec; each carries its own `capturedAt`).

| Property | `/` | `/catalog` | Budget | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| Text contrast, worst rendered element | 16.28:1 | 16.28:1 | >= 4.5:1 (WCAG 1.4.3 AA) | **PASS** |
| Elements sampled / considered indeterminate | 141 / 223 | 87 / 162 | - | - |
| Touch target, smallest rendered | 16.5 px | 20 px | >= 44 px (WCAG 2.5.5 AAA) | **FAIL** |
| Touch target, WCAG 2.2 AA floor | 16.5 px | 20 px | >= 24 px (WCAG 2.5.8 AA) | **FAIL** |
| Targets measured / below 44 px | 30 / 13 | 27 / 16 | - | - |
| Keyboard: Tab presses that moved focus | 12 of 12 | 12 of 12 | >= 1 | **PASS** |
| Keyboard: focused elements with a visible indicator | 12 of 12 | 12 of 12 | all | **PASS** |
| `Content-Security-Policy` present | yes | yes | header present | **PASS** |
| `X-Frame-Options` | `DENY` | `DENY` | `DENY` | **PASS** |
| `X-Content-Type-Options` | `nosniff` | `nosniff` | `nosniff` | **PASS** |
| `Strict-Transport-Security` | `max-age=15552000` | `max-age=15552000` | >= 15552000 | **PASS** |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | same | observed, not budgeted | - |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | same | observed, not budgeted | - |
| DOMContentLoaded / load / TTFB | 257 / 436 / 234 ms | 204 / 374 / 181 ms | <= 20000 ms | **PASS** |
| Resources / transfer size | 28 / 26 560 B | 30 / 21 482 B | observed, not budgeted | - |

Overall: **FAIL** (exit code 1), driven entirely by touch target size.

---

## 4. The touch-target finding

This is a real, reproducible defect, not a threshold argument. Details as recorded:

- `/` smallest: `a "Pâtisseries" .hero-category-link.group.flex` measured 190 x 16.5 px.
  Its markup carries `text-[10px] md:text-[11px]` and no vertical padding, so the anchor
  box is the text line only. Second smallest: `a "Épicerie Fine"` at the same 16.5 px.
- `/catalog` smallest: `a "Shop Pâtisseries" .font-body.text-sm.font-medium` at 141.56 x 20 px,
  with five sibling "Shop ..." links at the same height.
- 13 of 30 interactive targets on `/` and 16 of 27 on `/catalog` are under 44 px.
- An earlier evidence file reported `touchTargetMinPx: 44, status: PASS`. That number was a
  constant in the script and is contradicted by these measurements.
- Links that are `display: inline` inside a sentence are excluded (WCAG 2.5.8 exception);
  every element above is a `flex`/block control, so the exception does not apply.

Fixing this is a UI change under `apps/storefront/src/**`, outside this task's scope.

---

## 5. Contrast measurement method and its limit

Ratios come from `getComputedStyle` in the live page: the text colour is composited over the
first opaque ancestor background. An element is counted as **indeterminate** (and excluded
rather than guessed) when an `<img>`, `<video>`, `<canvas>` or a CSS gradient overlaps its box.

On `/`, 223 of 364 candidate text elements sit over the hero imagery and are therefore
indeterminate; 141 produced a flat-colour ratio. A worst-case figure for image-backed text
cannot be produced from computed styles at all. Sampling rendered pixels would be required.

Elements that are visually hidden (`clip: rect(0,0,0,0)`, zero-size boxes) are skipped:
they are not rendered text.

---

## 6. What is still NOT measured

| Claim | Status | What would prove it |
| :--- | :--- | :--- |
| A real WooCommerce order, stock, totals, order status | **NOT MEASURED** | A live WordPress + WooCommerce and a driver that places a real order |
| Add to bag -> cart drawer with a real product | **NOT MEASURED** (skipped, with reason) | A product source: live Woo, or engine fixtures. `FakeEngine` returns zero products, so `/product/<slug>` returns HTTP 404 and the home page renders no product links |
| Second isolated client (own deployment, WordPress, database, secrets) | **NOT MEASURED** | A provisioned second installation; `profile-reuse.spec.ts` only compares two TypeScript profile objects |
| Production CSP | **NOT MEASURED** | A production build / deployment. The CSP above is the permissive development policy from `apps/storefront/src/proxy.ts`; the production policy uses a nonce and `strict-dynamic` |
| Production performance | **NOT MEASURED** | Measurements against a production build; the figures above are `next dev` on localhost |
| Mobile 375 px layout, drawer, RTL | **NOT MEASURED** | A run at that viewport against the ParaLoca profile. The dev server currently runs the `angelina` theme, not the ParaLoca client |

---

## 7. Reproducing the cart journey

`apps/storefront/e2e/cart-flow.pw.spec.ts` drives the real cart:
clicking the header `Cart (0)` link navigates to `/cart` and the rendered cart page is asserted.

The add-to-bag leg reports **NOT MEASURED** with its evidence attached
(`0 links matching a[href*="/product/"]` on `/`; `GET /product/signature-mont-blanc -> HTTP 404`).
It will run and assert the real header count and cart contents as soon as a product source exists.
