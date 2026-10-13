# Item 8 Second Isolated Client Evidence Report

- **Date:** 2026-10-13
- **Agent:** agent-4 (executor/commerce)
- **Status:** BLOCKED
- **Command / Probe Executed:**
  - Inspected Local app configuration at `AppData/Roaming/Local/sites.json`.
  - Probed available local WordPress hostnames and ports.
- **Evidence / Findings:**
  - Local `sites.json` contains exactly one configured site: `"paraloca"` (`https://paraloca.local`, MySQL port 10005, site path `Local Sites/paraloca`).
  - No second Local site exists on this machine.
  - In strict compliance with task instructions: *"Second isolated client: only if the owner creates a second Local site with its own DB and secrets. Otherwise record BLOCKED with the exact need. Do not simulate it."*
- **Exact Human Owner Action Required:**
  1. Open Local (by Flywheel) desktop application.
  2. Create a new site named `ecomos-client2` (e.g., domain `ecomos-client2.local`).
  3. Start the site to allocate a separate local MySQL port, distinct database, and unique table prefix.
  4. Install WooCommerce with distinct currency (e.g. EUR), distinct table schemas/HPOS configuration, separate WooCommerce REST API keys, and independent WordPress secret keys/salts.
  5. Provide credentials in an ignored configuration file for multi-client boundary verification.
