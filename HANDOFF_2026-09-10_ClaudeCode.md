# ASTRYX — Claude Code Handoff · 2026-09-10
### For the next Claude Code session. Read this first, then CLAUDE.md.

> **Order of work per SHA (09-10): (1) Marma × fork placements, (2) complete the practitioner side.** No Cowork handoff.
> Repo: `MARKETING/astryx_v14` · GitHub `shabless1/astryx` main · prod = Vercel `astryx` → **myastryx.com** · HEAD at handoff: `c4ee64c` (everything below is committed, pushed, and live).
> SHA is the architect; you are the developer. Never ask her to code. Decide, document, ship, let her be the eyes.

---

## 0. Read order (15 minutes)
1. `CLAUDE.md` (build manifest; carries the **voice ruling** and the **12-fork ruling**).
2. This file.
3. `ASTRYX_POSITIONING_ROADMAP_v1.md` (the lane: be the Calibration Standard for the agent era; 0.2 + 1.1 done).
4. `PRACTITIONER_PORTAL_PLAN_v1.md` (practitioner side: audited, never completed, 6 owner decisions pending).
5. `PHASE1_WORKER_PORT_SCOPE.md` (the Cloudflare Worker port = Roadmap 1.2, next big build).
6. `ASTRYX_CALIBRATION_STANDARD_v0.md` (live at myastryx.com/standard; the voice reference; §4.2 = the Clairs).
7. Memory index (`~/.claude/projects/.../memory/MEMORY.md`) — especially `astryx-voice-positioning`, `astryx-calibration-standard-program`, `astryx-practitioner-portal`, `astryx-deploy-path`, `astryx-hydration-race-trap`, `astryx-security-posture`.

## 1. State at handoff
- **Tree clean, all gates green:** `tsc --noEmit` 0 · vitest 64 pass / 1 skip · `lint:determinism` 0 · `lint:copy` ✓ · `build:local` ✓. Prod deploy `astryx-fh0wn5ic1`+ (multiple today), all Ready; `/`, `/guide`, `/standard` 200; gated API routes 401 when signed out.
- **Verify cold:** `git status` (must be empty) → `rm -f tsconfig.tsbuildinfo && npx tsc --noEmit` → `npx vitest run` → `npm run -s build:local`.
- **Deploy:** `npx vercel --prod --yes` from `astryx_v14` (CLI is authed; it uploads the WORKING TREE, so commit first). Then `npx vercel inspect <url> --wait`. Vercel build runs `prisma migrate deploy` — migrations land on Supabase `gbalyncthcaxbzuwlbqo` during the build. Every new table: `ENABLE ROW LEVEL SECURITY`.

## 2. What shipped this session (2026-09-09 → 10)
| Commit | What |
|---|---|
| 1e68aa9 | Tiered sacred-layer containment at `/api/protocol` (`src/lib/sacredShape.ts`, basic vs practitioner) + solar-chart threading fix |
| 5f306fd | tsconfig target es5 → ES2017 (tsc green; delete `tsconfig.tsbuildinfo` after any tsconfig change) |
| 235de6c | **Roadmap 0.2 outcome capture**: `ChamberSession` columns (energyBefore/After, carrierPlanet, signalState, forkSequence, intention, chartHash, standardVersion, outcome, outcomeAt); POST resolves readingId+chartHash server-side; `PATCH /api/sessions/:id` owner-scoped write-once; `src/lib/outcomeCapture.ts` whitelist + tests |
| 6f3b24c | **Standard v0 approved + LIVE at /standard**; expanded metaphysical voice; fork count = 12 everywhere (172.06 Platonic Year = ambient integration tone, not a fork) |
| 468c1f0 | **The Clairs in the app** (`src/data/clairs.json`, `clair` prop on every Results SenseTile, guide table, 4 canon entries) + **voice pass** (persona/grounding "never a mystic" clauses removed; Astryx = guide, not the sixth sense; main screens rewritten) |
| 36d746a | Sweep: History + Auth; retired the dead "continue without account" button (app is account-only) |
| 05b8df6 | Practitioner: ModeToggle bug (`'free'` → `'user'`), false "saved encrypted" roster claim removed, practitioner copy pass |
| c4ee64c | Practitioner Portal build plan v1 |
Also: North Node "Report Engine" WIP that had leaked into this tree was quarantined to `MARKETING/_NORTHNODE_LEAK_from_astryx_2026-09-09/` (nothing deleted). North Node and Astryx stay separate.

## 3. Rulings in force (do not relitigate)
- **Voice (09-10):** Astryx is a metaphysical app. Metaphysical + esoteric + scientific + mathematical at once; Uranus/Gemini/Sagittarius/Scorpio/Cancer style; Saturn only for structure. Hard limits = the law + false claims (COMPLIANCE.md banned phrases, probabilistic framing, micro-disclaimer, safety notes). Do not sterilize.
- **Six senses = Sound · Scent · Taste · Body · Sight · Field.** The sixth sense is the person's **auric/etheric field**. Astryx is the guide, never a sense. Every channel has an inward Clair (Standard §4.2).
- **12 forks.** Two frequency systems kept separate: planetary = Cousto only; chakra = Solfeggio.
- **Account-only app** (no guest path). **Payments = Shopify only** (x402 is a separate machine channel, later). Never an outside email service when Shopify does it.
- **Sell the output, never the dataset.** RLS on every table. Never commit secrets. Commit as Sha Blyss <shabless1@gmail.com>.

## 4. Open threads (who owes what)
| Thread | Owner | Next |
|---|---|---|
| **1 · Marma × fork placements** (NEXT, SHA's call 09-10) | you, with SHA as the eyes | No Cowork step (SHA cancelled it: "you already know this app top to bottom"). Read §7 below, read the source text, build the mapping yourself, show SHA a visual of the proposal before wiring it in. |
| **2 · Practitioner Portal** (after Marma) | SHA owes 6 decisions (plan §4); build P0 → P1 → P2 → P4 → P3 → P5 | Start P0 (tier in Entitlement + Shopify practitioner products by SKU + server-resolved tier + gates) the moment she answers pricing + Shopify. |
| Worker port (Roadmap 1.2) | you | Per `PHASE1_WORKER_PORT_SCOPE.md` §9; closes Security FIX 1; then x402 door (needs SHA's USDC-on-Base address, public only) |
| Cloud daily health routine | live | trig_012AUJYeY96VgEYXpBEBHX2g, 4am Central; edit via RemoteTrigger |
| Owner-side | SHA | Google Console redirect URI check; Cloudflare connector re-auth; Shopify selling plans for the $9.99 product |

## 5. Gotchas that cost time this session
- **Bash heredocs with big Python bodies fail** ("unexpected EOF") in this environment. Write scripts with the Write tool to the scratchpad, then run them. Small heredocs are fine.
- **OneDrive locks files** for a moment after a write (`EBUSY` in lint:copy). Just rerun.
- **`tsconfig.tsbuildinfo`** (gitignored, incremental) replays stale errors — delete it before trusting tsc.
- **Zustand persist is async** — mount-time store writes go behind `persist.onFinishHydration`.
- **`lint:copy` only scans `src/data/*.json`**, not TSX. Self-check UI strings against `BANNED_PHRASES` in `src/lib/compliance.ts` (treat/cure/prescribe/diagnose/you have/guarantee/permanently…). One apostrophe inside a single-quoted TS string broke the build once — use ’ or escape.
- **Regenerate `/standard`** after editing the .md: the renderer lives in the scratchpad of the 09-10 session; rebuild a small md→html renderer (tables/lists/quotes, app palette, TOC, micro-disclaimer footer) → `public/standard.html`.
- The user guide is `public/guide.html` (hand-edited HTML). `next.config.js` rewrites `/guide` and `/standard`.

## 6. Where placement logic lives (for the Marma work)
- Fork spec: `src/data/sacredTones_nervousSystem.json` — 12 entries: planet, chakra, hz, note, color, nervePlexus, **boneApplicationPoint**, vagusConnection/Strength, brainwaveAffinity/State, ANSEffect, clinicalNote.
- Body regions: `src/data/signs.json` (`body_regions`, `organs_systems` per sign) → the zodiacal body; Full Body ladder = 12 rungs feet→crown by sign (SessionScreen ~line 590; Standard §6.2).
- Placement engine: `src/lib/BodyPlacementEngine.ts` (`resolveForkPlacement`, `chakraCenterPlacement`), `src/lib/bodyMapPlacement.ts` (`placementFor`). Womb-safe off-body sweep rule lives here + SessionScreen.
- Session rendering: `SessionScreen.tsx` `applicationFor()` (~1054: weighted stem-to-point vs field/aluminum off-body), `FieldRow "WHERE TO APPLY"` (~1444), `printProtocolSheet`.
- Practitioner surface: `PractitionerScreen.tsx` fork cards; PDF `src/lib/pdfExport.ts` ("Application Point" rows ~420).
- Tier seam: `src/lib/sacredShape.ts` — practitioner-only fields (nervePlexus, clinicalNote…) never reach basic tier. Marma detail should sit on the same seam (decide with SHA what individuals see).

## 7. Marma × fork placements — the working hypothesis and the build path

**Source:** `D:\Akasha Library\drop\ASTROLOGY - VEDIC\910934502-Marma-Points-of-Ayurveda.txt` — Vasant Lad & Anisha Durve, *Marma Points of Ayurveda* (117 points; 19,874 lines of OCR text; ~1.45 MB). Read it in slices, never whole. Useful anchors: TOC lines ~200–520 (doshas p11–13, chakras p28, nadis p50, Shabda/sound p67, bija mantras for the seven chakras p67, **10 methods of stimulating marma p71–74**, region chapters 9–14: head/face p82–111, neck p116–133, trunk p136–156, back p160–167, arms/hands p170–189, legs/feet p193+), Part 2 schematic of all 117 points, Part 3 marma therapy by condition.

**Why it fits (the three bridges):**
1. **Region bridge.** Astryx already maps the zodiacal body (`signs.json` body_regions: Aries head → Pisces feet) and runs the Full Body ladder rung by rung. Lad's region chapters give *precise points inside each rung*. A fork placed "at the sternum" becomes a fork placed at **Hridayam** (heart marma); "throat" becomes **Kantha / Kanthanadi**; "crown" becomes **Adhipati**; "third eye" becomes **Sthapani**; "navel" **Nabhi**; "sacral" **Basti**; "root" **Guda/Trik**. The 7 chakra-marmas are named in the book's chakra chapter — that is the Solfeggio/chakra-mode bridge, one-to-one.
2. **Dosha bridge.** Vedic rulerships: Saturn, Mercury (and Rahu) → vata; Sun, Mars (and Ketu) → pitta; Moon, Venus, Jupiter → kapha. Each dosha has five subtypes with named body regions (book p12–13). So a carrier planet → its dosha → the marma points of that dosha's subtype region → candidate placements for the carrier's fork. The Astryx polarity states map naturally: *excess* ≈ dosha aggravated (pacify: regulator's fork, gentle field application), *deficiency* ≈ dosha depleted (tonify: the planet's own fork, weighted stem to the point), *blocked* ≈ srotas obstruction (mobilize: sweep along the nadi/channel, then ground). Never-amplify still governs.
3. **Method bridge.** The book's ten stimulation methods include **pressure (pidana)** and **sound (shabda/mantra recited while the point is worked)**. A weighted fork stem-to-point is pressure + sound in one instrument; an aluminum field fork hovering over the point is sound through the field (the sixth sense). The fork is not a foreign addition to marma chikitsa; it is two of its own methods fused. Say exactly that in the copy.

**Build path (deterministic, compliance-linted, cite Lad & Durve):**
- `src/data/marmaPoints.json` — start with the **22 major marmas + the 7 chakra marmas** (not all 117): id, sanskrit, english, region (the six chapter regions), side (L/R/midline), location text (plain language), dosha, element, chakra, nervous/vascular note, **applicationType** (`weighted` | `field` | `field-only` for delicate points such as Hridayam, Kanthanadi, Nabhi, Basti, the eye points), contraindications (pregnancy → field-only sweep per the womb-safe rule; acute injury; the head points in children), source page.
- `src/data/marmaFork.json` — planet → primary marma, secondary marma, chakra marma, rationale, fork set (weighted / field), and the polarity-state variant (excess / deficiency / blocked / balanced). Keep it a lookup table so the engine stays deterministic; no Math.random, no Date.now.
- Plug in: `src/lib/BodyPlacementEngine.ts` `resolveForkPlacement` gets an optional marma layer (primary + secondary labels + application type) → SessionScreen `applicationFor()` and the `WHERE TO APPLY` FieldRow show the marma name + plain location under the bone point → BodyMap gets marma dots (few, labeled) → PDF "Application Point" rows carry the marma → guide gets a "Marma" subsection under the Sacred Tones → canon gets 3–4 entries.
- Tier seam: individuals see the marma name + plain location + safety; practitioners see dosha/subtype/nadi/contraindication depth (`sacredShape.ts` practitioner tier).
- Compliance: marma is "traditionally associated with"; the fork "is placed at" / "is held over"; never "treats". Every point carries its safety note. Malachite-style flag for the field-only points.
- **Show SHA a visual first** (HTML via SendUserFile, display:render): the 12 forks × their marma placements on a body outline + the 7 chakra-marmas, before wiring the engine. She decides the final table.

## 8. Then: the practitioner side
Read `PRACTITIONER_PORTAL_PLAN_v1.md`. Order: P0 Gate → P1 home for the circle → P2 deliverables (PDF footer name+modality, Field + Clairs, vagal trend, citations) → P4 Verified → P3 lenses → P5 API keys. The Marma layer lands in P2's PDF and the Session Mode fork cards as well — build the marma data first so the practitioner deliverables print it.
