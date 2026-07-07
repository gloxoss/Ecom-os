# Section 04 — `create-ecom-os` CLI Scaffold

> **Batch 3 · Risk: green · Deps: 01, 03 · Tasks: 4 · Blueprint: Step 7**

## Why this section exists
FR-080..082: `npx create-ecom-os <name> --engine=woocommerce|vendure` scaffolds a deployment that runs `pnpm install && pnpm dev` cold, in < 5 minutes (FR-081). This is the commercial lever — it's what turns an 8-week engagement into a 2-week one (charter KPI).

## Requirements covered
- **FR-080** `npx create-ecom-os <name> --engine=...` scaffolds a runnable deployment
- **FR-081** first-run to working dev < 5 min on a standard machine
- **FR-082** one-command deploy target `pnpm deploy:hostinger`

## Tasks
1. **Template skeleton** `templates/deployment/` — a minimal but complete Ecom OS deployment: `package.json`, `pnpm-workspace.yaml`, `.env.example` (full, from Cahier §5), `apps/storefront/` with a default `brand.config.ts`, README. This is what gets copied.
2. **CLI script** `scripts/create-ecom-os.ts` — interactive + flag-driven: prompts for name + engine, copies `templates/deployment/`, substitutes name/brand placeholders, writes `.env` from `.env.example`. Exposes `bin` in root `package.json` (`create-ecom-os`).
3. **Engine wiring in template** — the scaffolded `lib/engine.ts` reads `ECOM_ENGINE`; default to `woocommerce` for v1. Confirm `pnpm dev` boots with the placeholder brand + the noop/empty addons state.
4. **Cold-start verification** — `npx create-ecom-os test-client --engine=woocommerce && cd test-client && pnpm install && pnpm dev` succeeds with no errors; measure < 5 min. Add a `pnpm deploy:hostinger` script stub (full impl in Section 10).

## Inputs
- Sections 01 (engine wiring) + 03 (addon loader) — template must include both

## Outputs
- `templates/deployment/` (full skeleton)
- `scripts/create-ecom-os.ts`
- `package.json` `bin` entry
- `scripts/deploy-hostinger.ts` (stub; completed in Section 10)

## Acceptance Criteria
- [ ] `npx create-ecom-os test-client --engine=woocommerce` produces a dir that `pnpm install && pnpm dev` runs cleanly
- [ ] End-to-end scaffold → dev server < 5 min on a standard machine
- [ ] Scaffolded `.env.example` matches Cahier §5 exactly (every required var listed)
- [ ] Scaffolded app renders `/` with the placeholder brand

## Skills to load
`blueprint` (step execution), `devops-cicd` (CLI/packaging)

## Risks / notes
- `npx create-ecom-os` needs publishing (or `npm link` for dev). For v1 internal use, `npm link` is fine; npm publish is a post-v1 packaging task.
- The template is a **downstream clone**, not the monorepo itself — keep it minimal so upstream rebases stay clean (architecture §5).
