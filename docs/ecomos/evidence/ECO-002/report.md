# ECO-002 reproducible tooling checkpoint

## Identity and result

- Executor: tooling-cleanup, platform lane.
- Assignment base: c54df872401c23093e840eff910995fa1cb3ecd4.
- Shared implementation tree: Ecom-os, branch fix/ecomos-phase-0.
- Independent executor reproduction directory: C:/dev/ecomos-eco002-20261009.
- This report is committed with the implementation. The exact submitted SHA is recorded by hub done; independent verification remains required.
- Date: 2026-10-09.

PASS for clean tracked-source install, guard, lint, type checking, application tests, hub tests and production build. This is an executor proof, not independent acceptance or a Phase 0 pass.

## Concrete repairs

CI previously used a separate grep guard, omitted hub tests and needed a repository encryption secret for a synthetic build. CI now calls the canonical guard and its regression suite, executes hub tests, and uses a public synthetic 32-byte key. No real credential is required for build proof.

The canonical guard previously missed double-quoted/multiline imports, reexports, dynamic literal imports and require/import-equals references. It also silently passed a missing source directory or addon entrypoint. AST inspection now catches those static module references, exempts only the exact canonical engine factory path, and requires register/disable runtime exports. Type-only exports no longer count.

The shell wrapper delegates to the same guard. Root scripts use installed tsx directly rather than npx fetching a missing tool. TypeScript 5.9.3 is a declared root dev dependency instead of importing another application's node_modules. That version was already in the workspace; this change makes the script's dependency explicit. Existing Apache-2.0 tooling license, no paid integration or global install.

Changed files: package.json, pnpm-lock.yaml, .github/workflows/ci.yml, scripts/check-engine-imports.ts, scripts/check-engine-imports.sh, scripts/check-engine-imports.test.mjs and this evidence directory. No workspace/.npmrc/generator source change was necessary.

## Clean-source reproduction

A new empty directory outside OneDrive received git archive of the exact assignment base. Only the six scoped tooling implementation files were overlaid from the working tree. No ignored .env.local, node_modules, .next output or dirty submodule content was copied. pnpm installed from the tracked lockfile with --frozen-lockfile.

Commands executed there:

- pnpm install --frozen-lockfile: PASS. Node 24.19.0, pnpm 11.7.0; new local dependency installation.
- pnpm run verify: PASS. Includes canonical guard + 13 regressions, lint (18 warnings, zero errors), workspace type checks, 74 application tests in 14 files, and 15 hub tests.
- pnpm run build: PASS. Root CLI and production storefront build.
- pnpm guard: PASS again after the test cleanup safety check was added; 13 regressions.
- pnpm install --frozen-lockfile in the shared implementation tree: PASS, linking the explicit root TypeScript dependency.

Production build used only synthetic ECOM_ENGINE=woocommerce, HTTPS woocommerce.example.test REST/GraphQL URLs, placeholder REST values, all-zero synthetic base64 32-byte encryption key, and long synthetic revalidation/session secrets. It did not read a local staging secret or prove live backend retrieval.

Command logs: install.txt, verify.txt, build.txt and guard.txt. Trailing whitespace and line endings are normalized for Git; outputs/results are unchanged. Guard fixtures test real CLI exit behavior for alternate import forms, nested engine-factory naming, ordinary contract/comment references, runtime/type-only addon exports and missing paths. Temporary fixture deletion checks the exact temp parent and generated prefix before removing it.

The full checks and build overlapped in the isolated reproduction directory after lint began; all exited successfully. No shared application .next directory was modified. The production build and proof reflect the assignment base plus tooling edits, not later concurrent CSP/application changes; those changes need their own current checks.

## Advisory investigation and limits

Current pnpm audit still reports zero critical and one high development advisory, GHSA-vfj7-8cjw-p6xm, through eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces 3.0.3. dependency-audit.json contains the current metadata.

The npm registry currently reports latest braces 3.0.3 (braces-registry.json). Audit metadata suggests >=3.0.4, but the [primary GitHub advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) states no patched version, consistent with the [registry](https://registry.npmjs.org/braces). No nonexistent override was added; this remains an explicit unresolved security gate, not a repaired advisory.

The guard examines statically identifiable module references; it is an architecture check, not a sandbox for computed module strings or arbitrary runtime execution. CI YAML was updated but GitHub-hosted Linux jobs, gitleaks and Trivy actions were not executed here. Node 22 CI behavior was not separately reproduced; this checkpoint used installed Node 24. Existing lint warnings and the Vite future-native-loader warning remain.

No real WordPress/order mutation, browser smoke, account/checkout enablement, production operation, push or deployment occurred. WooCommerce remains authoritative; this tooling slice changes no commerce business behavior. The dirty plugins/wordpress-mcp submodule and local secrets were preserved.

## Rollback and next action

Revert this scoped tooling commit to restore previous scripts/CI/dependency declarations, then frozen-install the prior lockfile. No database rollback is involved.

Next: distinct verifier checks the submitted exact SHA using this clean-source procedure. Phase 0 remains partial until other security/runtime/integration gates pass.
