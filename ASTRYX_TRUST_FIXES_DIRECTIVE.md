# ASTRYX — Trust Fixes Directive (source-verified)
**Built from:** live pressure test + Swiss-Ephemeris verification + direct read of this repo (`astryx_v14`).
**Scope:** the P0/P1 trust bugs, with exact files, functions, and line anchors. P2 cosmetics listed at the end.
**Headline insight:** the corrective data already exists in `src/data/remedyPolarity.json`. P0-2 is **wiring, not authoring** — thread the existing `CorrectiveProtocol` into the prescription builder. Do not write new botanicals.

**Execution rule:** fixes in order; each has a Verification gate; finish with `npm run build` clean + update `FIXES_COMPLETE_v3.md`. Keep determinism (no `Math.random`), keep the persistent disclaimer + probabilistic framing (`COMPLIANCE.md`).

---

## FIX 1 (P0) — Historical timezone. The Ascendant is wrong.
**File:** `src/lib/timezone.ts`
**Root cause (verified):** `getTimezoneFromCoords()` resolves the offset with `const now = new Date()` (line ~44; comment: "UTC offset… *at current date*"). `birthTimeToUTC()` then converts the birth instant with that **present-day** offset. For `1990-03-22 21:42 Lisbon` this yields UTC+1 (today's summer offset) instead of the historical **UTC+0** (EU summer time began 25 Mar 1990) → app gives **ASC Libra 25°**; correct is **Scorpio 7°** (Swiss-Ephemeris verified). Breaks every chart born across a DST/zone edge; also corrupts all house cusps.

**The fix is small — `getUTCOffsetHours(iana, date)` already accepts a date and `Intl` carries historical DST data. Stop passing `now`; pass the birth instant.**
1. In `birthTimeToUTC()`: build a provisional birth `Date` from `birthDate`+`birthTime` (treated as the wall-clock instant), and resolve the offset **for that date**, not `now`.
2. Refactor `getTimezoneFromCoords(lat, lon)` → `getTimezoneFromCoords(lat, lon, atDate?: Date)`; default `atDate = new Date()` only for the live UI "zone label," but `birthTimeToUTC` must pass the birth date so `getUTCOffsetHours(iana, birthDate)` runs against the birth year.
3. Handle the DST-transition edge: resolve the offset using the birth local date (e.g. at local noon of the birth day) to avoid the rare fold/gap ambiguity, then apply to the exact birth time.
4. Confirm the `/api/chart` caller uses the `tzInfo.offsetHours` returned from the birth-date resolution (not a separately-passed `tzOffset` computed elsewhere). `app/api/chart/route.ts` accepts `tzOffset` in its body — ensure the client sends the **birth-date** offset from `birthTimeToUTC`, or have the route recompute via `birthTimeToUTC`.

**Verification:**
- `1990-03-22 21:42 Lisbon` → resolved offset **UTC+0**, ASC **Scorpio (~7°)**, Moon Aquarius. (Was Libra.)
- A US summer birth where current==historical offset → unchanged (no regression).
- Add unit test asserting the resolved offset for the Lisbon vector is 0.

---

## FIX 2 (P0) — Route the regulator through the prescription. "Never amplify" is violated.
**File:** `src/lib/engine.ts`, function `composeUnifiedPrescription(planet, source, triggerLabel)` (~line 303).
**Root cause (verified):** every channel is keyed to the single dominant `planet` — `scentsForPlanet(planet)`, `herbsForPlanet(planet)`, `botanicals.find(b => b.planet === planet)` (line ~320), `crystals.find(c => c.planet === planet)` (line ~321), `bodyData`/`colorData`/`anchor` all `=== planet`. The `CorrectiveProtocol` from `RemedyPolarityEngine` (which carries `regulator_planets`, `herbs`, `scents`, `breath`, `color_palette`, `avoid`, `sound_character`) is **never passed in**. So for Neptune-excess the card prints mugwort + Blue Lotus + seafoam — and those are literally the **Neptune *deficiency/blocked*** herbs in `remedyPolarity.json` (i.e. the amplifying set). `ChamberDNAEngine.ts` already does this correctly (it uses `regulatorForPlanet` / `protocol.regulator_planets[0]`); the prescription builder is the one place that doesn't.

**The corrective content already exists — use it.** `src/data/remedyPolarity.json` →
`Neptune.excess = { regulator_planets:["Mercury","Saturn"], herbs:["peppermint","rosemary","ginger","gotu kola"], scents:["peppermint","eucalyptus","rosemary"], breath:"alternate_nostril", color_palette:["#7DF9FF","#3A3A3A","#8A6F3D"] }`. (Mars.excess similarly = Moon/Venus regulator, peppermint/chamomile/rose — matches the spec's example.)

**What to build:**
1. Change the signature to `composeUnifiedPrescription(planet, source, triggerLabel, polarity?: PolarityResult)` and pass the `PolarityResult` from the engine call site (wherever the dominant prescription is composed — search `composeUnifiedPrescription(`).
2. Compute `const correcting = !!polarity && polarity.symptomDriven && polarity.dominant_state !== 'balanced'`.
3. When `correcting`, source the channels from `polarity.protocol` (the data that already exists), NOT from the dominant planet's affinity files:
   - **taste/herbs** → `protocol.herbs`
   - **scent** → `protocol.scents`
   - **breath** → `protocol.breath`
   - **sight/colors** → `protocol.color_palette`
   - **botanical & crystal** → re-key to the regulator: `botanicals.find(b => b.planet === regulator)` where `regulator = protocol.regulator_planets[0]`. If no regulator botanical/crystal exists, fall back to the regulator's grounding ally or omit — never the dominant pattern's.
   - **sound Hz** → regulator anchor (see Fix 3).
   - surface `protocol.avoid` on the card.
4. **Safety gate (non-negotiable):** if `polarity.dominant_state === 'excess'` (or any dissociation/Neptune-excess case), the returned botanical/herb set must exclude oneirogens/psychoactives (mugwort, blue lotus, valerian-as-sedative, etc.). Add an explicit blocklist check after assembly; if a banned item survives, drop it and log to `safetyNotes`. (Cross-reference the Malachite hard-rule pattern already at line ~401 as the implementation model.)

**Verification:**
- Neptune-excess (`Mara Vance` vector): card shows peppermint/rosemary/ginger/gotu kola, alternate-nostril breath, grounding palette; **no mugwort, no Blue Lotus**; `avoid` list matches outputs.
- Mars-excess: cooling/calming (Moon/Venus) herbs, 4-7-8 breath — not energizing.
- Balanced state: keys off dominant planet (correction path skipped) — no regression.

---

## FIX 3 (P1) — One frequency, one label.
**Files:** `src/lib/engine.ts` (`fiveSenses.sound.hz = anchor?.hz` — dominant planet's Hz, ~line 330s) and the chamber chip rendering (frequency map in `lib/chamber/ChamberDNAEngine.ts` line ~195: `Mercury: 141.27`).
**Root cause (verified):** prescription SOUND uses the **dominant** anchor (Neptune 211.44). The chamber correctly plays the **regulator** tone (Mercury 141.27) but the chip label reads "Neptune." Three surfaces, two numbers, one wrong label.
**What to build:**
1. In `composeUnifiedPrescription`, when `correcting`, set `sound.hz` to the **regulator** anchor: `anchors.find(a => a.planet === protocol.regulator_planets[0])?.hz` (the pattern already used at engine.ts ~line 912 for the aspect sound — reuse it).
2. Return a single object `{ playedHz, playedPlanet }` and render every chip/label from it. A chip showing 141.27 must read **Mercury**, not Neptune.
3. Reconcile the Results "Sound" card with the Chamber so both show the same `playedHz`.
**Verification:** Neptune-excess → Results card, chamber chip, and emitted tone all report the same Hz and correct planet. Grep components for literal `211.44`/`141.27` outside the canonical anchor table → none.

---

## FIX 4 (P1) — Name the regulator consistently. (Already half-solved by data.)
**Root cause (verified):** `Neptune.excess.regulator_planets = ["Mercury","Saturn"]`. The hero copy leaned Saturn (boundaries), the chamber said Mercury — both valid, just different array picks + independently-authored prose.
**What to build:** pick a single display rule — `regulator_planets[0]` (Mercury) is the primary; render it identically on hero diagnosis, chamber callout, and practitioner trace. If you want to name both ("toward Mercury structure, Saturn boundaries"), centralize that string in one helper and reuse it everywhere. Remove independently-written regulator language in the hero copy generator.
**Verification:** hero + chamber + practitioner trace name the same regulator(s) for Neptune-excess and 3 other planet/state pairs.

---

## FIX 5 (P1) — Make the narrative real, or stop claiming it.
**File:** `src/app/api/intake/interpret/route.ts` (the "interpret your words" endpoint) + the activated-planets chip.
**Root cause (verified live):** free-text changed nothing; the chip only mirrored the checkbox scan, yet the guide says "the system will read your words."
**What to build (deterministic — preserve "no AI in output"):**
- **Option A (preferred):** a static keyword→planet lexicon (foggy/unmoored/escapism→Neptune; anger/inflammation→Mars; …). Union detected planets into the activated set at lower weight than explicit taps; label them "from your words." Same text ⇒ same result.
- **Option B:** rewrite the copy to an honest framing ("context for your session") and drop the analysis claim.
**Verification:** A → Neptune paragraph deterministically reinforces Neptune on the chip. B → no copy claims the text is analyzed.

---

## GLOBAL RULES
- Determinism preserved; no RNG in chart/protocol/sound/color.
- Compliance: keep `ⓘ Reference tool · Not medical advice`, probabilistic framing, existing safety notes; Fix 2 **strengthens** safety (oneirogen blocklist) — never weaken it.
- IP/exposure: the planet×state tables + correction logic are the crown asset. Audit whether `remedyPolarity.json` / `RemedyPolarityEngine` ship in the client bundle; if so, move the resolution behind `/api` so the mapping isn't downloadable. Note what moved in the completion doc.
- TypeScript: update the `composeUnifiedPrescription` signature + `UnifiedPrescription`/`fiveSenses` types for the corrective fields; no new `any`.
- Author only from existing data files. If a regulator botanical/crystal is missing, list it as a content TODO — don't fabricate.

## AFTER ALL FIXES
1. `npm run build` → zero TS errors.
2. Re-run the three vectors (Neptune-excess, Mars-excess, balanced).
3. Write `FIXES_COMPLETE_v3.md`: files/lines touched, the regulator display rule, oneirogen blocklist, what moved server-side, vectors + results, content TODOs.

## OUT OF SCOPE (P2 backlog)
Cosmic-Weather "7 active" vs 5 rendered; geocode autocomplete de-dup; duplicate "BIRTH LOCATION" label; 12h time input rejecting typed "PM"; preview audio synth-only (make dual-layer like the chamber); persisted dev fixture ("Test Balanced"); copy passes ("a earth"→"an earth", "Density Uranus").
