# ECO-003: disabled customer identity boundary verification

## Identity

- Executor: `identity-cleanup`, commerce lane, assigned by `lead-cleanup`.
- Assignment base: `c54df872401c23093e840eff910995fa1cb3ecd4`.
- Implementation SHA: the exact owned test/evidence commit is recorded by the hub `done` submission. This report is included in that commit; inspect its Git history or the submission for the immutable SHA.
- Branch/worktree: `fix/ecomos-phase-0`, shared `Ecom-os` workspace.
- Claimed scope: Woo `auth.ts`, `orders.ts`, existing `__tests__/containment.test.ts`; storefront `lib/disabled-features.ts`, account/auth server folders and account UI; `docs/ecomos/evidence/ECO-003`. Only the two containment test files and this report changed.
- Resource: `git-index` acquired only for scoped staging/commit, then released. No install/build/staging/browser resource used.
- Evidence date: 2026-10-09, owner client date. Existing local Node/pnpm workspace, Vitest 4.1.11. All inputs are synthetic.

## Result

The prior containment remains safe in the inspected identity paths. No exposed bypass was found and no working containment or UI was rewritten. This slice adds missing direct-call negative regressions rather than implementing authentication.

The existing Woo helper resolves every untrusted token to `null`; customer/address/order/reset helpers reject before privileged requests. Woo engine wrappers preserve those boundaries. Direct storefront account actions reject before cookie reads, engine resolution, network calls or a success redirect. Profile/address actions remain disabled through `getSessionToken`, independently of account-page visibility.

## Changed files and acceptance coverage

`packages/engine-woocommerce/src/__tests__/containment.test.ts` now checks:

- Forged, expired, unsigned, wrong-issuer, malformed and empty tokens through both the direct helper and `WooCommerceEngine.getCustomer`; identity is absent and `fetch` is never called.
- Direct helper and engine login/registration, order enumeration, address listing/create/update/delete, reset request/reset. Engine loyalty read/redemption also reject before network calls.
- Direct legacy order reads with attacker-selected order/customer IDs expose no records.
- Legacy checkout and payment mutations remain rejected. Existing safe behavior is retained.
- Synthetic `CUSTOMER_ACCOUNTS_ENABLED=true` and `ADDONS=customer-accounts` do not reenable these paths. These are hostile legacy configuration values, not supported feature switches.

`apps/storefront/src/features/account/server/containment.test.ts` directly invokes session/login/register/reset/address/profile actions and legacy auth-cookie setter/reader with forged identity/contact fields. Every forbidden call rejects before cookies, engine, network or success redirect. Permitted logout/cookie cleanup only deletes `ecom_auth`, never reads identity or contacts the engine; logout then redirects home.

These tests matter because hiding a page does not itself prevent calling an exported server action. Cookie and engine mocks are observation boundaries; they do not simulate a successful WooCommerce login. Synthetic JWT values are never decoded for authorization. Test names describe token classes without printing their payloads.

## Executed checks

- PASS, exit 0: `pnpm exec vitest run packages/engine-woocommerce/src/__tests__/containment.test.ts apps/storefront/src/features/account/server/containment.test.ts`. 41 tests in two files passed. Vitest emitted a nonfatal future Vite native-config warning for the current CommonJS config-loading mode.
- PASS, exit 0: `pnpm --filter @ecom-os/engine-woocommerce typecheck`.
- PASS, exit 0: `pnpm --filter storefront typecheck`.
- PASS, exit 0: `pnpm --filter storefront exec eslint src/features/account/server/containment.test.ts`; no warnings or errors. The Woo package has no separate lint script; its changed TypeScript test is covered by the package type check and executed suite.
- PASS, exit 0: `git diff --check` at the checked working tree, with existing Windows line-ending conversion warnings only.

An initial `pnpm exec eslint ...` invocation from the repository root failed because ESLint is installed in the storefront package, not exposed as a root executable. No lint pass is inferred from that failure. The package-local command is `pnpm --filter storefront exec eslint src/features/account/server/containment.test.ts`.

## Business integrity and limits

Guest buying remains independent of accounts. This change does not alter money, inventory, cart/order authority, shipping, taxes, themes or addon activation. It adds no customer identity or new privileged API. Disabled online payments and storefront checkout remain unavailable.

NOT RUN for this slice: browser/server-action HTTP transport, deployed PHP/staff capability integration, live Woo REST denial tests, real customer data, production build, checkout/retry/provider tests. Root-owned proxy/layout tests and runtime CSP checks are separate work. Mock-observed zero network calls prove these tested code boundaries, not a browser/server deployment or future authentication addon.

Account mock UI components remain dormant behind the existing denied account routes/layout; removing or redesigning them was outside this security slice. Confirmed safe code was preserved. Full Phase 0 remains PARTIAL until independent gates are accepted; this report does not certify the entire application.

## Staging, compatibility and rollback

No WordPress/plugin/database/env/customer mutations and no added dependencies. Exported signatures and UI remain unchanged. Rollback is a scoped revert of this test/evidence commit. No data restore is needed or claimed tested. The preexisting dirty WordPress MCP submodule and other agents' disjoint changes were preserved.

## Verification handoff

An independent verifier should inspect the exact hub-submitted commit, rerun the two focused suites and package type checks, and confirm only claimed paths changed. Fresh verification is required because implementation checks ran in the cooperating shared workspace. Hub REVIEW is not self-verification or acceptance. No production/push/deployment permission follows this submission.
