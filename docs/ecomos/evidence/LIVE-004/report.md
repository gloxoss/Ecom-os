# Item 4 Live Catalog Scale and Discovery Evidence Report

- **Date:** 2026-10-13
- **Agent:** agent-4 (executor/commerce)
- **Status:** PASS
- **Target Backend:** `https://paraloca.local` (Local app, site "paraloca", MySQL port 10005, seeded catalog >= 100 products)
- **Storefront Runtime:** `http://localhost:3000` (Next.js 16.3.8 production mode, `ADDONS=quotes`)
- **Test Runners:**
  1. Playwright Chromium Discovery Suite (`apps/storefront/e2e/sprint-b-discovery.spec.ts`) - 5/5 PASS (12.8s)
  2. Scale Traversal & Latency Benchmark (`scratch/benchmark-catalog-scale.mjs`) - 100 queries evaluated

## Verified Acceptance Criteria

1. **Synthetic Catalog Seeding (>= 100 products):**
   - Seeded 100 mixed synthetic products (80 simple products, 20 variable products with variations across sizes/colors) across 10 distinct medical/ecommerce categories via WP-CLI / `wp eval-file`.
   - Total catalog size on staging verified at 103 items (3 previous live test fixtures + 100 synthetic products).
   - Categories include: `Mobilier Medical`, `Diagnostic & Mesure`, `Consommables Steriles`, `Chirurgie & Instruments`, `Equipement Urgence`, `Hygiene & Desinfection`, `Orthopedie & Maintien`, `Perfusion & Injection`, `Protection Individuelle`, `Eclairage & Examen`.

2. **Full Catalog Traversal & Non-Repeating Paging:**
   - Traversed entire catalog via WooCommerce Store API:
     - Page 1 (`per_page=100`): 100 items returned.
     - Page 2 (`per_page=100`): 3 items returned.
     - Total traversed: 103 items.
     - Intersection between pages: exactly 0 duplicate IDs.
   - Real-browser catalog page (`/catalog`) renders product cards without repetition.

3. **Search Autocomplete & Honesty Invariants:**
   - Real-browser Playwright test verified the `SearchAutocomplete` search input in the header.
   - Querying `'Lit'` displays the autocomplete dropdown listbox (`role="listbox"`) with real matching catalog items within timeout.
   - Keyboard interaction verified: pressing `ArrowDown` activates item selection (`aria-selected="true"`).
   - Honest search behavior: For queries with zero matching products, the autocomplete does not invent or display fake demo items.

4. **Accent-Insensitive Search Graceful Degradation:**
   - Evaluated lookup for accented and unaccented terms:
     - Query `tensiometre` returned 10 items.
     - Query `Tensiomètre` returned identical 10 items.
   - In absence of external Elasticsearch/Algolia cluster, WooCommerce SQL `LIKE %term%` handles accent normalization gracefully without throwing 500 errors.

5. **Search Latency Performance Measurements:**
   - Executed 100 search queries across 50 distinct realistic terms:
     - **Minimum Latency:** 165.96 ms
     - **Mean Latency:** 542.01 ms
     - **Median (p50):** 601.65 ms
     - **p90 Latency:** 864.29 ms
     - **p95 Latency:** 998.67 ms
   - Store API search endpoint remained under 1.0s at p95 across the full 100+ product synthetic catalog on local staging.

6. **Responsive / Mobile Catalog Usability:**
   - Playwright tested catalog view under mobile viewport (390x844).
   - Category filters, product grid cards, and navigation stay accessible and operable without layout breakage.
