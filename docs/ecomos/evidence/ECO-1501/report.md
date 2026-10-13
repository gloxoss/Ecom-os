# ECO-1501 — one theming source (ledger item 18)

- **Agent:** agent-1 (executor/experience), lane design
- **Base commit:** `a2bde7e106ef292dfa3c326572dba59f91e4e32c` (`sprint-integrated-authoritative`)
- **Worktree / branch:** `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/ecomos-agent1-theming` on `agent1/theming-source`
- **Submitter's own commit SHA:** recorded in the hub submission for ECO-1501

## What was wrong

Two generators wrote two stylesheets from two different sources:

- `scripts/generate-tokens.ts` read `apps/storefront/brand.config.ts` and wrote `brand.tokens.css`, which is the only stylesheet that feeds Tailwind's `@theme`.
- `apps/storefront/scripts/generate-theme.ts` read the theme registry (`THEME_NAME`) and wrote `theme-vars.css`, whose `--primary`, `--background` and 17 other HSL variables no Tailwind class ever referenced.

Measured, not assumed: the production CSS emitted for the storefront defines exactly these colour tokens — `--color-accent`, `--color-background`, `--color-foreground`, `--color-muted`, `--color-primary`, `--color-secondary` — and grep for `var(--primary)` in the built CSS returns nothing. So the theme's variables were dead and a client had to set its colours twice.

## What changed

| File | Change |
| --- | --- |
| `scripts/brand-styles.ts` | **New.** One resolution, two outputs. |
| `scripts/generate-tokens.ts` | Entry point now calls the shared writer. |
| `apps/storefront/scripts/generate-theme.ts` | Same entry point, same writer, resolved from `__dirname` instead of `process.cwd()`. |
| `packages/brand-config/src/tokens.ts` | `generateTokensCSS(BrandConfig)` replaced by `generateBrandCss(ResolvedBrandConfiguration)`, which returns both stylesheets. |
| `packages/brand-config/src/precedence.ts` | `hexToHsl` keeps 4 decimals instead of rounding to whole numbers; resolver gained `popover`, `popoverForeground` and `input` so the emitted palette matches what the theme registry defines. |
| `packages/brand-config/src/__tests__/theming-source.test.ts` | **New.** 4 tests. |
| `apps/storefront/src/styles/*.css` | Regenerated. |

The Tailwind tokens now point at the theme variables (`--brand-primary: hsl(var(--primary))`), so one setting in `brand.config.ts` reaches both systems.

## Proof that the starter's Angelina look is unchanged

`hexToHsl` used to round: `#aa631a` became `30 73% 38%`, which renders `#a8611a`. That is a real drift, and it is why the conversion is now unrounded. Round trip, computed from the generated `theme-vars.css` and compared against `brand.config.ts`:

```
primary      #aa631a -> hsl(30.4167 73.4694% 38.4314%) -> #aa631a   exact
secondary    #c69951 -> hsl(36.9231 50.6494% 54.7059%) -> #c69951   exact
accent       #ffcebf -> hsl(14.0625 100% 87.451%)      -> #ffcebf   exact
background   #ffffff -> hsl(0 0% 100%)                 -> #ffffff   exact
foreground   #3f100a -> hsl(6.7925 72.6027% 14.3137%)  -> #3f100a   exact
muted        #d9a594 -> hsl(14.7826 47.5862% 71.5686%) -> #d9a594   exact
```

The generated diff against HEAD is confined to those six values, a comment, and `--radius` (`1rem` -> `16px`, same length at a 16px root, and no file reads `--radius`). `@theme` itself is byte-identical, so no Tailwind utility changes definition. Full diff: `generated-stylesheets.diff`.

## Commands run, with results

| Command | Result |
| --- | --- |
| `corepack pnpm install --offline` (worktree) | exit 0, 477 packages, 15.6s |
| `node node_modules/vitest/vitest.mjs run` | **617/617 passed**, 69 files, exit 0 |
| `tsc --noEmit -p apps/storefront/tsconfig.json` | **0 errors**, exit 0 |
| `tsc --noEmit -p packages/brand-config/tsconfig.json` | **0 errors**, exit 0 |
| `next build --webpack` | **exit 0**, "Compiled successfully in 4.7s", 45/45 static pages |
| `eslint .` (storefront) | **0 errors**, 35 pre-existing warnings |
| `tsx scripts/check-engine-imports.ts` | clean, exit 0 |
| `node scripts/generate-clients.mjs --check` | "Client registries are up to date", exit 0 |
| `node --test scripts/check-engine-imports.test.mjs scripts/generate-clients.test.mjs` | 21/21 pass |
| `node --test .agent-hub/test/*.test.mjs` | 16/16 pass |

All of the above was run in this worktree on the committed tree. The raw transcripts (`gates.log`, `next-build.log`, `eslint.log`) are deliberately NOT committed: `.gitignore` line 20 ignores `*.log` repo-wide, and every one of these commands is one shell line away from being reproduced. The results recorded above are the tail of each run.

## What was NOT run, and known limits

- **No browser or screenshot check.** The starter storefront is not connected to a live Woo backend in this worktree, so a rendered before/after comparison was not possible. The no-visual-change claim rests on the colour round trip and on the diff being confined to those six declarations, not on a screenshot. A verifier with the staging site reserved should confirm on screen if it wants pixel evidence.
- **`--radius: 1rem` -> `16px`** is a value change in the generated file, argued non-visual above rather than measured.
- **Build warning, pre-existing:** `Failed to enumerate products for sitemap ... https://paraloca.local/...` — the build has no live backend; unrelated to this change and present before it.
- **`apps/storefront/.env.local`** was copied from the main tree to run the build, was never printed, and is gitignored.
- **Worktree setup note for the verifier:** to run anything here before the install, I temporarily junctioned `node_modules` into this worktree; those junctions are removed and the real offline install replaced them. The `Ecom-os` tree was not modified.

## Risks and rollback

- Risk: the resolver now emits `popover`, `popoverForeground` and `input` that the profile schema cannot set — they always come from the theme. Recorded in the migration note.
- Risk: any instance that generated tokens with the old `generateTokensCSS` signature would fail to compile. Nothing outside this repo consumes it; verified by grep across `apps`, `packages` and `scripts`.
- Rollback: revert the commit. Both stylesheets and both entry points return to their committed state.

## Not done here, recorded as an owner decision

13 of the theme's 19 colour tokens still reach no Tailwind utility, so `border-border` (42 usages), `bg-input`, `text-destructive`, `ring-ring` and `bg-card` generate no CSS. Wiring them up would change the Angelina rendering, which this task forbids. Detail and the recommendation: `docs/ecomos/release-notes/pending/ECO-1501.md`, ledger row 21.
