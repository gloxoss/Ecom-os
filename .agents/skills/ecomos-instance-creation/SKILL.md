---
name: ecomos-instance-creation
description: Create a new client store instance from the EcomOS starter. Use when asked to start a new client store, create or spin up an instance, set up ParaLoca or another client, add a client environment, or clone the starter for a client. Covers the separate clone, the client's own WordPress/WooCommerce site, secrets, profile and theme. Not for updating an existing instance (use ecomos-instance-updates) or changing core code (use ecomos-upstream-first).
---

# EcomOS instance creation

EcomOS is the starter. A client store is an **instance**: a separate git clone with its own WordPress site, database, secrets, client profile and theme (ADR-003, one app per client). Never build a client inside the starter folder, and never share a database or secrets between instances.

## Hard rules

- Start and stop the client WordPress site only from the Local app. Never start MySQL, PHP or nginx by hand or with a script; it leaves an orphan that locks the database.
- Secrets live only in the instance's `apps/storefront/.env.local` (gitignored). Never print or commit them.
- Instance work stays in client-owned places: `clients/<id>/`, `packages/themes/src/clients/<id>/`, `.env.local`, content. Core changes go to the starter first (`ecomos-upstream-first`).
- Guest-first: customer accounts off, `cod` only until a gateway is certified. No production change, DNS change or live payment without explicit owner authorization.
- Never invent merchant facts, registration codes or medical claims. Leave them `UNAPPROVED` until the owner approves.

## Steps

1. **Decide names.** Client id (kebab-case), site name `<id>-store`, domain `<id>-store.local`. Use a name clearly different from any starter test site.
2. **Clone the starter** into the workspace, next to the starter:
   ```
   git clone --no-hardlinks --branch sprint-integrated-authoritative <path-to-Ecom-os> <id>-store
   cd <id>-store && git remote rename origin starter && git checkout -b <id>-instance
   ```
   Prefer a pinned release tag over the branch tip once tags exist: `git checkout -b <id>-instance vX.Y.Z`.
   Set a repo-local git identity in the new clone (`git config user.name` and `user.email`); without it merges and commits fail.
3. **Install:** `pnpm install --frozen-lockfile` (offline works with a warm store). If the shell `pnpm` is broken, see `references/instance-checklist.md`. A failing frozen install is a starter bug: fix it upstream.
4. **Create the WordPress site (human step).** Ask the owner to create it in the Local app (PHP 8.2.29, MySQL 8.4.0, nginx) and tell you when it runs. Then use WP-CLI for everything else.
5. **Configure WordPress:** install WooCommerce, WPGraphQL and the WPGraphQL for WooCommerce bridge; enable HPOS (`wp wc hpos sync`, then `wp wc hpos enable --with-sync`); set currency and country; allow guest checkout; activate the optional companion plugins only when needed (`wp-ecomos-rfq` for quotes). Back up the database before each structural change.
6. **Create a dedicated connector user** with only `read` and `manage_woocommerce` and a read-only REST key. Never use the admin login in the storefront.
7. **Write `apps/storefront/.env.local`** with fresh secrets (commands in `references/instance-checklist.md`): profile, theme, addons, WooCommerce URLs and keys.
8. **Client profile and theme.** Add `clients/<id>/profile.ts` (exactly one `export const <name>Profile`) and `packages/themes/src/clients/<id>/theme.ts` (exactly one `export const <name>Theme`), then run `node scripts/generate-clients.mjs`. Registration is automatic; do not edit `client-profile.ts` or the themes index. Select the client with `ECOM_CLIENT_PROFILE` and `THEME_NAME`.
9. **Storefront look (instance only).** Put the client header, footer, language and home page in `apps/storefront/src/client-shells/<id>.tsx` (`ClientShellOverrides`, see `docs/ecomos/EXTENDING.md` 5a). Never put client content in shared components or in the starter.
10. **Verify** (see `references/instance-checklist.md`): guard, lint, typecheck, unit tests, then the live specs against the instance's own site. Prove isolation: different database, different keys, zero catalog crossover with the starter site.
11. **Record** the instance in the starter's `docs/ecomos/PROGRESS.md` and add any problem found to `docs/ecomos/FIX_LEDGER.md`.

## What counts as done

An instance is ready for client content when: a clean `pnpm install --frozen-lockfile` passes, all checks pass, the live guest-purchase spec passes on the instance's own site, and the isolation check is recorded as PASS, FAIL, BLOCKED or NOT RUN with evidence. It is not launch-ready until merchant approvals, hosting and explicit owner authorization exist.
