# Business Case — Ecom OS

## 1. The Investment

| Item | Cost |
|---|---|
| Engineering time, v1 (WC engine, 8 weeks part-time, ~160h @ MAD 500/h opportunity cost) | **MAD 80,000** |
| Engineering time, custom Vendure engine (8 weeks part-time, ~160h @ MAD 500/h) | **MAD 80,000** |
| Hosting + tooling (Hostinger, GitHub, Vercel free tier, Claude usage) | **MAD 0–5,000** |
| Vendure commercial license (only if redistributing modified core — **not planned**) | **MAD 0** |
| **Total v1 investment (both engines)** | **~MAD 160,000–165,000** (~USD 16K) |

The cost is **opportunity cost**, not cash outflow. Oussama's time spent on Ecom OS is time not spent on direct client work. Treat it as an R&D allocation.

---

## 2. The Return

### Revenue model
Ecom OS is **not sold as a SaaS**. Revenue comes from:

- **Client e-commerce builds** at premium pricing (Tier 2–3 of QuoteForge: MAD 4,000–6,400/day).
- **Optional retainer** for hosting + maintenance + new addons per client.

### Per-client unit economics

| | Old (custom build) | New (Ecom OS) |
|---|---|---|
| Engineering hours per project | ~400h | ~120h |
| Engineering cost (MAD 500/h internal opportunity cost) | MAD 200,000 | MAD 60,000 |
| Client price (typical EPIOSO premium e-com build) | MAD 60,000–80,000 | MAD 60,000–80,000 |
| **Margin per client** | **−65% to −70% (loss)** | **+25% to +50%** |
| Time to deliver | 8–12 weeks | 2–3 weeks |

> Note on the old model: at internal opportunity cost rates, custom builds at MAD 60–80K are loss-making on time. EPIOSO has historically absorbed that as portfolio investment. Ecom OS flips the unit economics.

At enterprise pricing (MAD 150K+ per build for mid-market clients on the Vendure engine), margins reach **60–70%**.

### Capacity multiplier
- Concurrent e-commerce projects EPIOSO can carry today: **1–2.**
- Concurrent projects with Ecom OS: **5+** (target).
- Same engineer, 3–5x throughput.

---

## 3. Payback

**Break-even point: 2 client deployments using Ecom OS at premium pricing.**

| Scenario | Clients in Year 1 | Year-1 revenue | Year-1 margin | Payback |
|---|---|---|---|---|
| Pessimistic | 2 SMB @ 60K MAD | 120,000 MAD | ~30,000 MAD | ~5x investment over 18 months |
| Base | 4 SMB + 1 mid-market @ avg 80K MAD | 400,000 MAD | ~140,000 MAD | Break-even within 12 months |
| Optimistic | 6 SMB + 2 mid-market @ avg 100K MAD | 800,000 MAD | ~340,000 MAD | Break-even within 6 months |

Even the **pessimistic case recovers the investment** and leaves EPIOSO with a reusable platform asset that compounds.

---

## 4. Strategic Value (beyond direct revenue)

1. **Productized service line.** Ecom OS turns "we do e-commerce" into a packaged offering EPIOSO can pitch, demo, and price predictably.
2. **Agency partner moat.** White-label agency partners (Marc persona) want vendors with reusable infrastructure. Ecom OS qualifies EPIOSO for partnerships that custom-each-time agencies cannot win.
3. **Mid-market upgrade path.** A Yasmine-size SMB on the WC engine can later be migrated to the Vendure engine without changing agency or losing the storefront UX. EPIOSO captures the customer for the long term.
4. **Optional v2 SaaS-ification.** After 5–10 successful deployments, the same codebase becomes a credible hosted product (Ecom OS Cloud) sold to other small agencies — a real second revenue line. Not a v1 goal, but the investment unlocks it.
5. **Portfolio credibility.** A platform that powers multiple live stores is stronger evidence than five disconnected one-off builds.

---

## 5. Risks & Mitigations (business-level)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| EPIOSO can't close a paying client in Year 1 | Low–Medium | High (no payback) | Pre-sell to one existing EPIOSO contact before custom-engine work starts; soft-launch with WC engine after week 8 |
| Build slips past 16 weeks part-time | Medium | Medium | Strict v1 scope discipline (charter Section 5); defer multi-branch routing to v1.1 already enforced |
| Vendure licensing surprise | Low | High | Plugin-only architecture sidesteps GPLv3 entirely — see competitive analysis Section 1 and architecture ADRs (Phase 3) |
| A regional competitor productizes the same wedge first | Medium | Medium | Ship and deploy publicly within 4 months; first credible case study locks the position |
| EPIOSO client load spikes and stalls Ecom OS work | High (already part-time) | Medium | Treat Ecom OS as compounding-leverage R&D; protect 1 day/week minimum |

---

## 6. Go / No-Go Recommendation

**Recommendation: GO.**

- Investment is bounded (~MAD 160K opportunity cost).
- Payback is recoverable from 2 paying clients — well within Year 1 in any realistic scenario.
- Strategic upside (productized service line, agency partnerships, optional v2 SaaS) is large and asymmetric.
- The competitive window is open *now* and won't stay clean for more than ~12–18 months.
- The technical foundation (Vendure plugin exception, Next.js 16 maturity, MENA payment infrastructure) is uniquely favorable in 2026.

**Decision gate at end of v1 WooCommerce engine (week 8):** If no paying client signed or no credible warm pipeline, pause custom Vendure engine work and reassess. Don't sink the second MAD 80K until the first engine has earned at least one deployment.
