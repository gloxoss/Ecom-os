# EcomOS CI Pipeline Specification

- **Document**: `CI_MATRIX.md`
- **Application**: EcomOS Continuous Integration
- **Version**: 2.0.0
- **Status**: MATCHES REALITY — this file now describes exactly what `.github/workflows/ci.yml` runs. The broader matrix in the previous revision (Node 22/24, multiple profiles, `ADDONS="rfq"`, Playwright stages) was not implemented and has been moved to section 3 as pending work. See `release/CORRECTION_2026-10-11.md` for the withdrawal record.

---

## 1. What actually runs

Workflow: `.github/workflows/ci.yml`. Triggered on push to `main` and on every pull request. **One job**, `ci`, on `ubuntu-latest`. There is no `strategy: matrix` and no parallel job fan-out.

| # | Step | Command | Notes |
| :--- | :--- | :--- | :--- |
| 1 | Toolchain | `pnpm/action-setup@v4` (11.7.0), `actions/setup-node@v4` (node 22, pnpm cache) | single Node version |
| 2 | Install | `pnpm install --frozen-lockfile` | |
| 3 | Engine-import guard | `pnpm guard` | `scripts/check-engine-imports.ts` + its node test |
| 4 | Lint | `pnpm -r lint` | |
| 5 | Typecheck | `pnpm -r typecheck` | |
| 6 | Unit tests + coverage | `pnpm test:coverage` | `vitest run --coverage` |
| 7 | Hub governance | `pnpm hub:test` | `node --test .agent-hub/test/*.test.mjs` |
| 8 | Secret scan | `gitleaks/gitleaks-action@v2` | |
| 9 | Dependency scan | `aquasecurity/trivy-action@master` | `scan-type: fs`, `severity: CRITICAL`, `exit-code: 1` |
| 10 | Storefront build | `pnpm --filter storefront build` | single build, `ADDONS=""` |

The build step sets placeholder backend values, not a live site:

```yaml
env:
  ECOM_ENGINE: woocommerce
  WC_GRAPHQL_URL: https://woocommerce.example.test/graphql
  WC_REST_URL: https://woocommerce.example.test/wp-json/wc/v3
  WC_REST_KEY: ci-placeholder
  WC_REST_SECRET: ci-placeholder
  ECOM_OS_ENCRYPTION_KEY: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
  REVALIDATE_SECRET: test-revalidate-secret-32byteslong!
  SESSION_COOKIE_SECRET: test-session-secret-32byteslong!!
  DEFAULT_LOCALE: en
  LOCALES: en,fr,ar
  ADDONS: ""
```

`ADDONS` is deliberately empty: with no addon names, `generate-addons.ts` writes an empty `registeredAddons` and the build cannot fail on a missing manifest. See `EXTENDING.md` section 3.5 for why a non-empty value would break today.

---

## 2. Coverage of the local suite (what "CI passed" does and does not mean)

- `pnpm test:coverage` uses the root `vitest.config.ts`, whose `include` is `apps/storefront/src/**/*.test.ts(x)` and `packages/*/src/**/*.test.ts`. That covers `packages/addons-rfq`, `packages/ecom-engine`, `packages/engine-woocommerce`, `packages/addons-i18n`, `packages/addons-multi-payment` and `packages/cli`.
- Coverage thresholds/collection are limited to five files (`apps/storefront/src/lib/{crypto,logger}.ts`, `apps/storefront/src/app/api/revalidate/route.ts`, `packages/addons-multi-payment/src/{hash,dedup}.ts`). A green coverage step is not whole-repo coverage.
- **`clients/paraloca/*.test.ts` (brand-schema, content-approval, profile, rfq-policy) is not collected by any configuration or job.** Neither root `vitest run` nor `pnpm verify` runs them. They are dead unless invoked explicitly.
- `scripts/generate-addons.test.mjs` uses `node:test` and is not wired into `pnpm test`, `pnpm guard` or `pnpm hub:test`. Run it manually through tsx: `node node_modules/tsx/dist/cli.mjs --test scripts/generate-addons.test.mjs` (5 pass). Plain `node --test` fails 2 of them because the file imports `addon-manifest.js` for a `.ts` module.
- No browser test runs. `pnpm e2e` (Playwright, `apps/storefront/e2e/*.spec.ts`) is **not** part of CI.
- `scripts/verify-production-runtime.mjs` exists and is invoked by no workflow.

---

## 3. Aspirational / pending (clearly labelled — not currently implemented)

The previous revision of this document presented these as enforced stages. They are not. Each would need a real workflow edit before it can be cited as CI coverage:

- A Node 22/24 browser matrix.
- Per-profile builds (`paraloca`, `default-minimal`) and per-addon builds (`ADDONS="rfq"`). Blocked on the missing addon manifests.
- Playwright e2e stage.
- `verify-production-runtime.mjs` runtime-headers stage.
- Running `clients/paraloca/*.test.ts` and `scripts/generate-addons.test.mjs`.

Until those are added to `.github/workflows/ci.yml`, "the CI matrix covers X" is false for every item in this list.
