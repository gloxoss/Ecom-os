# ECO-1502 — translatable search box

- **Agent:** agent-1 (executor/experience), lane design
- **Base commit:** `a2bde7e106ef292dfa3c326572dba59f91e4e32c` (`sprint-integrated-authoritative`)
- **Worktree / branch:** `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/ecomos-agent1-theming` on `agent1/theming-source`
- **Submitter's own commit SHA:** recorded in the hub submission for ECO-1502

## What was wrong

`apps/storefront/src/components/search/search-autocomplete.tsx` held its entire user-visible vocabulary as English literals: the submit button `Search`, `Products` / `Categories` / `Brands` group headings, `Searching…`, `Recent Searches`, `Clear all`, `Popular Searches`, `Retry`, `Try again`, `No matches for …`, `See all N results for …`, the offline and rate-limited sentences, and the `aria-label`s `Search suggestions`, `Search the catalog`, `Clear search`, `Open search`, `Close search` and `Remove recent search …`.

Switching the storefront to French left the whole control in English. The catalogue already had an unused `search.button` key, so the wiring existed and the component simply did not use it.

## What changed

- `packages/addons-i18n/locales/{en,fr,ar}.json` — 23 new keys under `search`; the namespace goes from 5 keys to 28, with identical key sets across the three locales and no empty values (verified programmatically).
- `apps/storefront/src/components/search/search-autocomplete.tsx` — `useTranslations("search")` in both the list component and the field component. `placeholder` and `inputLabel` stay optional props and fall back to `search.defaultPlaceholder` / `search.inputLabel`, so `SearchBar`'s existing `placeholder={t('placeholder')}` call site keeps working unchanged.
- `apps/storefront/src/components/search/search-autocomplete.test.tsx` — now renders inside `NextIntlClientProvider` using the real catalogue files, and asserts translatability directly.

No client copy was introduced: the strings are generic catalogue entries, and the component holds none of them.

## Proof

The component is proven translatable by rendering it twice with different catalogues and asserting the output moves — the same component, no prop changes:

```
renderSearch("en", enMessages) -> ">Search<", "Search products, categories, brands", "Search the catalog"
renderSearch("fr", frMessages) -> ">Rechercher<", "Rechercher des produits, catégories, marques",
                                  "Rechercher dans le catalogue", "Ouvrir la recherche"
                               -> and does NOT contain ">Search<"
```

A third test proves the escape hatch still works: an explicit `placeholder` and `inputLabel` override the catalogue.

Tests are at `apps/storefront/src/components/search/search-autocomplete.test.tsx`, describe block "search box is translatable (ECO-1502)".

## Commands run, with results

| Command | Result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run apps/storefront/src/components/search` | **47/47 passed**, 6 files |
| `node node_modules/vitest/vitest.mjs run` (full) | **617/617 passed**, 69 files |
| `tsc --noEmit -p apps/storefront/tsconfig.json` | **0 errors**, exit 0 |
| `eslint .` (storefront) | **0 errors**, 35 pre-existing warnings |
| `next build --webpack` | **exit 0**, "Compiled successfully", 45/45 static pages |

The full-suite run, the build and the lint were executed with both changes in the tree, so the ECO-1501 and ECO-1502 evidence describe the same tree. Raw transcripts are not committed because `.gitignore` line 20 ignores `*.log` repo-wide; each command above reproduces its own result in one line.

## What was NOT run, and known limits

- **No browser check of the French control.** Proving the locale switch on screen needs the ParaLoca staging instance, which is a different tree and is reserved. The proof here is the rendered server output under two catalogues, which is the same mechanism the page uses.
- **Arabic copy is not reviewed by a native speaker.** `ar.json` already existed and was extended to keep key parity; the Arabic strings are my own rendering and should be reviewed before the locale is enabled for a client.
- **`search.button` already existed** and was unused. It is now used, which is not a change in meaning but is worth knowing for anyone diffing the catalogue.

## Risks and rollback

- Risk: a locale file with fewer keys would fall back to the key name. All three locales were checked for identical key sets.
- Rollback: revert the commit; the component returns to its English literals.

## Adjacent finding, not fixed here

`apps/storefront/src/app/[locale]/(shop)/search/page.tsx` builds its metadata title as the literal `'Search - Angelina Paris'` — both untranslatable and a starter file naming a demo client. It sits outside this task's claimed scope, so it is reported rather than changed. Suggested fix: `generateMetadata` should read the client name from the resolved brand configuration and the title from the catalogue.
