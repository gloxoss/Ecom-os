# ParaLoca instance plan

**Status:** proposal for owner review, 2026-10-13. Nothing here has been executed.
**Sources read:** `00-PRODUCT-VISION-AND-SCOPE.md`, ADR-003 (one app per client), `docs/ecomos/INSTALL.md`, `EXTENDING.md` section 5, `operations/PROVISION.md`, `clients/paraloca/README.md`, `release/CORRECTION_2026-10-11.md`.

## Model

EcomOS is the agency-owned starter. ParaLoca is one client instance made from it. Per ADR-003 an instance is a separate deployment: its own Next.js app, its own WordPress, its own database, its own secrets. EcomOS is not a multi-tenant platform, and the starter repo keeps its default theme (`THEME_NAME=angelina`, Beano Coffee demo).

Today `clients/paraloca` and `clients/demo-2` live inside the starter as profiles. `PROVISION.md` confirms there is no working `provision` command, so the steps below are manual until one is built.

## Decisions needed from the owner

1. **Repo model.** Recommended: keep `Ecom-os` as the template and make ParaLoca a separate clone (ADR-003), pulling starter updates deliberately. Alternative: keep it as a profile inside `Ecom-os` (current state, less isolation).
2. **Names.** The current Local site called `paraloca` holds the starter's test data. Give the instance a clearly different site name, for example `paraloca-store` (`paraloca-store.local`), so the two are never mixed up.
3. **Hosting for paraloca.ma.** Nothing in the repo configures DNS, TLS, Redis or a host. `release/PARALOCA_CUTOVER.md` is a plan only.

## Steps

1. **Starter ready.** Re-run the guest checkout and RFQ specs on HPOS and finish the application rollback rehearsal (both still open). Commit the fixture-finder fix in `sprint-b-commerce.spec.ts` once it passes.
2. **Create the instance site.** New Local site; WordPress, WooCommerce, WPGraphQL and the eCommerce bridge; HPOS on; MAD, Morocco, French; guest checkout; COD only. Activate `wp-ecomos-rfq` (and the addons/operations plugins when their acceptance checks pass). No test fixtures.
3. **Own credentials.** A dedicated read-only connector user and key, plus fresh `REVALIDATE_SECRET`, `SESSION_COOKIE_SECRET`, `ECOM_OS_ENCRYPTION_KEY` (commands in `INSTALL.md` 2.2). Secrets only in the instance's ignored `.env.local`.
4. **Instance config.** `ECOM_CLIENT_PROFILE=paraloca`, `THEME_NAME=paraloca`, `ADDONS=quotes` (RFQ stays a discreet secondary option), accounts off, `cod` only.
5. **Content and catalog.** Owner-supplied products and owned brands. Merchant facts and medical claims stay placeholders until approved. No invented registration codes or clinical claims (Law 84-12).
6. **Acceptance on the instance.** Run the same live specs: guest purchase, RFQ end to end, RFQ off, security headers. Add an isolation check proving a different database, different keys and zero catalog crossover from the starter. This closes LIVE-008.
7. **Design pass.** Check the ParaLoca theme against `clients/paraloca/DESIGN.md`: French, mobile first, accessibility.

## Blocked on the owner

- The 8 merchant approvals in `clients/paraloca/content-approval.md` (all `UNAPPROVED`), the merchant facts, and product claim sources.
- Real product data, shipping zones, tax settings, delivery partners.
- A hosting decision and explicit launch authorization. Building the instance does not require these; launching does.

## Not in scope

Online payment gateways (CMI, Stripe) stay off until certified. Customer accounts stay off. No production change, DNS change or live payment without explicit authorization.
