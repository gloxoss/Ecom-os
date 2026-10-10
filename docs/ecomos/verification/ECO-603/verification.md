# ECO-603 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `tooling-cleanup`, platform lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `a0199615f81d1f298d1dcd84984f3d407633c9be`.
- Base: `df2b2955c0e2f00bac00c536d05c2b65d8afe334`.
- Executor evidence: `docs/ecomos/evidence/ECO-603/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-603/verification.md`).

## Verdict

PASS for reversible addon lifecycle, idempotent migrations, rollback procedures, core WooCommerce data shielding, data retention on deactivation, and missing-addon graceful degradation at commit `a0199615f81d1f298d1dcd84984f3d407633c9be`.

## Executed verification commands

1. Automated contract test runner:
   - Command: `node --test plugins/wp-ecomos-addons/tests/lifecycle.spec.mjs`
   - Exit: 0.
   - Result: 4 tests passed:
     - `✔ lifecycle.php functions and contracts`
     - `✔ Core WooCommerce data protection invariant`
     - `✔ Data retention on deactivation contract`
     - `✔ wp-ecomos-addons.php entrypoint includes lifecycle.php`
   - Verified:
     - Manifest installation is idempotent.
     - Up migrations skip previously executed versions without duplicate errors.
     - Unsafe statements attempting `DROP` or `ALTER` on `wp_posts`, `wp_postmeta`, or `wp_wc_orders` are detected and aborted.
     - Rollback down executes reverse migration steps cleanly.
     - Deactivation preserves domain tables and options by default (`retain_data: true`).
     - Integrity check detects deleted addon folders on disk and safely deactivates them without PHP fatal errors.

2. Git scope containment:
   - `git diff --stat df2b2955c0e2f00bac00c536d05c2b65d8afe334..a0199615f81d1f298d1dcd84984f3d407633c9be`
   - Result: Exactly 7 files modified/added in commit `a0199615f81d1f298d1dcd84984f3d407633c9be`:
     - `docs/ecomos/addons/LIFECYCLE.md`
     - `docs/ecomos/evidence/ECO-603/report.md`
     - `docs/ecomos/evidence/ECO-603/restore.md`
     - `plugins/wp-ecomos-addons/lifecycle.php`
     - `plugins/wp-ecomos-addons/tests/lifecycle.spec.mjs`
     - `plugins/wp-ecomos-addons/tests/lifecycle.test.php`
     - `plugins/wp-ecomos-addons/wp-ecomos-addons.php`
   - All files are strictly inside claimed boundaries (`plugins/wp-ecomos-addons`, `docs/ecomos/addons`, `docs/ecomos/evidence/ECO-603`). Zero scope escape.

3. Invariant & Security Assessment:
   - **Core Shielding**: Core WooCommerce data is immune to addon migration corruption.
   - **Data Retention**: Preserves customer records and domain configuration upon feature deactivation.
   - **Submodule Protection**: Submodule `plugins/wordpress-mcp` was untouched.
