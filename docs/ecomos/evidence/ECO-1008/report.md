# ECO-1008 — Make install and extension docs executable as written

**Commit:** `cd7ab4b` · **Audit finding:** 11

## Defects reproduced

- `EXTENDING.md` documented `addon.json`; the generator reads `manifest.json`.
- Its example omitted the required `ecomOsApiRange` and used an array for
  `dependencies`, where the schema requires a `Record<addonId, semverRange>`.
- `INSTALL.md` omitted the real engine/WooCommerce/revalidation configuration and the
  GraphQL setup, and referenced a `SEARCH_PROVIDER` switch that exists nowhere in the
  source.
- The provisioning runbook advertised a command that does not exist.
- The written CI matrix was broader than the single job in `.github/workflows/ci.yml`.

## Repairs

- `EXTENDING.md`: `manifest.json`, a valid example with `ecomOsApiRange` and the
  correct `dependencies` object shape, the full optional field set, real resolution
  (`packages/addons-<name>` -> `@ecom-os/addons-<name>`, or a package declaring
  `ecom-os.flag` equal to the name, else `plugins/<name>`), the real `ADDONS` ->
  `validateAllAddons` -> `addons.generated.ts` -> `initAddons` flow, and the
  `register`/`disable` entry-module contract.
- `INSTALL.md`: the real env file (`apps/storefront/.env.local`) with the keys the
  runtime actually validates, the WPGraphQL and WPGraphQL-for-WooCommerce setup, the
  encryption key, the CA certificate timing, and the revalidation endpoint contract.
  The fabricated `SEARCH_PROVIDER` section is removed.
- `COMPATIBILITY.md`, `STAGING_SETUP.md`: declared vs executed vs unverified split;
  the snapshot test counts marked as snapshots.
- `operations/PROVISION.md`: states plainly that the command does not exist.
- `operations/RESTORE.md`: marks the integrity script as a simulator (since replaced
  — ECO-1007).
- `release/CI_MATRIX.md`: describes exactly the single CI job that runs, with the
  broader matrix moved to a clearly-labelled pending section.

## Verification

| Check | Result |
| --- | --- |
| `ADDONS="i18n,multi-payment,quotes" tsx scripts/generate-addons.ts` | exit 0 — 3 validated addons (ran again after the flag-resolution fix) |
| `ADDONS=bogus tsx scripts/generate-addons.ts` | exit 1 with a helpful error |
| Manifest sweep — every shipped addon has `manifest.json` | yes (i18n, multi-payment, RFQ, dummy-addon) |
| `.github/workflows/ci.yml` cross-checked against `CI_MATRIX.md` | matches |

## Not proven

**No clean-checkout install was executed following only the guide.** The docs were
aligned to source and to the actual CI workflow; a reader-follows-the-guide run is
still outstanding. Instructions that remain impossible (a runnable provisioning
command; HPOS declarations, since repaired in ECO-1011) are labelled as such in the
docs rather than written as though they work.
