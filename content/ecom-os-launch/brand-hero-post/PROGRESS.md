# Content Asset Progress

**Campaign:** ecom-os-launch
**Asset:** brand-hero-post
**Destination:** organic post (LinkedIn primary, Instagram cross-post)
**Format:** still image (1:1, 2K)
**Started:** 2026-07-03
**Last updated:** 2026-07-03

| Phase | Status | Files |
|-------|--------|-------|
| 1 — Strategy & Copy | ✅ Complete | 01-copy.md |
| 2 — Visual Prompt | ✅ Complete | 02-visual-prompt.md · ../02-identity-sheet.md (campaign identity lock) |
| 3 — Generation | 🔄 Plan written, awaiting approval | assets/ecom-os-launch/2026-07-03/generation-plan.html |
| 4 — Distribution Package | ⏳ Pending | |
| 5 — Wrap-up | ⏳ Pending | |

## Notes
- 2026-07-03: palette v2.0 locked in DESIGN.md (#000000 / #763B00 / #FA7400 / #FFFBFA / #FFFFFF); brand-guidelines, identity sheet, logo prompts, visual prompt, and generation plan all updated to match.
- Brand voice source: docs/brand-guidelines.md (created 2026-07-03 from pre-dev audit); styling source: DESIGN.md.
- Recommended model: Nano Banana Pro (~18 credits) for typography fidelity; FLUX.2 as cheap-iteration fallback. Model choice = user's call, pending.
- Blockers before generation: (1) KIE_API_KEY not set in .env; (2) Pinterest reference pulls blocked — Zapier auth stale, re-auth at https://mcp.zapier.com/mcp/servers/8c906218-ed28-41c9-95df-0fc770f73404/app-auth/PinterestCLIAPI (one action also returned "halted by platform" — may be admin-restricted).
- Model slug `google/nano-banana-pro` is snapshot knowledge — re-verify at docs.kie.ai/market/google before firing.
