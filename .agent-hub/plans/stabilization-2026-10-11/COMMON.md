# Rules shared by all four startup prompts

Canonical repository and hub: `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/Ecom-os`.

## Read before editing

Read the repository AGENTS.md and nested rules, the parent 00_START_HERE.md, 01_MASTER_AGENT_PROMPT.md, 02_PHASED_EXECUTION_PLAN.md, 03_TARGET_ARCHITECTURE_AND_ADDONS.md and 04_REPORTING_AND_ACCEPTANCE.md. Load the maintained .agent-hub/skills/ecomos-agent-hub/SKILL.md, PROTOCOL.md, shared PROJECT_CONTEXT/BUSINESS_RULES/CONTRACTS/ROADMAP/DECISIONS and your role kit.

Read this pack's PLAN.md and manifest.json. The latest owner directive narrows immediate implementation to Sprint A. Original product requirements still apply to final completion. Historical statements about plugins, build success or phase acceptance need current proof.

## Activation

Start Agent 4 first. It reconciles existing agents, dirty files and claimed resources; no force release just because an agent is stale. Do not preregister absent future workers. At most four actual sessions, three executors plus the coordinator/verifier. Stop overlapping edits until the holder explicitly hands off.

Read-only inspection/design may proceed while waiting. Join as an executor only when the coordinator confirms capacity and a task worktree. Do not start a task merely because its ID appears in the manifest. Its dependencies and handoffs must be accepted, it must be assigned to you, and you must claim before editing.

In each isolated task worktree:

```powershell
$env:ECOM_HUB_ROOT = 'C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/Ecom-os'
$hubCli = Join-Path $env:ECOM_HUB_ROOT '.agent-hub/hub.mjs'
node $hubCli help
node $hubCli check
node $hubCli status
node $hubCli inbox --agent YOUR_ID
node $hubCli next
git rev-parse HEAD
git status --porcelain=v1
```

Record actual base SHA/worktree/branch, do not assume the planning snapshot. Request assignment from sprint-lead-1, never self-assign. Claim only the exact assignment paths. Claim relevant resources before using them, then remove resources after operations end. Heartbeat every 20 minutes. Stale after 45 minutes does not release claims.

## Ownership and operations

Three implementers own disjoint scopes. Checkout.ts is shared by two Agent 1 tasks, so finish one before the next claim. RFQ's two tasks are also sequential. Agent 3 owns compatibility and recovery; edits to RFQ plugin code remain Agent 2's work. Agent 4 changes only governance/verification evidence unless a separately assigned executor and distinct verifier are arranged.

Common engine types/index, lockfile/workspace config, fixture seeds, generated files and Playwright config need explicit one-owner coordination. Get additional paths assigned/claimed before touching them. A proposed manifest directory may be new, it is not permission to deploy it.

Reserve git-index for staging, commit and local integration; workspace-install/build, storefront-dev, php-staging and browser for relevant operations. Staging fixtures are synthetic and owned. Shared local Woo/browser tests serialize, even when source worktrees are separate. Never kill a service owned by another agent or reuse an unknown port/process.

Preserve plugins/wordpress-mcp and all preexisting dirty files. No git reset/clean/force push or history rewriting to hide submission problems. For legacy grouped commits, record real provenance and coordinate evidence/submissions; do not pretend they were your independent implementation.

## Business and safety

Woo is authoritative for products, variations, prices, stock, currency, taxes, shipping, orders and payment state. Guest commerce/RFQ needs no customer account. Accounts, uncertified Stripe/CMI stay disabled. RFQ is optional and separate from the cart; branding stays in client profiles. Staff actions need real authentication plus capabilities.

Do not display success after unconfirmed/failed persistence. Private orders/quotes/documents require ownership; backend credentials never substitute for guest proof.

No broad UI redesign, new addons, production services/deployment, paid purchases, DNS, live payments, extra deployed plugins or messages to real recipients. Use a local notification sink. Implement durability within existing approved backend boundaries; coordinate any shared module/schema ownership explicitly.

No destructive database operations are authorized here, including destructive restore cleanup. Do not import untrusted SQL into a service that can access a real source. Use fresh isolated synthetic environments and restricted credentials; obtain explicit approval for a concrete DROP/truncate/overwrite/migration before execution. Never publish secrets, cart tokens, signed links, customer payloads or dumps.

## Submission and next phase

Use docs/ecomos/evidence/TASK_ID/report.md. Include exact base/final SHA and changed files; executed commands and exit codes; condition-level PASS/FAIL/BLOCKED/NOT RUN; redacted browser/API/SQL evidence; migration and rollback implications.

```powershell
node $hubCli done TASK_ID --agent YOUR_ID --commit EXACT_SHA --evidence docs/ecomos/evidence/TASK_ID/report.md --summary 'Observed result' --checks 'Exact command -> exit/result'
```

Do not claim independent self-verification. Await Agent 4's independent exact-SHA review and acceptance. A fix requires a new SHA/review. Do not switch to later tasks without a new assignment. After Sprint A acceptance, prepare Sprint B assignments and browser matrix; this plan does not authorize skipping the gate or production launch.

Keep owner updates short: result, actual proof, blocker and next step. Report failures plainly.

