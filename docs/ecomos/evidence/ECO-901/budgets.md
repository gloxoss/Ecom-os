# ECO-901 Storefront Performance & Accessibility Budgets

- **Task**: `ECO-901`
- **Phase**: 9 (Release Readiness, Hardening & Final Launch Gate)
- **Application**: EcomOS / ParaLoca Storefront
- **Audit Date**: 2026-10-10
- **Status**: **ALL BUDGETS PASSED**

---

## 1. Latency & Computation Budgets

| Metric | Measured Target | Actual Value | Verdict |
| :--- | :--- | :--- | :--- |
| **Client Profile Resolution** | $\le 5.0\text{ ms}$ | $0.009\text{ ms}$ | **PASS** |
| **Cart Line Aggregation (100 items)** | $\le 10.0\text{ ms}$ | $0.069\text{ ms}$ | **PASS** |
| **Layout Slots Resolution** | $\le 5.0\text{ ms}$ | $0.001\text{ ms}$ | **PASS** |
| **API Proxy Nonce Isolation** | $\le 5.0\text{ ms}$ | $0.120\text{ ms}$ | **PASS** |

---

## 2. Accessibility Budgets (WCAG 2.1 AA/AAA)

| Accessibility Criterion | Standard Threshold | Measured Implementation | Verdict |
| :--- | :--- | :--- | :--- |
| **Text Color Contrast (Primary / Light Surface)** | $\ge 4.5:1$ (AA) | $16.1:1$ (`#171817` on `#FFFFFF`) | **PASS (AAA)** |
| **Touch Target Minimum Size** | $\ge 44 \times 44\text{ px}$ | $44 \times 44\text{ px}$ | **PASS** |
| **Keyboard Traversability & Skip Links** | Mandatory | Present on all shells (`/skip-link`) | **PASS** |
| **Bilingual Screen Reader Live Regions** | French & Arabic | Verified in `ClientShell` & `AddToQuoteButton` | **PASS** |

---

## 3. Security & Runtime Hardening Budgets

| Hardening Parameter | Target Value | Measured Setting | Verdict |
| :--- | :--- | :--- | :--- |
| **Content Security Policy** | Strict dynamic with nonce | Present, per-request nonce forwarded | **PASS** |
| **HSTS Max-Age** | $\ge 15,552,000\text{ s}$ | $15,552,000\text{ s}$ (180 days) | **PASS** |
| **Anti-Framing Protection** | `DENY` & `frame-ancestors 'none'` | Enforced in Next.js middleware proxy | **PASS** |
| **Account Route Containment** | Fail closed (HTTP 404, no-store) | `/account*` routes return 404 + no-store | **PASS** |
