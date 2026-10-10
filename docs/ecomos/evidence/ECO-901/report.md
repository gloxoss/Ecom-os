# ECO-901 Task Report: Cross-Profile Release Regression Gates, Budgets & CI Matrix

- **Task**: `ECO-901`
- **Phase**: 9 (Release Readiness, Hardening & Final Launch Gate)
- **Lane**: `platform`
- **Executor**: `tooling-cleanup`
- **Base SHA**: `efbfe5728b5fefcd71160d8ab7047a3960c37250`
- **Worktree**: `C:/dev/ecomos-eco301`
- **Branch**: `fix/eco-901-release-regression`
- **Evidence Documentation**: `docs/ecomos/evidence/ECO-901/report.md`

---

## 1. Scope & Claimed Paths Verification

The following paths were claimed and created strictly within the approved boundary:
- `apps/storefront/e2e/release.spec.ts`: E2E release regression test suite verifying profile invariants (guest-first, COD only), RFQ addon state isolation, performance budgets, accessibility criteria, and security headers.
- `scripts/measure-storefront.ts`: Performance, accessibility, and security budget evaluation tool with typed thresholds.
- `docs/ecomos/release/CI_MATRIX.md`: End-to-end CI stage matrix covering frozen lockfile builds, engine guards, typechecks, security scans, and multi-profile builds.
- `docs/ecomos/evidence/ECO-901/budgets.md`: Performance and accessibility budgets audit document.
- `docs/ecomos/evidence/ECO-901/report.md`: Task evidence report.

Zero modifications were made to protected paths (`plugins/wordpress-mcp`), root configuration files, or unclaimed components.

---

## 2. Invariants & Release Safeguards

1. **Deterministic CI Matrix**: Every stage binds exact tool versions (Node 22+, pnpm 11.7.0, TypeScript 5.9.3, Vitest 4.1.11) and exercises core, addon on/off, and multi-profile builds.
2. **Permanent Guest-First Guarantee**: All release regression tests verify that `capabilities.customerAccounts` remains false and no customer accounts are created or required.
3. **Certified Payments Only**: Only certified payment methods (`['cod']`) are permitted.
4. **Agreed Performance & Accessibility Budgets**: All computed performance latencies (< 5ms), contrast ratios (16.1:1 AAA), and touch targets (44px) meet or exceed standards.

---

## 3. Verification & Checks

### A. TypeScript Typecheck
- **Command**: `npx tsc -p apps/storefront/tsconfig.json --noEmit`
- **Result**: `PASS` (0 errors)

### B. Automated Performance Budget Measurement
- **Command**: `npx tsx scripts/measure-storefront.ts`
- **Result**: `PASS` (overallStatus: 'PASS', all budgets green)

### C. Release Regression Spec Suite
- **Command**: `npx tsx --test apps/storefront/e2e/release.spec.ts`
- **Result**: `PASS` (5 tests passed in 201ms)
  - enforces permanent guest-first and cash-on-delivery invariants
  - validates locale and currency consistency across profile
  - verifies RFQ addon operational mode when active
  - verifies fail-closed behavior when RFQ capability is toggled off
  - evaluates all performance, accessibility, and security budgets against strict thresholds
