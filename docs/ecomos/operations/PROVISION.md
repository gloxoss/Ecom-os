# EcomOS Client Environment Provisioning

- **Document**: `PROVISION.md`
- **Application**: EcomOS Client Onboarding
- **Version**: 1.1.0
- **Status**: NOT IMPLEMENTED — the provisioning command described by earlier revisions of this runbook does not exist as a runnable command. What exists is a validation helper and its tests. Details below. See `release/CORRECTION_2026-10-11.md` for the withdrawal record.

---

## 1. The advertised command does not exist

An earlier revision of this runbook instructed:

```bash
pnpm --filter @ecom-os/cli provision <client-id>     # DOES NOT WORK
```

That command cannot run, for two independent reasons verified in source:

1. `packages/cli/src/index.ts` registers only `themeCommand` and `cmsCommand`. `provisionCommand` (defined in `packages/cli/src/commands/provision.ts:50`) is never added to the program.
2. `packages/cli/package.json` declares no `provision` script (only `build`, `dev`, `start`), so `pnpm --filter @ecom-os/cli provision` has nothing to invoke.

Do not follow instructions that call this command. Provisioning is **not** implemented as an operator-facing CLI today.

---

## 2. What actually exists

`packages/cli/src/commands/provision.ts` contains two things that do work in isolation:

- `validateProvisioning(config)` — a pure, fail-closed validator.
- `provisionCommand` — a Commander command object, currently unrouted.

`packages/cli/src/commands/provision.test.ts` covers the validator with two cases (a compliant config and a config that must fail on every field). Those tests **do** run under the root suite: root `package.json` runs `vitest run`, and `vitest.config.ts` includes `packages/*/src/**/*.test.ts`, which matches this file. So:

```bash
pnpm test          # includes packages/cli/src/commands/provision.test.ts
```

### Validation contract

`validateProvisioning` reads a `.env.<client-id>` file and requires:

| Field | Rule |
| :--- | :--- |
| client id | `^[a-z0-9-]+$` |
| `DATABASE_URL` | must start with `mysql://` |
| `STOREFRONT_URL` | must start with `https://` |
| `ECOM_OS_ENCRYPTION_KEY` | base64 that decodes to exactly 32 bytes |
| `SESSION_COOKIE_SECRET` | at least 32 characters |
| `ALLOWED_PAYMENT_METHODS` | comma-separated, must include `cod` |

---

## 3. This contract does not match the storefront runtime

The validator's model (a per-client `DATABASE_URL` + `STOREFRONT_URL`) is not how the application is configured. The real storefront reads `apps/storefront/.env.local` and has no `DATABASE_URL` concept at all; it reaches WooCommerce over REST/GraphQL using `ECOM_ENGINE`, `WC_REST_URL`, `WC_GRAPHQL_URL`, `WC_REST_KEY`, `WC_REST_SECRET`, `REVALIDATE_SECRET`, `SESSION_COOKIE_SECRET`, `ECOM_OS_ENCRYPTION_KEY` (see `apps/storefront/src/lib/runtime-config.ts` and `INSTALL.md` section 2.2).

Treat the provisioning validator as an unfinished design, not as the supported onboarding path.

---

## 4. What to do instead today

Client separation that is actually implemented:

1. **Client profile**: add `clients/<client-id>/profile.ts` and register it in `apps/storefront/src/lib/client-profile.ts`. Select it with `ECOM_CLIENT_PROFILE` (built-in keys: `paraloca`, `demo-2`; default `paraloca`).
2. **Environment**: give each deployment its own `apps/storefront/.env.local` with the required keys and its own generated secrets. See `INSTALL.md` section 2.2.
3. **Validation**: rely on `validateRuntimeConfig` (production fail-fast on the storefront env) rather than the provisioning validator.

If a real `provision` command is wanted, it needs: registration in `packages/cli/src/index.ts`, a `provision` script (or `bin` invocation) in `packages/cli/package.json`, and reconciliation of the `DATABASE_URL`/`STOREFRONT_URL` contract with the actual `ECOM_ENGINE`/`WC_*` runtime environment. That work is not part of this document revision.
