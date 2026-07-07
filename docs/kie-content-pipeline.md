# Kie-based content pipeline (image / video / copy / Meta ads)

Replaces a Higgsfield-MCP workflow with: Claude Code (this repo's Kie proxy hookup) + Kie's generation APIs + a set of prompt/copy skills, ending in Meta (FB/IG) publishing.

## 0. What's already wired up

- Claude Code itself is routed through Kie (`~/.claude/settings.json` → `ANTHROPIC_BASE_URL=https://api.kie.ai/claude`). That's the *chat* lane — it does not generate images/video.
- Image/video/music generation goes through Kie's separate **Market/task API** (`https://api.kie.ai`, REST, async — returns a `task_id`, poll or use a callback). Docs: https://docs.kie.ai
- Slash commands available in this session: `/architect`, `/prompt-video`, `/prompt-image`, `/prompt-consistency`.
- Skills installed for this pipeline: `ad-creative`, `ai-video-ad-pipeline`, `json-image-prompt`, `copywriting`, `seo-content-writer`, `keyword-research`, `linkedin-posts`, `content-creator`, `humanizer`, `geo-content-optimizer`, `storytelling`, `brand-guidelines`, plus the new `facebook-meta-ads` skill (campaign/ad-set/ad structure, targeting, ROAS reporting — knowledge only, no live Meta connector).

## 1. Asset generation loop (image/video)

1. **Prompt drafting** — use `/prompt-image` or `/prompt-video` (or the `json-image-prompt` skill for JSON-structured prompts). Output: master prompt, negative prompt, variants (photoreal / ad creative / editorial / stylized for images; realistic / commercial / stylized for video), plus model-risk notes.
2. **Identity lock** (recurring character/brand/product) — run `/prompt-consistency` once to produce an identity sheet + locked base prompt + 5 safe variants. Reuse that base prompt for every subsequent asset instead of re-describing the subject each time.
3–5. **Generate → validate → store** — run the `kie-asset-generate` skill with the prompt from step 1/2. It picks the right Kie endpoint for the chosen model (Nano Banana, GPT-Image, Veo3, or the generic Market `jobs` API — these are not interchangeable, each has its own path), polls until done, downloads the result and renders it inline in chat so you can actually see it before approving, checks it against the model-risk notes, and only stores the asset + exact prompt + `taskId` together (`assets/<campaign>/<date>/`) once you've approved it. See [kie-asset-generate](file:///C:/Users/oussama/.claude/skills/kie-asset-generate/SKILL.md) for the full endpoint table and poll logic.

## 2. Copy / caption / SEO loop

1. **Ad copy** — `ad-creative` skill (or `facebook-meta-ads` skill's own copy patterns) for primary text / headline / description per placement.
2. **Organic captions** — `content-creator` / `linkedin-posts` / `storytelling` for platform-native tone; run through `humanizer` if it reads too AI-flat.
3. **SEO layer** — `keyword-research` → `seo-content-writer` for any caption or landing page copy that needs to rank (product descriptions, blog posts linked from ads). `geo-content-optimizer` if location targeting matters.
4. **Brand consistency** — check against `brand-guidelines` skill before finalizing tone/voice.

## 3. Meta (Facebook/Instagram) setup and publishing

The `facebook-meta-ads` skill gives you campaign structure and optimization logic, but it assumes a Meta connector (`meta_ads_create`, `meta_pixel`, etc.) that isn't installed — there's no official Claude skill with a live Meta Graph API connector. You need to wire the actual publishing yourself:

1. **One-time account setup** (must be done by you, not automatable):
   - Create a Meta app at developers.facebook.com, add Marketing API + Instagram Graph API products.
   - Get a long-lived Page access token + ad account ID.
2. **Campaign hierarchy** (from the skill): Campaign (objective) → Ad Set (audience + budget + placement) → Ad (creative + copy). Build this structure in the plan before generating assets, so every asset request already knows its placement/aspect ratio (Feed 1:1 or 4:5, Stories/Reels 9:16).
3. **Publishing/scheduling** — call the Marketing API (`POST /act_<ad_account_id>/campaigns`, `.../adsets`, `.../ads`) directly, or use a scheduler (Meta's native Business Suite scheduler, or an n8n workflow hitting the Graph API) if you want unattended posting. Claude Code can generate the API request bodies and n8n JSON, but actually sending requests with your access token should go through your own script/workflow, not ad-hoc chat calls with a live token pasted in.

## 4. End-to-end order of operations

```
keyword-research → seo-content-writer/ad-creative (copy)
        ↓
prompt-consistency (once per character/brand) → prompt-image/prompt-video (per asset)
        ↓
Kie generate API → poll task_id → download → validate against risk notes
        ↓
facebook-meta-ads structure (campaign/adset/ad) → Marketing API call or scheduler
```

## Gaps / what you still have to do by hand

- No skill can create the Meta app or hand you an access token — that's a one-time manual step.
- Kie's generation endpoints are async; build polling or a webhook receiver if you're automating this outside chat.
- Don't paste live API keys/tokens into chat messages going forward — put them in `.env` and reference them from scripts instead.
