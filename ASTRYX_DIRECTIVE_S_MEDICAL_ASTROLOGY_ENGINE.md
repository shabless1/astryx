# ASTRYX — Directive S: Medical-Astrology Intelligence Engine + Flowing Experience
### Claude Code handoff · 2026-06-28 · the deterministic recalibration engine grows up — power in the engine, simplicity for the client, depth on tap via Astryx
**Supersedes & absorbs Directive R** (Fork Mastery & Compliant Comfort). Run THIS file. Mark R "superseded."
**Read with:** `COMPLIANCE.md` (`safePhrase`, `withDisclaimer`, `safetyGate`, `lintForBannedPhrases`, `detectCrisis`, `MICRO_DISCLAIMER`), `lib/engine.ts`, `lib/RemedyPolarityEngine.ts`, `lib/chamber/forkRite.ts` (`composeSessionForks`, never-amplify), `lib/BodyPlacementEngine.ts`, `lib/teacher/grounding.ts`, `lib/astryx/persona.ts`, `components/screens/IntakeScreen.tsx`, `components/engine/BodyMap.tsx` + `ChamberBodyMap.tsx`, `components/screens/SessionScreen.tsx`, the Results report, the Post-Session summary, the Dashboard **Explore Deeper** block, `data/` (38 JSON canon).

> **Source:** Judith Hill, *Medical Astrology: A Guide to Planetary Pathology* — the authoritative compilation of the medical-astrology TRADITION. We distill the **system**, never ingest the book verbatim (copyright), and attribute to the *tradition* (the sign rulerships + planetary antidotes predate Hill by centuries). Her disease lists stay reference-only behind the comfort reframe. We take the structural intelligence and **firewall the diagnostic/prognostic apparatus** (transits-of-death, surgery election, decumbiture — out of scope).
>
> **THE GOVERNING PRINCIPLE (non-negotiable):** all complexity lives in the ENGINE. The client's journey stays simple and flowing — a light intake, a clear reading, a calming session, a clean summary. The depth (why this fork, where the reflex is, what the counterweight means) is **available but never forced** — it lives behind **Astryx**, who the client is gently nudged to ask. We never overwhelm; we invite.
>
> **Gating:** `npx tsc --noEmit` → 0 · `npm run build` ✓ · verify §ACCEPT · `rm -rf .next` → `vercel --prod --yes` · append "Part S — Medical-Astrology Engine & Flowing Experience" to `FIXES_COMPLETE_v3.md`. Determinism absolute; user's reported signal stays the authority; chart = confidence only; the LLM never recomputes the deterministic reading. No new `any`. Premium — no discounting.

═══════════════════════════════════════════════════════════════════
# PART 1 — THE INTELLIGENCE ENGINE (where ALL the complexity lives)
═══════════════════════════════════════════════════════════════════

**The Code of Medical Astrology (Hill), in one line:** PLANET = the pathological *action* (the WHAT); SIGN = the *body part* (the WHERE); a planet *in/reflexing-to* a sign = what action, where. The engine today fuses these — we separate them.

## S1.1 — Separate the two axes
**Where:** `engine.ts` symptom pipeline + `RemedyPolarityEngine.ts` inputs.
- **New `data/signBodyZones.json`** — sign → body parts, from the tradition (Hill's table; public-domain rulerships). Aries=head/skull/eyes; Taurus=neck/throat/ears; Gemini=hands/arms/fingers/lungs/nerves; Cancer=stomach/breasts/chest; Leo=heart/spine/back; Virgo=gut/intestines/pancreas; Libra=kidneys/lumbar; Scorpio=pelvis/colon/sacrum/genitals; Sagittarius=hips/thighs/sciatic; Capricorn=knees/bones/skin; Aquarius=ankles/calves/circulation; Pisces=feet/lymph/blood.
- **New `data/qualityLexicon.json`** — complaint *quality* → planet (action) + state. Stiffness/calcification/restriction → **Saturn + blocked**; inflammation/heat/itch → **Mars + excess**; scatter/nervous/fidgety → **Mercury + excess**; depletion/weakness/atonic → **deficiency**; sluggish/congested → **blocked**. (Note Hill's Saturn-in-Pisces lesson: same planet can read excess *or* deficiency by sign — the quality word decides.)
- **Resolution:** a body-region/condition input resolves to `{ sign (WHERE) + planet (WHAT) + state }`. "Knee stiffness" → Capricorn (location) + Saturn (action) + blocked. These flow into `determinePolarity` exactly like today's symptoms — no new brain, a richer input.

## S1.2 — The Reflex engine (this is what makes BOTH placements real)
**Where:** new `lib/ReflexEngine.ts`, consumed by the body map + fork composer.
- For any afflicted sign, compute its **opposite (180°)** and **two squares (90°)** → the reflex body zones (Hill Code pt.5). Knees/Capricorn → opposite **Cancer** (stomach/chest), squares **Aries** (head) + **Libra** (kidneys/lumbar).
- Output two placement sets per signal:
  - **LOCAL** = the named/afflicted zone (where it hurts) → the comfort fork.
  - **REFLEX/PLANETARY** = opposite + square zones + the planet's own anatomy point → the root/calibration fork.
- The six sign **polarities** (Aries-Libra, Taurus-Scorpio, Gemini-Sagittarius, Cancer-Capricorn, Leo-Aquarius, Virgo-Pisces) define the reflex pairs + the body *systems* they co-govern — store as `data/signPolarities.json`.

## S1.3 — Reconcile the counterweight table to the tradition (cited authority)
**Where:** audit `data/remedyPolarity.json` `regulator_planets` against Hill's antidote table; encode the *principle*.
- **Temperament opposition is the principle** (so counterweights are computed/defensible, not arbitrary): Mars=hot+dry, Saturn=cold+dry, Moon=cold+moist, Sun=hot+dry, Venus=cool+moist, Jupiter=warm+moist. The antidote = the opposing temperament.
- **Canonical antidotes (reconcile to these):** Mars→Moon+Saturn · Saturn→Venus+Mars+Jupiter · Mercury→Venus/Neptune+Saturn · Venus→Saturn+Mars · Jupiter→Mercury+Saturn · Uranus→Saturn · Neptune→Saturn+Mars · Moon→Saturn/Mars · Sun→Saturn/Moon. **Saturn = master regulator** (the "balance wheel," exalted in Libra). Where the current data diverges, prefer the tradition and note it. Cite "medical-astrology tradition," never the book.

## S1.4 — Excess/Deficiency = the existing PolarityState, canonized
The engine's `excess/deficiency/blocked/balanced` already = Hill's imbalance axis. Confirm the rule: **excess/blocked → counterweight (suppress/settle); deficiency/balanced → self (activate).** Element antidotes for reference: Fire-excess→Water, Water-excess→Fire, Air-excess→Earth, Earth-excess→Fire/Air/Water; deficiency→apply more of the weak element.

## S1.5 — Treatment-type → 5-sense map (cited spine under the composer)
**New `data/planetTreatmentChannels.json`:** Venus→scent/comfort/massage; Mars→movement/heat; Mercury→breath/cognitive/nervine; Neptune→**sound/vibration**/aroma; Saturn→mineral/grounding/cold; Moon→fluids/hydration; Sun→light/warmth; Jupiter→oils/fats. (Note the tradition lists **sound/vibration therapy as a Neptune-Uranus treatment** — the whole instrument has a documented home. Surface that in Astryx.)

## S1.6 — Wire it through (determinism preserved)
Body-zone/condition intake → `{sign+planet+state}` → `determinePolarity` (user signal is authority; chart = confidence only) → `composeSessionForks` (never-amplify per tier; ≥4 distinct; ≥1 activation) → **placement output now carries LOCAL + REFLEX/PLANETARY zones** from `ReflexEngine`. Same inputs → identical output. The 5-sense + chamber DNA re-key to the regulator under correction (single source of truth) — unchanged.

═══════════════════════════════════════════════════════════════════
# PART 2 — THE INTAKE (simple for the client, rich to the engine)
═══════════════════════════════════════════════════════════════════
**Where:** `IntakeScreen.tsx`. **Keep it light — 1–2 taps, never a medical questionnaire.**
- Add ONE flowing somatic moment to the existing scan: *"Where are you holding it today?"* (body-zone chips: head/neck, shoulders/arms, chest, gut, lower back/hips, knees, feet, none) + *"Wired or weary?"* (the autonomic axis). That's it. Feels effortless; under the hood it feeds `signBodyZones` + the excess(wired)/deficiency(weary) state into the engine (S1.6).
- **Free-text + named conditions** still allowed. The **named-condition handler** (decline → pivot to body-zone → route) runs on any condition word (arthritis, sciatica, carpal tunnel…): Astryx never says "treat X"; the engine recalibrates on the *zone*, and persistent/severe input trips `detectPainRedFlag` (sibling of `detectCrisis`) → "have a licensed professional look at that."
- **Credibility is SHOWN, never posted.** Do NOT add a banner/label explaining the engine's rigor ("computed from your real chart," "deterministic," "500 years," "medical-astrology engine," etc.). The user *feels* it through the consistency, specificity, and depth-on-demand of the experience — same inputs quietly returning the same reading, precise body-zone placements, Astryx's bottomless answers. SHA's established ethos words ("calibration, not prediction") may appear as quiet brand VOICE, but the engine's sophistication is never advertised as a claim. Proven by performance, not announced.

═══════════════════════════════════════════════════════════════════
# PART 3 — SESSION RECALIBRATION (the dual fork, flowing)
═══════════════════════════════════════════════════════════════════
**Where:** `forkRite.ts` + `SessionScreen.tsx`.
- The session now composes **both**: a **LOCAL comfort fork** (the regulating tone applied at the named zone) and the **PLANETARY/REFLEX fork** (the root, at the planet anatomy + reflex zones). Sequence stays ≥4 distinct, never-amplify, breath-bookended (Reception → Sound → Stillness → Seal).
- Client sees a calm, ordered session — *"now the knees, now the root"* — not the machinery. The "why" is a tap to Astryx.
- **Fork technique** (from R, retained): strike on soft surface (never metal), knee-tap→ears→switch, stem-to-point twice max ("less is more" — the nitric-oxide guideline), the Reception/Seal arc. Surfaced as a quiet "How to use this fork" expander per step.

═══════════════════════════════════════════════════════════════════
# PART 4 — BODY MAPPING UPGRADE (dual placement, Hill-grounded)
═══════════════════════════════════════════════════════════════════
**Where:** `BodyMap.tsx` / `ChamberBodyMap.tsx` (fulfils Directive K via the Reflex engine).
- Show **orbs at the LOCAL zone (where it hurts) + the REFLEX zones + the planet's anatomy point** — each labeled simply ("apply here for comfort," "root point"). Color by planet (existing palette).
- Keep the visual clean — a body, a few glowing points, plain labels. Tapping any point → a one-line note + **"Ask Astryx why →"**. The full reflex reasoning is NOT printed on the map; it lives behind Astryx.

═══════════════════════════════════════════════════════════════════
# PART 5 — END-OF-SESSION / REPORT / SUMMARY (shallow on purpose)
═══════════════════════════════════════════════════════════════════
**Where:** Results report + Post-Session summary.
- Keep them **clean and human**: what was calibrated (in plain comfort language), the placements, the tea/scent/breath, an honest "what shifted?" check-in. No jargon walls, no Hill terminology dumped on the page.
- **Intentional shallowness + nudges:** every section ends with a contextual invitation — *"Curious why this fork? Ask Astryx →"*, *"Want the reflex points? Ask Astryx →"*. The report answers *what*; Astryx answers *why/how/where-else*.
- Compliance: comfort/traditional framing, probabilistic ("may support a sense of…"), `MICRO_DISCLAIMER` present, never "treats/cures."

═══════════════════════════════════════════════════════════════════
# PART 6 — EXPLORE DEEPER (the depth surface, still uncluttered)
═══════════════════════════════════════════════════════════════════
**Where:** Dashboard **Explore Deeper** block.
- Each item (mineral, herb/tea, crystal, body point, the science) stays a **simple card** — a sentence, an image, a CTA. The engine's full reasoning is one tap into Astryx, not crammed onto the card.
- Tea cards keep the **"Shop this blend →"** CTA (Directive O), per-blend deep-link → collection fallback, feature-flagged. Premium — no discounts ever.
- Each card carries an **"Ask Astryx about this →"** nudge.

═══════════════════════════════════════════════════════════════════
# PART 7 — THE NUDGE SYSTEM (the bridge — invite, never overwhelm)
═══════════════════════════════════════════════════════════════════
- Contextual, gentle prompts seeded across the reading, summary, body map, and Explore Deeper: *"Ask Astryx: why this counterweight? where's the reflex? which tea? how do I hold the fork? what does my Saturn mean?"*
- The point: the client never hunts and never drowns. Anything not in the report is **one warm tap away**. This is also the conversion engine — depth pulls people into the relationship with Astryx (and toward the Practitioner tier).

═══════════════════════════════════════════════════════════════════
# PART 8 — ASTRYX CHAT (the depth-on-demand brain)
═══════════════════════════════════════════════════════════════════
**Where:** `grounding.ts` / `persona.ts` / the live Astryx route.
Astryx now teaches from the **full Hill-grounded engine**, hedged + compliant:
- **Planet vs sign** ("Saturn is the *action*, Capricorn is the *place* — your knees"), **the reflex** ("knees mirror to the stomach and head — that's why we also ease there"), **the counterweight** ("Planet ≠ Remedy — a stiff Saturn is met with Venus's ease, not more Saturn"), **both placements**, **treatment-types** ("sound itself is a Neptune-Uranus practice"), **today's sky + fork-of-the-day** (Directive P+Q), **technique**, **the nitric-oxide / Perfect-Fifth science** (research-suggested, cited).
- **Compliance without lawyer-speak:** structure carries the law (silent `MICRO_DISCLAIMER` + `lintForBannedPhrases` output guard); Astryx speaks human — "for that, someone hands-on can really help you," not recited regulations. Disease/diagnostic claims hard-dropped (cancer, virus, DNA-repair, "treats/cures," diagnosing); comfort/traditional/"may support" reframe only.

═══════════════════════════════════════════════════════════════════
# FIREWALLS (my job to hold the line)
═══════════════════════════════════════════════════════════════════
- **Compliance:** distill Hill's *system*, never ingest verbatim; attribute to the *tradition*; disease lists reference-only behind the comfort reframe; condition words → decline-pivot-route; banned-term guard on every output + new JSON.
- **Scope:** NO transits-of-death, surgery-date election, or decumbiture. Structural intelligence only (sign→body, reflex, excess/deficiency antidote, temperament, antidote table, treatment channels).
- **Determinism:** the engine computes; Astryx explains; the LLM never recomputes. Same inputs → same reading.
- **No credibility labels (brand rule):** the engine's sophistication is NEVER posted, badged, or headlined anywhere in the UI, copy, or Astryx's voice ("documented pathology," "500 years," "deterministic engine," "medical-astrology engine," "clinically grounded," etc.). Credibility is earned through the experience, not claimed. If any such phrasing exists today, remove it. Proven by performance, not advertised.

═══════════════════════════════════════════════════════════════════
# §ACCEPT — ACCEPTANCE TEST (the whole flow, the knees-&-wrists case)
═══════════════════════════════════════════════════════════════════
1. **Intake** "joint pain in my knees, carpal tunnel in my wrists" → condition handler declines the diagnosis, extracts **knees + wrists**, routes ("have a pro look"), red-flag honored. Intake still feels light (chips + one line).
2. **Engine** resolves knees→Capricorn/Saturn/blocked, wrists→Gemini/Mercury/blocked → `determinePolarity` → counterweights (Saturn→Venus/Mars; Mercury→Venus/Saturn) → `composeSessionForks` ≥4 distinct, never-amplify, ≥1 activation.
3. **Reflex/placement** → body map lights LOCAL (knees, wrists) + REFLEX (Cancer/Aries/Libra for knees; Sagittarius/Virgo/Pisces for wrists) + planet anatomy. Both placements shown, simply labeled.
4. **Session** runs the dual fork (local comfort + planetary/reflex root), breath-bookended, technique expanders present.
5. **Report/summary** stay clean + comfort-framed, end with "Ask Astryx why →" nudges; `MICRO_DISCLAIMER` present; no disease language.
6. **Explore Deeper** simple cards + "Ask Astryx about this →" + tea "Shop this blend →".
7. **Astryx** explains planet-vs-sign, the reflex, the counterweight, both placements — hedged, cited to tradition, human voice, never "treats arthritis."
8. **Determinism + compliance** intact end-to-end; no banned term anywhere.

## AFTER
`tsc` 0 → `npm run build` ✓ → verify §ACCEPT (lead with the knees-&-wrists flow) → `rm -rf .next` → `vercel --prod --yes` → append "Part S — Medical-Astrology Engine & Flowing Experience (axis separation; reflex/dual-placement engine; tradition-cited counterweight table; light somatic intake; dual-fork session; body-map upgrade; shallow reports + Ask-Astryx nudges; Explore Deeper; full Astryx depth — power in the engine, simplicity for the client)" to `FIXES_COMPLETE_v3.md`.
