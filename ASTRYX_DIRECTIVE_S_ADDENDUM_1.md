# ASTRYX — Directive S · Addendum 1 (post-build test findings)
### 2026-06-28 · close the two generalization gaps the knees-&-wrists test exposed, green-light the two held visuals
**Context:** Directive S engine is live and generalizes correctly — the reflex math is modular over the full zodiac (opposite +6, squares +3/+9), `signBodyZones` = 12/12 signs, `signPolarities` = 6/6 axes, `BodyPlacementEngine` = 12/12 signs + 10/10 planets. SHA's pressure-test ("make sure it applies to the rest of the planets/signs/house anatomy") surfaced two real gaps + confirmed two held visuals.

> **Gating:** `npx tsc --noEmit` → 0 · `npm run build` ✓ · verify §A1-ACCEPT · `rm -rf .next` → `vercel --prod --yes` · append "Part S Addendum 1" to `FIXES_COMPLETE_v3.md`. Determinism preserved; user signal stays authority; no credibility labels; premium (no discounts); distill-not-ingest; scope firewall (no death/surgery/decumbiture) holds.

## A1.1 — Complete `qualityLexicon.json` for the 5 missing planets
**Problem:** quality→planet+state words exist only for Saturn/Mars/Mercury/Moon/Sun. A user who describes a *quality* (not a location) for Venus/Jupiter/Uranus/Neptune/Pluto mis-routes or gets no state. (Location-named complaints are already fully covered via `signBodyZones`; this fixes the quality route only.)
**Add quality entries (distilled from the tradition — Hill's planetary pathology + element excess/deficiency), each `{ keywords[], planet, state }`:**
- **Venus** — `excess`: congested/cloying/sugar-craving/sluggish-sweet/relational-cloying; `deficiency`/atonic: limp, toneless, low-pleasure, dry-skin, depleted-warmth. (Kidneys/venous/throat-sugar themes.)
- **Jupiter** — `excess`: puffy, swollen-with-fluid/fat, bloated, over-full, congested-liver, heavy-rich; `deficiency`: under-nourished, poor-fat-assimilation, low-faith-flat. (Distinguish Jupiter fluid/fat swelling from Mars *inflammatory* swelling — keyword-disambiguate: "swollen + warm/red" → Mars; "puffy + soft/heavy" → Jupiter.)
- **Uranus** — `excess`: electric, wired, jittery, jolting, spasmodic-sudden, cramping-erratic, restless-current; (these currently fall to Mercury — Uranus should win when "electric/sudden/jolt" present). Pairs with Aquarius zones (ankles/circulation/nervous-electric).
- **Neptune** — `excess`/dissolving: foggy, dissolving, hazy, leaky, oversensitive, immune-porous, swollen-lymph-soft; `deficiency`: depleted-boundaries, faint, ungrounded-weak. (Virgo-Pisces immune/lymph axis.)
- **Pluto** — `blocked`/excess: gripping, obsessive-somatic, deep-held, eliminative-stuck, purging; (Scorpio pelvic/eliminative). Keep compliant — comfort/ease framing only, never disease.
**Rule:** keep the existing 5 planets; ADD these. Where a keyword could match two planets, the more *specific* qualifier wins (the Mars-vs-Jupiter swelling and Uranus-vs-Mercury electric disambiguation above). Deterministic ordering — most-specific match first.
**Verify:** "I feel puffy and heavy" → Jupiter/excess (not Mars); "everything feels electric and sudden" → Uranus/excess (not Mercury); "foggy and porous" → Neptune; "sluggish and craving sweets" → Venus. Location complaints still route via the zone unchanged.

## A1.2 — Add the SECONDARY house→body correspondence (the "house anatomy" leg)
**Problem:** houses feed only the blocked-bias (6/8/12); there's no house→body-zone map. SHA named "house anatomy."
**Build (tradition / Hill Code pt.7 — house N mimics sign N as a SECONDARY body correspondence):** a `houseBodyZone` lookup = house 1→Aries body, 2→Taurus, … 12→Pisces (reuse `signBodyZones` by ordinal). When a strongly-afflicted planet sits in the 1st/6th/8th/12th (the health houses), feed its house's sign-body-zone into the reflex/placement as a **secondary** signal — clearly weighted BELOW the primary sign-body correspondence (the tradition: "sign first, house second"). Never let the house override a sign-named or quality-named signal; it only *adds* a secondary placement when present.
**Verify:** a chart with an afflicted planet in the 6th house surfaces a secondary Virgo/gut placement, ranked below any primary signal; a chart with no health-house affliction shows no house-derived zone (no noise).

## A1.3 — Green-light the two held visual surfaces (build against preview)
1. **Body-map reflex orbs** (`BodyMap`/`ChamberBodyMap`): render the LOCAL + REFLEX + planet-anatomy points from `reflexPointsFor()` — simple glowing points, plain labels ("apply here for comfort" / "reflex point" / "root point"), planet-colored. Tap → one line + "Ask Astryx why →". No reflex *reasoning* printed on the map.
2. **Session dual-fork labels** (`SessionScreen`): "now the [local zone] · now the root" phase eyebrows + the quiet "How to use this fork" technique expander (strike on soft surface, ears/switch, stem-to-point twice max, Reception→Stillness→Seal).
**Build both against a preview/staging route first** so SHA can eyeball before they touch the live session. Pure rendering of data already flowing — no engine change.

## A1.4 — Ship the counterweight reconciliation (no A/B)
The S1.3 regulator change is the intended, tradition-cited correctness fix. Ship it. Do NOT add an A/B toggle — a deterministic engine shouldn't branch; a different corrective fork for some existing charts is the intended improvement.

## A1.5 — Tighten the chat-surface guard relaxation (compliance)
**Context:** the shipped `teacherLint` fix correctly stopped false-positives on *disclaimers* — Layers 1–2 (strip negated banned-verbs, strip safe clinical noun-phrases) are RIGHT and stay. **Layer 3 is too broad:** fully dropping `treat`/`treatment` on the chat surface means an actual claim ("this fork treats your tension") would pass uncaught — and chat is the highest-volume surface.
**Refine Layer 3 to context-aware, not a blanket drop:**
- **Still FLAG** a positive treatment claim on every surface incl. chat: a construction where the subject is a **product / fork / frequency / Astryx / "this"** and the verb is **treat(s)/treating/cure(s)/heal(s)** acting on a **condition or body-object, WITHOUT negation** (e.g. "this treats your sciatica", "the fork heals the joint"). These rewrite to comfort framing.
- **ALLOW** `treat`/`treatment` when negated or in a disclaimer/noun-phrase ("not a substitute for treatment", "medical treatment is for your practitioner") — Layers 1–2 already handle these.
- Keep the strong bans (cure, diagnose, prescribe, guarantee, "you have", "this causes") flagged everywhere. Strict lint still governs reports/PDFs/data unchanged.
**Verify:** "not a substitute for treatment" flows on chat; "this fork treats your X" is caught & rewritten on chat; reports/PDFs unchanged.

## A1.6 — Quality-vs-Zone resolution for the WHAT axis (the "chest tightness" call)
**Decision (grounded in the Code of Medical Astrology — planet = ACTION, sign = LOCATION):**
- When a complaint carries a **specific quality**, the **quality-planet wins the WHAT/state** (Saturn for "tightness"), acting at the zone (Cancer/chest). Do NOT collapse to the zone-ruler — that would erase the axis separation.
- **Carry the zone-ruler (Moon/chest) as a SECONDARY signal** (the area's natural signature) — both, never either/or.
- **Fall back to the zone-ruler AS the WHAT only when the quality is generic/absent** ("chest discomfort" with no quality word → Moon).
- **Placement is always at the named zone + its reflexes**, regardless of which planet won the WHAT.
**Verify:** "chest tightness" → WHAT=Saturn/blocked, secondary=Moon, placement=chest+reflexes; "chest discomfort" (no quality) → WHAT=Moon; "puffy chest" (post-A1.1) → WHAT=Jupiter.

## §A1-ACCEPT
1. Quality-only inputs for all 10 planets resolve to the right planet+state (Jupiter-puffy, Uranus-electric, Neptune-foggy, Venus-sluggish, Pluto-gripping disambiguated from Mars/Mercury).
2. Location inputs unchanged (still route via `signBodyZones`, all 12 signs).
3. A health-house affliction adds a secondary placement, ranked below primary; no house noise otherwise.
4. Reflex orbs + dual-fork labels render on preview; data matches the engine; no credibility labels, no disease naming.
5. **Guard (A1.5):** "not a substitute for treatment" flows on chat; "this fork treats your X" is caught & rewritten; reports/PDFs unchanged; strong bans still flag everywhere.
6. **Quality-vs-zone (A1.6):** "chest tightness" → Saturn WHAT + Moon secondary + chest placement; "chest discomfort" → Moon WHAT.
7. `tsc` 0 · build ✓ · determinism + compliance + scope firewalls intact.

## AFTER
`tsc` 0 → build ✓ → verify §A1-ACCEPT → `rm -rf .next` → `vercel --prod --yes` → append "Part S Addendum 1 — qualityLexicon 10-planet completion; secondary house→body correspondence; reflex-orb + dual-fork visuals (preview); counterweight reconciliation shipped" to `FIXES_COMPLETE_v3.md`.
