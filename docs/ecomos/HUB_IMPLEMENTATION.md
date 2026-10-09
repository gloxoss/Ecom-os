# HUB-001 implementation evidence

## Scope and baseline

Owner requested a full project agent hub and business logic guidance modeled on the IMC and SchoolOS examples. Baseline: `6541de1d6b11991f048144a8b4f6ec0f89ea25ed`, branch `fix/ecomos-phase-0`. The hub implements engineering coordination, not WooCommerce commercial authority or every future product feature. Existing dirty `plugins/wordpress-mcp` was preserved.

Three separate agents prepared domain rules, agent kits and independent verification. The parent implemented the CLI, regression tests, discovery entry points and integration. Bootstrap creation preceded self-registration; final work is assigned and claimed as HUB-001 by `codex-hub`, with `root-orchestrator` coordinating. Parent acceptance is separate from the child verifier's executed checks; role identifiers alone do not establish independence.

## Deliverables

- Zero-dependency Node CLI, configuration, append-only local journal, generated board, messages, role registration and task prompts.
- Assignment before work; case-insensitive folder/file claims, canonical junction protection, secret/protected path rejection, exclusive machine resources and explicit stale-owner recovery.
- Partial/blocked/resume, committed owned evidence, independent exact-SHA verification, orchestrator acceptance and integrated phase gates. Regression/new earlier-phase work invalidates dependent gates.
- Registered shared-tree commits can be interleaved without absorbing another task's files. Unknown commits/merges and dirty claimed files are rejected. Worktrees share the same canonical coordinator.
- 59 initial tasks: 58 ECO tasks from all ten owner phases plus this hub task. Historical repairs remain OPEN until their fresh evidence is reviewed through the hub.
- Four lane kits, independent verifier kit, orchestrator starter, report templates, canonical skill, Codex/Claude discovery wrappers and root AGENTS/CLAUDE entry points.
- Project context, business rules, domain contracts, phase roadmap and decisions covering catalog/stock/money, guest sessions, cart/totals, checkout/retries/payments, CMS/search, admin, client profiles, addons and RFQ.
- `pnpm hub`, `pnpm hub:test`; hub tests included in `pnpm verify`.

## Verification

Executed on the submitted implementation:

- `pnpm verify`: PASS, engine/addon guards, lint, all workspace type checks, 74 application tests and 15 hub tests. Lint reports 18 preexisting warnings, zero errors; Vitest reports its existing config-loader warning.
- `node --test .agent-hub/test/hub.test.mjs`: PASS, 15 tests, including real concurrent claim processes, alias/secret protection, live/dead lock recovery, corrupt journal refusal, shared commit separation and independent verification/gates.
- Nine repository hub-related skills validated using skill-creator `quick_validate.py`: PASS. All 32 tracked hub/discovery Markdown files have resolving relative links. Three additional ParaLoca-root discovery skills also validate and route to this repository; parent-folder shortcuts are outside this Git repository.
- `node .agent-hub/hub.mjs check`: PASS, no stale registrations; role prompt and 59 unique tasks across phases 0–9 confirmed.
- `git diff --cached --check`: PASS after normalizing final Markdown trailing blank lines. No secrets/runtime/submodule files staged.

Independent exact-commit verdict and separate worktree/shared-tree checks: [verification/HUB-001/verification.md](verification/HUB-001/verification.md). Its report is deliberately committed separately from the executor submission.

## Operational limits

Claims/roles coordinate cooperating local agents; they are not OS sandboxing, authenticated identities or proof that submitted command text is true. Separate executed verification remains required. The hub does not launch AI sessions, push, merge, deploy or activate unfinished application features.

Use one local machine and one canonical state directory. OneDrive sync is not distributed locking. Runtime state is gitignored and must contain no customer payloads or credentials. Locks and stale claims are never stolen based on age. Explicit unlock requires a provably terminated local process; missing/corrupt ownership and crashed recovery metadata require investigation.

Application Phase 0 remains PARTIAL; disabled checkout/accounts/payments stay disabled. Browser proof, concurrent commerce retries, remaining dependency/security evidence and other roadmap work remain separate tasks. This hub does not certify live commerce readiness.

## Rollback

Revert the hub implementation commit and its standalone verification report commit if needed. Remove hub package scripts and discovery entry points with that revert. Preserve or archive local journal state before intentionally resetting a board. No database migration, production mutation or external deployment is included.
