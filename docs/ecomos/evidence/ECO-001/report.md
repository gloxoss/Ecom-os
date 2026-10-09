# ECO-001: baseline inspection and verification matrix report

## Identity and scope

- Executor: `tooling-cleanup`, platform lane.
- Assignment base: `b61fcbac0c584b78a93b70e3b43be94d92a5645a`.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Scope: `docs/ecomos/PHASE_0_REPORT.md`, `docs/ecomos/PROGRESS.md`, `docs/ecomos/evidence/ECO-001`.
- Resources: `git-index`.
- Date: 2026-10-09.

## Verification matrix

| Command | Target | Result | Scope / Evidence |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | Workspace | PASS (exit 0) | Deterministic dependency tree, Node 24.19.0, pnpm 11.7.0 |
| `pnpm guard` | Workspace | PASS (exit 0) | 13/13 AST engine import and addon export regressions |
| `pnpm -r --if-present lint` | Storefront | PASS (exit 0) | ESLint check across all packages; 0 errors, 18 warnings |
| `pnpm -r --if-present typecheck` | Workspace | PASS (exit 0) | `tsc --noEmit` across all 11 workspace packages |
| `pnpm test` | Workspace | PASS (exit 0) | 112 tests across 15 files via Vitest |
| `pnpm hub:test` | Hub | PASS (exit 0) | 15 agent-hub concurrency, state, and governance tests |
| `pnpm run build` | Workspace | PASS (exit 0) | CLI tsup build and Next.js 16.3.8 storefront Turbopack production build (28 dynamic routes) |
| Staging preflight | `https://paraloca.local` | PASS (exit 0) | WP 7.1.3, PHP 8.2.29, WC 11.2.1, Store API 200, GraphQL 200 |
| Backend smoke | `scripts/smoke-local-woocommerce.ts` | PASS (exit 0) | Order #15 generated with exact variation and shipping (202.84 MAD) |
| Production runtime | `scripts/verify-production-runtime.mjs` | PASS (exit 0) | CSP nonces, account route containment, private revalidate headers, fail-closed config |
