# ASTRYX — Positioning Roadmap v1
## From ground floor to main attraction: the Calibration Standard for the agent era

**Owner/architect:** Sha Blyss (MahMah Tea) · **Developer/partner:** Claude · **Written:** 2026-09-09
**Status:** ACTIVE — the running head for Astryx strategy + build from here forward.
**Companion docs:** `APP_BRIEFING_ASTRYX.md` (what exists) · `ASTRYX_CALIBRATION_STANDARD_v0.md` (the published method — Phase 1 deliverable) · `COMPLIANCE.md` (the constitution) · `HANDOFF_v4.4.md`

---

## 0. THE THESIS (read this first, and re-read it when a shiny thing appears)

**Vendors sell calls. Standards get built on.**

Being on the ground floor of the agent economy means Astryx is a service a machine *can* call. Being the **main attraction** — the reason anyone enters the building — means Astryx is the thing other people's services *depend on*: the canonical source, the load-bearing wall. Cousto's octave isn't *an* option for planetary Hz, it *is* the reference. Placidus isn't *a* house system, it's the default. Nobody comparison-shops the canonical source. They go there because that's where the answer lives.

So the goal is **not** "an astrology API." The goal is **the Calibration Standard** — the reference layer that turns sky data into something a body can *do.* We own the verb. When an agent needs to *calibrate* a chart, there is one place it goes.

**The window.** Tropical Uranus re-entered Gemini April 2026 and holds to ~2032–33; sidereal (Lahiri) Uranus sits in Taurus to ~2031. Communication *and* value are being reinvented at once — x402 (HTTP + payment) is that overlap made concrete. Every prior Uranus-in-Gemini transit birthed a communication era and handed it to whoever built early (1941–49 computing · 1858–65 telegraph/rail · 1775–82 print/revolution). We are ~5 months in. **The builders early in the transit own it.** This roadmap is sequenced against that window.

---

## 1. THE THREE DOORS (the mental model for every decision)

| Door | What it is | Its job |
|---|---|---|
| **The showroom** | myastryx.com — the human app | Where people fall in love with it. Generates the *outcome data* and the *testimony.* |
| **The wholesale dock** | The API / MCP server — machine-payable | Where agents buy it at scale, without SHA in the room. |
| **The blueprint on the wall** | The published Calibration Standard | Why the other two are *the* answer, not *an* answer. |

They feed each other: showroom → data that makes the dock valuable → ubiquity that makes the blueprint the default → traffic back to the showroom, because that's where the real thing (and the forks) live. **The main attraction has all three.**

---

## 2. THE SIX LEVERS (what turns a service into the standard)

1. **Own the language.** *Carrier planet · never-amplify · the 6-sense plan · the auric Field · the ladder · Cool/Warm/Hot · Planet ≠ Remedy.* A vocabulary becomes a standard when it's how *others* talk about the thing. Publish it. Make it citeable.
2. **Be the dependency.** Ship Astryx as an **MCP server** + REST + Bazaar listing. "Add the Astryx tool" is the modern "install the plugin." A capability agents *have*, not a site they visit.
3. **The outcomes flywheel (the real moat).** Every session logs a *before* and *after* energy rating. Over thousands of sessions: **chart signature × protocol × felt response** — a dataset no one else can build without real humans, real sessions, real forks. Rules today; rules *tuned by what actually shifted people* tomorrow. Every activated user is a data contributor.
4. **The physical lock.** No software rival can ship a metal fork. The forks make Astryx the *only* meaning-layer tethered to a physical instrument. Every fork in the world is a node that calls home.
5. **The practitioner network (B2B2C).** Each practitioner = a channel + an outcome source + a paying node whose tools call Astryx for every client. Fifty practitioners is a network; a network is a hub.
6. **Recurring demand is built into the sky.** The calibration changes daily because the sky does — humans *and* agents must come back. Widen the catalog on the same engine (synastry, timing, rectification, served audio) → more transactions per caller with no new engine.

---

## 3. THE PHASED PLAN (sequenced against the transit)

### PHASE 0 — FOUNDATION · "Be loved first" · now → end of 2026
*The unglamorous layer that fuels everything. The API amplifies a product people already love; it cannot substitute for one.*

| # | Deliverable | Why it matters to the standard |
|---|---|---|
| 0.1 | **Activate every fork buyer already earned** — Shopify access email + `myastryx.com/guide` + the packaging QR; recover the ~5 stranded buyers. | Each one is a data contributor and a voice. The moat starts here. |
| 0.2 | **Outcome capture as a first-class dataset** — make before/after energy ratings, protocol used, and chart signature a clean, queryable table (not just a session blob). Add an optional 1-tap "how did it land" on the summary screen. | This IS the flywheel. Design the schema now so every session from today counts. (RLS on, compliance-safe framing: "recalibration response.") |
| 0.3 | **The toll booth** — Cloudflare pay-per-crawl / Monetization Gateway on the Sacred Vault archive. | Stops free training-data harvesting; starts the **priced-access record** for the IP (matters the day a model is caught having eaten the method). A setting, not a build. |
| 0.4 | **Daily retention loop tightened** — transit/daily-calibration reminders (push/email), "your calibration changed today." | Recurring demand is the business model; make the habit real for humans first. |
| 0.5 | **Health + usage routine** (DONE 2026-09-09) — Vercel + Supabase + site-fetch daily report. | The instrument panel for everything below. |

**Acceptance:** ≥ 80% of fork buyers activated · outcome table live and populating · pay-per-crawl on · a real weekly-active number we can watch.

**0.2 — build spec (scoped 2026-09-09).** Today `POST /api/sessions` persists only `kind / completedPhases / startedAt / completedAt` (fired at completion from `page.tsx`), while the real outcome data — `energyBefore`, `energyRating` (after), `forkSequence`, carrier planet/state, intention — is assembled in `PostSessionSummary.tsx` and saved **only to the browser** (`addSessionLog` → zustand). The flywheel needs it in the DB:
- **Schema:** extend `ChamberSession` (RLS already on; columns, not a new table) with `energyBefore Int?`, `energyAfter Int?`, `carrierPlanet String?`, `signalState String?` (excess/deficiency/blocked/balanced), `forkSequence Json?` (string[]), `intention String?`, `chartHash String?` (ties to the Reading's determinism hash), `standardVersion String?`, `outcomeAt DateTime?`.
- **Two-step write:** (1) at completion the existing POST also sends `energyBefore, carrierPlanet, signalState, forkSequence, chartHash, standardVersion` (all known from the snapshot) and the client **keeps the returned `id`** on the pending snapshot; (2) at the post-session check-in, `PATCH /api/sessions/:id` writes `energyAfter` + `outcomeAt` (+ felt-state answers if kept). Abandoned sessions keep step 1 only. Guests stay local-only as today.
- **Compliance:** subjective 1–10 felt state only ("recalibration response"); no clinical fields. Note: since 2026-08-14 a `BuyerLead` model + welcome-email-on-purchase already exist, so 0.1 activation is partly automated — verify the send-once stamps are firing.

### PHASE 1 — THE STANDARD + THE DOOR · "Be the dependency" · Q4 2026 → Q1 2027
*Cheap, early, and the same work as the biggest security fix. This is the ground-floor claim.*

| # | Deliverable | Notes |
|---|---|---|
| 1.1 | **Publish the Astryx Calibration Standard** — `ASTRYX_CALIBRATION_STANDARD_v0.md` → a public page `myastryx.com/standard`. | The method, the rules (never-amplify, Earth bookends, the ladder, the 6 senses), the *existence* of the mappings, the sources (Cousto, classical). **Not the tables.** Sell the output, never the dataset. |
| 1.2 | **Engine server-side in a Cloudflare Worker** — port the deterministic core (chart → signal → composition → 6-sense protocol) + data to a Worker. | **Closes Security FIX 1** (engine + ~45 data files currently ship to the browser). The app can consume the same Worker later. Determinism invariant holds (date is an explicit input; no `Math.random`/`Date.now` in the engine). |
| 1.3 | **The x402 door** — `x402-hono` middleware on three endpoints: `/v1/calibrate` (~$0.05), `/v1/fork-map` (~$0.02), `/v1/sky-today` (~$0.01). | USDC on Base via the protocol's own facilitator. Prices are starting points; tune to demand. |
| 1.4 | **The MCP server** — the same capabilities as `paidTool`s so any agent framework adds "the Astryx tool" in one line. | This is the "be the dependency" move. Higher leverage than REST. |
| 1.5 | **Bazaar listing** (Coinbase's permissionless discovery index) under Data, with a clear machine-readable description. | The esoteric/wellness-interpretation lane is **empty**. First in = default answer. |
| 1.6 | **Machine-output guardrails** — every response carries the reference-not-medical framing; rate limits per wallet; return *interpreted results per input*, never raw mapping tables; phrasing variation on interpretive text. | The API is a door, not a photocopier. |

**Owner-side prerequisites (SHA):** a **receiving wallet address** for USDC on Base (a public address — never a key — set as a Worker env var) · a free **Coinbase Developer Platform** account for the x402 facilitator (this *is* the rail, not an outside service).
**Acceptance:** Standard page live · Worker serves identical output to the app (golden-test parity) · a real agent pays and receives a calibration end-to-end · listed in the Bazaar · zero raw tables exposed.

### PHASE 2 — CATALOG + NETWORK · "Be the hub" · 2027
| # | Deliverable |
|---|---|
| 2.1 | **New SKUs on the same engine:** synastry (two charts — agent-native for matching), **electional timing** ("when should I…" — the North Node timing layer), **birth-time rectification** (method exists), **served audio per call** (the R2 music layer as a product). |
| 2.2 | **Practitioner Portal launch** — the $39/mo tier: clinical view, client roster, session notes, PDF. Each practitioner = channel + data + paying node. |
| 2.3 | **Practitioner API access** — a practitioner's own tools/agents call Astryx for every client (their key, their wallet). B2B2C at machine speed. |
| 2.4 | **Outcomes flywheel v1** — calibration weights informed by aggregated response data (still deterministic: a versioned, published weight table; same input + same version = same output). |
| 2.5 | **The premium call** — the North Node / YBR read as a high-value endpoint (~$0.15–0.50). The thing that cannot be scraped into existence. |

**Acceptance:** ≥ 5 SKUs live · first practitioners paying and calling · flywheel v1 shipped as a versioned table · machine revenue is a line, however small.

### PHASE 3 — THE AGENT · "Be consulted" · 2028–2029
- **Astryx as an agent** other agents consult and pay (she already sets up sessions; now she answers other machines). Akasha as a second front.
- **Data-licensing groundwork** — the toll booth + the API + the outcomes corpus form a documented, priced, structured interpretation asset. This is the macro rail: a real licensing conversation with a lab, on SHA's terms, with a paper trail.
- The outcomes moat compounding; native mobile if the showroom demands it.

### PHASE 4 — THE STANDARD ERA · "Be the answer" · 2030–2033
- Category ownership: "calibrate" means Astryx. Licensing revenue. The back half of the transit — harvest what the front half built.

---

## 4. THE MARKETING LANE (this is the lane we just found)

**The positioning line:** *Astryx is the Calibration Standard — the reference layer that turns your birth chart into a physical, sound-led practice, the same result every time, built to be used by people and by the machines that serve them.*

**The story (three beats):**
1. **Physical + digital.** Real planetary tuning forks, and the intelligence that tells you which one, where, and when — for *your* chart, *today.*
2. **Deterministic, sourced, honest.** Same birth data → same output. Cousto's octave, classical sources, no hallucinated frequencies. In a world of AI-astrology slop, Astryx never guesses. (This is a *trust* claim and a compliance-safe one.)
3. **Built for the era.** The first calibration layer machines can consult and pay for. Not a prediction app — infrastructure.

**Audiences, in order of the flywheel:** fork buyers (activate) → sound/wellness practitioners (network) → developers & agent-builders (the dock + MCP) → AI labs (licensing). Each audience is the previous one's proof.

**Channels & content:** the Standard itself is the flagship content asset (a spec is a marketing document in a developer era) · the fork-buyer story (before/after, in their words — non-medical) · "how the Standard works" explainers (never-amplify, the ladder, the Field) · a developer page on myastryx.com (`/standard`, `/api`) · the Bazaar listing · practitioner case studies once Phase 2 lands. Hand the Chief of Staff `APP_BRIEFING_ASTRYX.md` + this doc; §0 of the briefing (compliance) governs every word.

**What we never say:** anything medical, "cures/treats/heals," guaranteed outcomes, token/crypto-investment framing. **What we never do:** tokens, "x402 partnerships," crypto on the human store (Shopify only — SHA's ruling stands).

---

## 5. GUARDRAILS (non-negotiable across every phase)

- **Compliance first** — reference/observational, probabilistic framing, disclaimer on every human *and machine* output. `COMPLIANCE.md` is the constitution.
- **Determinism is sacred** — no `Math.random`/`Date.now` in the engine; date is an explicit input; golden tests stay green; the Worker must match the app byte-for-byte on the same input + version.
- **Sell the output, never the dataset** — no raw planet→Hz→fork→botanical tables over any API; rate-limit per wallet; interpreted results per input only.
- **IP containment** — Cousto Hz, the Lotus Spectrum, the mappings, the composition rules: server-side only once 1.2 lands. The toll booth protects the archive.
- **Human payments = Shopify, only.** x402 is a *separate machine channel.* It never touches the tea, the forks, or the Vault.
- **No tokens. Ever.** Take the rail; ignore everything orbiting it.
- **Astryx is the guide, not a sense.** The sixth sense is the human's auric Field. (Ruling 2026-07-20.)

---

## 6. METRICS — the instrument panel per phase

| Phase | The numbers that mean it's working |
|---|---|
| 0 | fork-buyer activation % · weekly-active users · sessions completed/week · outcome rows/week |
| 1 | Standard page views · Worker↔app parity (golden) · paid API calls/day · distinct paying wallets · Bazaar listing live |
| 2 | SKUs live · practitioners paying · calls per practitioner · flywheel version shipped · machine revenue/mo |
| 3–4 | agent-to-agent calls · licensing conversations → contracts · category share of "calibration" queries |

The daily health routine already reports Phase 0's numbers; extend it as each phase lands.

---

## 7. EXECUTION ORDER — what starts today

1. **Draft the Calibration Standard (1.1)** — pure method knowledge, the cheapest highest-leverage artifact, and the foundation the API *and* the marketing both cite. → `ASTRYX_CALIBRATION_STANDARD_v0.md` (SHA reviews voice + what's revealed).
2. **Design the outcome-capture schema (0.2)** — so every session from now on feeds the moat.
3. **Scope the Worker port (1.2)** — inventory the deterministic core and its data deps; confirm it runs in Workers (astronomy-engine + pure TS).
4. **Then the door (1.3–1.5)** — once SHA supplies the receiving wallet address + CDP account.
5. In parallel, **activation (0.1)** and **the toll booth (0.3)** — SHA-side switches.

*Proprietary system architecture — Astryx / Cosmic Resonance System · House of MahMah Tea LLC. Lives inside the project repo only. Not for external distribution.*
