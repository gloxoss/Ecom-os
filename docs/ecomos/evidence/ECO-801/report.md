# ECO-801 Task Report: French-Moroccan ParaLoca Profile & Theme Selection

- **Task**: `ECO-801`
- **Phase**: 8 (French-Moroccan ParaLoca Profile & Storefront Customization)
- **Lane**: `experience`
- **Executor**: `runtime-cleanup`
- **Base SHA**: `d255283d35e3eb2f9d8501b5e56f8d9c89fc844e`
- **Worktree**: `C:/dev/ecomos-eco301`
- **Branch**: `fix/eco-801-paraloca-profile`
- **Evidence Documentation**: `docs/ecomos/evidence/ECO-801/report.md`

---

## 1. Scope & Claimed Paths Verification

The following paths were claimed and modified strictly within the approved boundary:
- `clients/paraloca`: Validated `profile.ts`, `README.md`, unit contract suite `profile.test.ts`
- `packages/themes/src/clients/paraloca`: Registered theme token definitions `theme.ts` adhering to approved medical-lifestyle guidelines
- `apps/storefront/src/lib/client-profile.ts`: Runtime client profile & theme resolver adhering to environment seams
- `apps/storefront/e2e/paraloca-profile.spec.ts`: E2E client profile contract test suite
- `docs/ecomos/evidence/ECO-801/report.md`: Task evidence report

Zero modifications were made to protected files (`plugins/wordpress-mcp`), root configuration files, or other agent claims.

---

## 2. Invariants & Business Logic Attestation

1. **Brand Identity & Orthography**: Approved CamelCase brand spelling **ParaLoca** enforced across profile manifests, slugs, and documentation.
2. **Moroccan Market & Currency Context**: Configured default currency `MAD` (Moroccan Dirham), default locale `fr`, with typography readiness for `ar`. Default country locked to Morocco (`MA`).
3. **Certified Payment Gateways Only**: Payment method strictly locked to certified `cod` (Cash on Delivery). Uncertified gateways (Stripe, CMI) throw validation errors upon attempted injection.
4. **Guest Purchase & Account Prohibition**: Guest checkout remains enabled while customer accounts remain permanently disabled (`customerAccounts = false`), adhering to architectural invariants.
5. **Zero Secret Leakage**: Internal backend URLs (`wooCommerceUrl`, `wordpressUrl`) and secrets are systematically scrubbed from public client profile projections.
6. **Decoupled Client Profile Seam**: Generic EcomOS commerce engine remains untouched; brand and theme selection switch cleanly via `ECOM_CLIENT_PROFILE` without requiring application code changes.

---

## 3. Verification & Checks

### A. TypeScript Typecheck
- **Command**: `npx tsc -p apps/storefront/tsconfig.json --noEmit`
- **Result**: `PASS` (0 errors)

### B. Client Profile Unit Contract Suite
- **Command**: `npx tsx --test clients/paraloca/profile.test.ts`
- **Result**: `PASS` (7 tests passed in 230ms)
  - validates strictly against ClientProfileSchema
  - enforces exact approved brand name spelling and domain
  - enforces Moroccan regional currency and locale settings
  - permits only certified payment methods and rejects uncertified gateways
  - enforces architectural invariant: customer accounts remain disabled
  - scrubs internal backend URLs and credentials from public client projection
  - rejects URLs containing embedded credentials or invalid protocol

### C. Storefront Client Profile & Theme Resolution E2E Suite
- **Command**: `npx tsx --test apps/storefront/e2e/paraloca-profile.spec.ts`
- **Result**: `PASS` (6 tests passed in 460ms)
  - resolves ParaLoca profile by default when ECOM_CLIENT_PROFILE is unset
  - guarantees French/Morocco regional rules and MAD currency
  - restricts payments to certified COD and leaves customer accounts disabled
  - safely projects public client profile scrubbing backend topology
  - resolves approved ParaLoca theme tokens from references/PARALOCA_DESIGN_REFERENCE.md
  - switches dynamically between client profiles via environment seam without engine changes
