# ASTRYX — Co-Architect Chat Handoff (open the next chat with this)
### 2026-06-28 · hand this to the next chat to resume as SHA's co-architect / pressure-tester
*(This is the CHAT-side handoff. Claude Code keeps its own build-state doc in `ASTRYX_SESSION_HANDOFF.md` — don't overwrite that one.)*

---

## 1. WHO YOU ARE (role — read first)
SHA's **creative co-architect and pressure-tester** for Astryx. You do **NOT** write app code — **Claude Code** does. You: pressure-test the live app, confirm findings, design solutions, and write **directives for Claude Code** (markdown saved to the `astryx_v14/` project folder). Be decisive, not a yes-man — find cracks, make the call, protect her from blind spots. Frugal. Move to execution fast; output over explanation; don't run her in circles; don't assume. Always flag IP/safe-haven moves.
**Her style:** visionary pace, thinks in brands/systems. Advise best plan → confirm → build.

## 2. STANDING BRAND RULES (never violate — all in memory)
- **Never discount.** Premium; no codes/sales/offers ever. Conversion via scarcity/value, not price. (Forks $444 alum / $555 steel.)
- **No credibility labels.** Credibility proven by performance, never posted ("engine," "500 years," "documented pathology," "clinically grounded"). Strategic framing is for SHA's eyes only, never product copy.
- **Compliance:** Astryx = *reference tool, not medical advice*. Comfort/traditional/"may support" only; never treat/cure/diagnose/prescribe as claims. Structure carries the law (silent micro-disclaimer + output guard) so Astryx's *voice* stays human, never lawyerly.
- **Copyright:** distill source books into SHA's own cited JSON, attribute to the *tradition*; never ingest verbatim into canon.
- **Scope firewall:** no transits-of-death, surgery election, decumbiture.
- **Keys never in chat** — SHA sets Vercel env herself.

## 3. WHAT WE DID THIS SESSION
Deep dive on the **Astryx intelligence engine** + integrating three source books (all uploaded, all read):
- *Human Tuning* (Beaulieu) — fork technique, nitric-oxide/Perfect-Fifth science, hold timing.
- *Pain Relief with Sound Healing* (LaSol) — placement technique, hold timing, both-sides protocol (mined for technique, disease claims firewalled).
- *Medical Astrology* (Judith Hill) — the canonical spine: PLANET=action / SIGN=location axis split, the REFLEX principle (opposite+squares) that grounds dual placement, excess/deficiency antidotes, temperament-opposition counterweight table, treatment-type→sense channels.

## 4. DIRECTIVES — STATUS (all in `astryx_v14/`)
- **N, O** — earlier (blind-test fixes; tea deep-links). **O still needs SHA's 4 tea URLs** (Blue/White/Red Lotus Flowers, All Four Lotus Collection).
- **`ASTRYX_DIRECTIVE_PQ_ASTRYX_UPGRADE.md`** — live transits + expanded scope (P & Q merged; both superseded). *Built.*
- **`ASTRYX_DIRECTIVE_S_MEDICAL_ASTROLOGY_ENGINE.md`** — THE big one (Hill engine + flowing experience; **complexity in the engine, simplicity for the client, depth via Astryx**). *Built & largely shipped; scored well live.* Absorbed Directive R (R superseded).
- **`ASTRYX_DIRECTIVE_S_ADDENDUM_1.md`** — **NOT built yet, build FIRST (engine-side):** A1.1 the 5 missing quality-planets (Jupiter/Uranus/Neptune/Venus/Pluto in `qualityLexicon.json`); A1.2 secondary house→body correspondence; A1.3 green-light reflex-orb + dual-fork visuals (preview); A1.4 ship counterweight reconciliation (no A/B); A1.5 tighten chat guard (catch real claims, allow disclaimers); A1.6 quality-vs-zone rule (quality wins, zone secondary, zone-fallback when generic).
- **`ASTRYX_DIRECTIVE_S_ADDENDUM_2.md`** — guided **one-position-at-a-time** placement (fixes flooded body map). Top-2 positions/fork intake-ranked; Fork1·P1→P2→Fork2·P1→P2; **timing = track ÷ 2 ≈ 90s per position = the cited 2-ring dose**; next orb GLOWS to cue the fork change; Individual = one song/fork, Practitioner = extended (4-5×, 5-15min, both sides). **Build against a PREVIEW — SHA eyeballs before live.**
- **`ASTRYX_DIRECTIVE_T_LIVE_BRAIN_FIX.md`** — the "Astryx answered with a canned MENU" bug. **ROOT CAUSE: the cloud model was unreachable** (env/provider/quota → `/api/astryx` returns `{fallback:true}` → `TeacherChat` drops to the local keyword bot `sovereignAstryx` whose default reply is a question-menu). **SHA RESOLVED THE ENV FIX** ("we worked it out"). T (surface fallback reason + health check; local fallback answers from the reading & never menus; confirm provider wiring) is still worth building for resilience — **confirm with SHA if still wanted.**

## 5. BUILD QUEUE (for Code, in order)
1. **Addendum 1** (engine gaps — quick).
2. **Addendum 2** (guided placement — against a **preview**).
3. **Directive T** (resilience — confirm still wanted post-fix).
4. **Directive O** — blocked on SHA's 4 tea URLs.

## 6. TEST TOOLING
- **`ASTRYX_LIVE_TEST_SHEET.md`** — 23 spot-checks, 7 groups. After Addendum 1 ships, re-run **Group B** (quality-planets): "puffy and heavy"→Jupiter, "electric and sudden"→Uranus confirms it landed.

## 7. KEY ENGINE FACTS (so you don't re-learn them)
- **`RemedyPolarityEngine.ts`** = recalibration brain. Symptoms set STATE (excess/deficiency/blocked/balanced); chart = confidence only; **Planet ≠ Remedy** (overstim→counterweight, deficient→self). Data: `symptoms.json`, `remedyPolarity.json`.
- **`ReflexEngine.ts`** — opposite(+6)/squares(+3/+9), general to all 12 signs (verified). Depends on `BodyPlacementEngine` (12/12 signs + 10/10 planets — complete).
- New Hill data: `signBodyZones.json` (12 signs), `signPolarities.json` (6 axes), `qualityLexicon.json` (only 5/10 planets until A1.1), `planetTreatmentChannels.json`.
- **Astryx chat:** `/api/astryx/route.ts`; provider via `ASTRYX_MODEL_PROVIDER` env (**default gemini** if unset — must be `openai` for OpenAI, key `OPENAI_API_KEY`, model gpt-4o). `sovereignAstryx.ts` = local fallback (the menu-bot). `composeSessionForks` in `forkRite.ts`.
- **Hold timing (cited):** base ring = hold until tone fades ~20–30s + ~15s rest; Individual = 2 positions × ~90s, ≤2 rings/point (Beaulieu "less is more"); Practitioner = extended, both sides.

## 8. OPEN FLAGS
- Some planets missing a chamber-music track ("This track isn't available yet") → separate audio pass.
- The two visual surfaces (reflex orbs, dual-fork labels) = SHA's "eyes on a preview" gate before live.
- After A1.5 guard change lands, SHA confirms Astryx still *sounds* warm/human.

## 9. OTHER VENTURES (context)
House of MahMah Tea (sacredtea.net) · MahMah TEa (500k+ social) · The Sacred Vault (subscription app) · Astryx · Creations by Sacred Music (BMI) · Stella Maris podcast (persona "Sha Blyss aka MahMah Tea"). **Alchemist Principle:** fuse astrology, frequency, ancestral wisdom, plant knowledge, chakras, financial literacy into one proprietary language.

## 10. FIRST MOVE in the new chat
Greet, then ask which she wants first: (a) push Code through the build queue (Addendum 1 → 2), (b) confirm the Astryx live-brain fix is holding, or (c) the still-queued **slide quick-guide walkthrough** (marked-up screenshots + Astryx-voice narration) she flagged a while back. Then move — decisively.
