# UltraPlan Section Index

> v1 scope = WooCommerce engine + i18n + multi-payment addons (Sprint A–C).
> Each section links to a task file with FR mapping, inputs/outputs, acceptance criteria, files, and skills.

## Execution Order

| Batch | § | Section | Risk | Deps | Tasks | File |
|-------|---|---------|------|------|-------|------|
| 1 | 01 | Engine Interface hardening | yellow | — | 5 | [01-engine-interface.md](./01-engine-interface.md) |
| 2 | 02 | Brand config & theme tokens | green | 01 | 4 | [02-brand-config.md](./02-brand-config.md) |
| 2 | 03 | Addon loader + flag generation | green | — | 4 | [03-addon-loader.md](./03-addon-loader.md) |
| 3 | 04 | `create-ecom-os` CLI scaffold | green | 01,03 | 4 | [04-cli-scaffold.md](./04-cli-scaffold.md) |
| 4 | 05 | Storefront Home · Catalog · PDP | yellow | 01,02 | 5 | [05-home-catalog-pdp.md](./05-home-catalog-pdp.md) |
| 5 | 06 | Cart · Checkout · COD | red | 05 | 5 | [06-cart-checkout-cod.md](./06-cart-checkout-cod.md) |
| 5 | 07 | Account & Auth | yellow | 01 | 4 | [07-account-auth.md](./07-account-auth.md) |
| 6 | 08 | i18n addon + RTL | yellow | 03,05 | 5 | [08-i18n-rtl.md](./08-i18n-rtl.md) |
| 6 | 09 | Multi-payment addon (CMI/Stripe/COD) | red | 03,06 | 6 | [09-multi-payment.md](./09-multi-payment.md) |
| 6 | 10 | Security · Tests · Deploy · Co-hosting | green | all | 6 | [10-security-test-deploy.md](./10-security-test-deploy.md) |
| 7 | 12 | Pilot client — Angelina Paris Casablanca | yellow | 01,02,05,06,10 | 4 | [12-pilot-angelina.md](./12-pilot-angelina.md) |

## Summary
- Total sections: **10**
- Total tasks: **48** (each documented in its section file)
- Parallel batches: **6** (Batches 2, 5, 6 have ≥2 parallel sections)
- Risk breakdown: **2 red**, **5 yellow**, **3 green**
- Critical path: 01 → 03 → 05 → 06 → 09 → 10

## Dependency Graph
```
Batch 1: [01]
Batch 2: [02] [03]
Batch 3: [04]
Batch 4: [05]
Batch 5: [06] [07]
Batch 6: [08] [09]
         ↓
        [10]
```

## How to Execute
1. Start with Batch 1 (Section 01 — harden the engine interface first; everything depends on it).
2. Sections within a batch can run in parallel.
3. After each section, verify its acceptance criteria before moving on.
4. **Gate A** sits after Section 08 (pilot-client check).
5. After Section 10, the WC-engine v1 is deployable. Sprint D (Vendure) is a separate track — see `pre-dev/07-blueprint.md §Steps 23–28`.

## What's NOT here (explicitly deferred)
- **Sprint D — Vendure engine** (Steps 23–28): server scaffold, `VendureEngine` adapter, Vendure i18n + payment plugins, Vendure deploy. Tracked in `pre-dev/07-blueprint.md`. Gate B decides if/when to start it.
- **v1.1 features**: multi-branch routing, PayPal, shipping calculator, abandoned-cart — out of scope.
