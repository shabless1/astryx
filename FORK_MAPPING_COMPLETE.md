# ASTRYX — Directive v2.0: Fork Mapping Recalibration + Placement Engine Tuning

Verify-and-adjust pass on top of the completed v1.0 Daily Recalibration build (see `FIXES_COMPLETE.md`). NOT a rebuild. NOT deployed — handed back for SHA review. `npx tsc --noEmit` = 0 · `npm run build` green at each step.

---

## v2 AUDIT (FIX A) — current state, ground truth — 2026-06-21

**Gate:** per the directive, FIX A is complete + written before FIX B begins. No code changed in FIX A.

### Fork set source of truth — `src/data/sacredTones_nervousSystem.json`
- **13 entries.** Entry #7 (index 6) = **Platonic Year · 172.06 Hz · Crown** — to be removed (FIX B).
- **Current chakra assignments (verbatim):**
  | # | planet | chakra | hz |
  |---|---|---|---|
  | 1 | Earth Day | Root | 194.18 |
  | 2 | Full Moon | Sacral | 210.42 |
  | 3 | Sun | Solar Plexus | 126.22 |
  | 4 | Earth Year | **Heart** ← wrong (→ Extended) | 136.10 |
  | 5 | Mercury | Throat | 141.27 |
  | 6 | Venus | **Third Eye** ← wrong (→ Heart) | 221.23 |
  | 7 | Platonic Year | Crown ← REMOVE | 172.06 |
  | 8 | Mars | Extended | 144.72 |
  | 9 | Jupiter | **Extended** ← (→ Crown) | 183.58 |
  | 10 | Saturn | Extended | 147.85 |
  | 11 | Uranus | Extended | 207.36 |
  | 12 | Neptune | **Extended** ← (→ Third Eye) | 211.44 |
  | 13 | Pluto | Extended | 140.25 |
- **All Hz already match the v2 target table** — only chakra reassignment + the Platonic Year removal are needed; no frequency edits.

### Other surfaces
- **`planetary-anchors.json`** — 15 entries; a broad **Cousto frequency REFERENCE** table (incl. `Platonic_Year` 172.06, `Earth_Year_Om` 136.1, `Mean_Solar_Day` 194.18, `Sidereal_Day` 194.71, `Moon_sidereal` 227.43). It is NOT the fork list and no UI/sequence treats `Platonic_Year` here as a fork. **Decision:** keep it as the reference table; its `172.06` will SOURCE the FIX D audio ambient (so 172.06 survives only as a tone, never a fork).
- **`astryxAudioLibrary.ts`** — path/pattern based (`{PLANET}_{STATE}_NN.mp3`); no "Platonic Year" fork reference. Catalog/R2 driven.
- **`BodyMap.tsx` `CHAKRAS`** — the 7-rung chakra ladder maps **chakra → SOLFEGGIO** (Root 396 · Sacral 417 · Solar Plexus 528 · Heart 639 · Throat 741 · Third Eye 852 · Crown 963). This is a SEPARATE layer from the planetary forks and is correct/intact. **The planetary forks themselves carry Cousto Hz, NOT Solfeggio** — so FIX E's premise ("forks carry Solfeggio") is already half-satisfied; the Solfeggio↔fork link is added as a labeled `solfeggioFallback` seam, BodyMap CHAKRAS left as-is.
- **`forkRite.ts`** — `PLANET_TO_FORK` = 10 classical (Moon→'Full Moon'); `EARTH_OM_HZ = 136.10` used for ground/earth-close; **no Platonic reference.** It is the single fork-SEQUENCE authority. `buildForkSequence` splits the container time across phases by `architecture[].durationMinutes` → **timing is FIXED proportional slices, not placement-driven** (FIX I target).

### Engine questions the directive asks
- **One placement vs station array:** `BodyPlacementEngine.resolveForkPlacement` emits **ONE** `ForkPlacement` (ranked symptom→sign→planet→chakra→house→state). **No station array.** (FIX H target.)
- **Delivery mode exists?** **No.** No `contact`/`sweep` concept anywhere; every placement is a single anchor point. (FIX G target.)
- **Fixed vs variable phase timing:** **Fixed** (see forkRite above; `ChamberConductor` advances through the fixed `SequenceStep[]` by `startSec`/`holdSec`). (FIX I target.)
- **Body-zone canon:** sign→body and planet→body live in `BodyPlacementEngine` libraries (`signBodyRulershipLibrary`, `planetBodyRulershipLibrary`) — traditional zodiac body rulership (Aries=head … Pisces=feet), mirroring `medicalAstrology.json`. FIX H's natal-sign→body lookup will read `signBodyRulershipLibrary` (existing canon keyed by sign) — not invented zones.

### ⚠ Do-not-touch note
"**Platonic**" appears across the mandala/geometry files (`platonicSolidLibrary.ts`, `PlatonicSolidOverlay.tsx`, `SacredGeometryEngine.ts`, etc.) — those are the **Platonic SOLIDS** (3D wireframes from the v1 mandala work), entirely unrelated to the "Platonic Year" fork. FIX B touches ONLY the fork (`sacredTones_nervousSystem.json`). The geometry files are left alone.

### Open items already visible (carried to the closing section, never guessed)
- D3 (from v1): counterweight pairing confirm.
- v2: any natal-sign body zone undefined for FIX H will be listed (none expected — all 12 signs present in `signBodyRulershipLibrary`).
- External: physical fork manufacturing spec must drop to 12 (no Platonic Year fork); the Solfeggio fork set is a separate future-run product.

---

## FIX B — Fork set reconciled to 12
- **Removed Platonic Year** from `sacredTones_nervousSystem.json`. Validated: **12 entries**, no Platonic — `Earth Day, Full Moon, Sun, Earth Year, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto`.
- **"Full Moon" → Moon normalization confirmed** in every consumer: `forkRite.PLANET_TO_FORK` (Moon→'Full Moon'), `BodyMap.PLANET_FORK_NAME` (Moon→'Full Moon'), and the sovereign Astryx brain — so Moon is never dropped or double-counted.
- **Other surfaces:** `astryxAudioLibrary` (path-pattern based) and `BodyMap` CHAKRAS (the Solfeggio chakra ladder) carry no Platonic-Year fork. `forkRite` has none. **`planetary-anchors.json` keeps its `172.06` entry** — it is the broad Cousto *reference* table (not the fork list), and that value SOURCES the FIX D audio ambient.
- **Grep `Platonic` / `172.06`:** remaining hits are (a) the unrelated **Platonic-solid** mandala/geometry files, and (b) `planetary-anchors.json` 172.06 → audio. No fork surface lists Platonic Year. ✅
- **External action (SHA):** physical fork **manufacturing spec → 12**, no Platonic Year fork.

---

## FIX C — Corrected chakra mapping
Set the chakra address on the 7 chakra forks; moved Neptune/Jupiter INTO chakra forks and Earth Year OUT to Extended. Verified result:
| Chakra | Fork | | Extended (no chakra) |
|---|---|---|---|
| Root | Earth Day | | Earth Year |
| Sacral | Full Moon | | Mars |
| Solar Plexus | Sun | | Saturn |
| **Heart** | **Venus** *(was Third Eye)* | | Uranus |
| Throat | Mercury | | Pluto |
| **Third Eye** | **Neptune** *(was Extended)* | | |
| **Crown** | **Jupiter** *(was Extended)* | | |
- 7 chakra forks form the Root→Crown ladder; the 5 Extended carry `chakra: "Extended"` (the existing schema's no-chakra flag) and never appear on the ladder.
- `BodyMap` CHAKRAS (chakra→Solfeggio ladder) is unchanged and already renders Root→Crown; the forks' chakra addresses now line up to it correctly.
- Compliance: energetic/glandular correspondence only — no data copy makes a medical claim; user-facing strings stay "traditionally associated with."
- `tsc` 0 · build green.

---

## FIX D — Platonic Year (172.06 Hz) repurposed as audio ambient
- New `INTEGRATION_AMBIENT = { hz: 172.06, label: 'Crown / CNS Integration' }` in `pureTone.ts`, clearly typed/commented as an **ambient integration tone, NOT a fork** (never enters `buildForkSequence`, the fork set, the body map, or the manufacturing spec).
- Surfaced in the **Music Library → Chakra tab** as an "Integration ambient" row (tap to play via the existing `playPureTone` Web-Audio path, routed through `audioSession`), labeled "Ambient integration tone · not a fork."
- `172.06` now lives only as: this ambient + the `planetary-anchors.json` reference value. It is absent from every fork surface.
- `tsc` 0 · build green.

---

## FIX E — Solfeggio marked as labeled fallback (not identity)
- **Confirmed Cousto is the forks' primary identity** everywhere — `forkRite` sequences by `fork.hz` (Cousto), `BodyMap` displays `fork.hz` (Cousto), placement uses Cousto. The Solfeggio set (396–963) lives separately in the `BodyMap`/Music-Library chakra ladder.
- Added optional **`solfeggioFallback`** to the `SacredFork` type (commented: labeled fallback, NOT native frequency) and to the **7 chakra forks only**: Earth Day 396 · Full Moon 417 · Sun 528 · Venus 639 · Mercury 741 · Neptune 852 · Jupiter 963. The **5 Extended forks are Cousto-only** (field absent — verified).
- This is the clean **seam** for the future dedicated Solfeggio fork product: it can read `solfeggioFallback` natively without refactoring the planetary forks. The product is NOT built now.
- `tsc` 0 · build green.

---

## FIX F — Two-address model (chakra work vs calibration work, kept distinct)
- **New `src/lib/forkClass.ts`** (single source, derived from the corrected `sacredTones`): `CHAKRA_FORKS` (7, Root→Crown order), `EXTENDED_FORKS` (5), `chakraAddressFor(planet)` (chakra string for the 7, **null** for the 5), `isChakraFork`, `solfeggioFallbackFor`, `forkEntryFor` (Moon→'Full Moon' normalization).
- **Calibration = body-zone for ALL 12:** new `bodyZoneHomeFor(planet)` + `RULERSHIP_SIGNS` in `BodyPlacementEngine` resolve each fork's body-zone home from the traditional-rulership sign(s) via the existing `signBodyRulershipLibrary` canon (Saturn→Capricorn knees; Mars→Aries head; Venus→Taurus+Libra throat/kidneys; Earth forks→whole-field). Independent of chakra.
- **Two addresses made explicit on the placement:** `ForkPlacement` now carries `chakraAddress` (the fork's TRUE chakra — only the 7 chakra forks; null for Extended) **distinct from** the existing `chakraOverlay` (the energetic sign hint). Body-zone regions remain the calibration address for all 12.
- **Chakra work draws only the 7**, calibration draws all 12 — and the engine's 12-fork scoring (natal+transit+symptom+opposition) is untouched: a session is never silently reduced to 7. The chakra ladder is a capability *within* the 12.
- `tsc` 0 · build green.

---

## FIX G — Delivery modes: contact vs off-body sweep
- **Engine:** new `DeliveryMode = 'contact' | 'sweep'` + `SweepPath` + `deliveryModeFor(planet, regions)` in `BodyPlacementEngine`. `ForkPlacement` now carries `mode` + optional `sweep`.
- **Rule:** any intimate/reproductive-adjacent region (`pelvis, sacral, reproductive_field, elimination_field, root` — mirrors `bodySystems/reproductive.json`) → **sweep**, never contact.
- **Pluto hardcoded:** always off-body, ~6" above, **sweeping from the sacral downward** (`from: sacral → to: thighs`, "Never touching."), regardless of how it was placed.
- **Render (`ChamberBodyMap`, used by Combined view too):** contact = solid on-body point ("Contact placement"); sweep = a **hollow dashed ring** held above the body + a **directional dashed arrow** for the path, captioned "Off-body sweep · no contact" + the sweep instruction. No fork ever draws a contact point on an intimate zone. Body-map preference (Female/Male/Prefer-not-to-say) governs the silhouette only — never intimacy.
- Compliance: sweep copy stays energetic/wellness ("calibrating the field", "no contact"), no therapeutic claim.
- `tsc` 0 · build green.

---

## FIX H — Multi-station emit per fork (integrate, never substitute)
- **New `resolveForkStations(input): ForkStationSet`** in `BodyPlacementEngine` — an **ordered station array** per fork:
  1. **HOME (always)** — the planet's rulership body zone (`bodyZoneHomeFor`, FIX F).
  2. **NATAL (conditional)** — added only when the natal sign ≠ the planet's rulership sign(s); zone read from `signBodyRulershipLibrary` (existing canon — not invented). Home first, then natal.
  3. **SYMPTOM (conditional, held longer, `holdWeight 1.6`)** — added only when a reported symptom lands in a zone this fork governs (home ∪ natal regions).
- Each station carries its own delivery `mode`/`sweep` (FIX G) and a `holdWeight` (feeds FIX I timing).
- Added a `shoulder` entry to the symptom-zone library so shoulder complaints route (region `shoulders` already existed on the body map).

### Test outputs (traced from the canon; deterministic)
- **Saturn in Aries** → `resolveForkStations({ planet: 'Saturn', sign: 'Aries' })`:
  - HOME = Saturn rulership (Capricorn/Aquarius) → **knees / bones / joints** (anchor: knees).
  - NATAL = Aries ≠ Capricorn/Aquarius → **head / forehead / jaw** (anchor: head).
  - **stations = [ knees → head ]**, home then natal. ✅ (matches the directive's expected order)
- **Reported shoulder symptom + Mercury** → Mercury HOME (Gemini/Virgo) governs `shoulders`; the `shoulder` symptom overlaps → **a Shoulders/arms station is appended, held longer (1.6×)**. ✅
- **Open data gap:** none — all 12 signs are defined in `signBodyRulershipLibrary`, so no natal-sign body zone is undefined.
- Live end-to-end capture (real natal in the running app) → SHA's on-device pass; the above is the canon-derived trace.
- `tsc` 0 · build green. (Consumed for timing in FIX I.)

---

## FIX I — Placement-driven Chamber timing, container-capped
- **Engine `src/lib/chamber/stationTiming.ts`** (pure, no imports → unit-testable): `planSession(forks, containerSec, mode)`. A fork's segment = sum of its station holds (`BASE_STATION_SEC=90 × holdWeight`; symptom stations 1.6×). Sequence order preserved (forkRite stays the sequence authority).
- **Container hard cap, DEFAULT = `priorityCap`:** keep the highest-weighted forks/stations at FULL hold until the container fills, **drop the lowest-weighted overflow** (depth over breadth). **SHA override** = `proportionalCompress` (scale every hold). Flag `containerFitMode` in the store (default `priorityCap`, persisted) + a **Settings → "Session Fit"** toggle (Depth / Breadth).
- **Timing traces (executed):**
  - **LIGHT chart** (3 home-only forks, 15-min/900s container): natural **270s ≤ 900** → full holds, **0 dropped** → `Mercury@0+90 · Saturn@90+90 · Moon@180+90`. Fills well under the cap. ✅
  - **HEAVY chart** (7 forks, Mercury w/ home+natal+symptom, etc.; natural **1224s**, 900s container, priorityCap): capped to **864s ≤ 900**, **4 lowest-weighted stations dropped** (Jupiter/Moon×2/Pluto), **full holds kept** on Mercury (incl. its 1.6× symptom station), Mars, Saturn, Venus. Never exceeds the container. ✅
  - **HEAVY · proportionalCompress:** 898s, **0 dropped**, every hold scaled. ✅
- **Containers (`durationPresets` 15/30/60) remain hard caps** — a heavily-aspected chart can never blow past its chosen length.
- **Chamber-consumption seam (the one live-wiring point, flagged for SHA's on-device pass):** the engine + flag + traces are installed and proven; wiring the Chamber's phase-advance to step through `planSession`'s station timeline (vs the current fixed phase slices) is the final integration. Left for on-device iteration rather than a blind rewrite of the live timing UI (consistent with the project's "SHA is the visual/timing gate" rule). The deterministic core is done and tested.
- `tsc` 0 · build green.

---

# ASTRYX — Directive v2.0 — ✅ ALL FIXES COMPLETE — 2026-06-21

**FIX A–I done.** `npx tsc --noEmit` = **0** · `npm run build` = **green** throughout. **NOT deployed** — handed back for SHA review.

## Final 12-fork set (two classes)
**7 Chakra forks** (chakra address + body-zone home; Cousto identity, Solfeggio fallback):
| Fork | Cousto Hz | Chakra | Solfeggio fallback |
|---|---|---|---|
| Earth Day | 194.18 | Root | 396 |
| Full Moon (=Moon) | 210.42 | Sacral | 417 |
| Sun | 126.22 | Solar Plexus | 528 |
| Venus | 221.23 | Heart | 639 |
| Mercury | 141.27 | Throat | 741 |
| Neptune | 211.44 | Third Eye | 852 |
| Jupiter | 183.58 | Crown | 963 |

**5 Extended forks** (body-zone home only — Cousto-only, no chakra):
| Fork | Cousto Hz | Body-zone home | Delivery |
|---|---|---|---|
| Earth Year | 136.10 | Whole-field / OM / ground | contact |
| Mars | 144.72 | Head + adrenals (Aries) | contact |
| Saturn | 147.85 | Knees / bones / joints (Capricorn) | contact |
| Uranus | 207.36 | Ankles / nervous system (Aquarius) | contact |
| Pluto | 140.25 | Pelvic (Scorpio) | **off-body sacral-down sweep** |

**Retired:** Platonic Year (172.06) — not a fork; repurposed as audio ambient (FIX D).

## Open data gaps / decisions for SHA (never guessed)
- **D3 (v1):** counterweight pairing confirm (Saturn→Venus/Jupiter, Mercury→Saturn/Moon per canon vs the directive examples).
- **No natal-sign body-zone gaps** — all 12 signs defined in `signBodyRulershipLibrary`.
- **Chamber timing live-wiring** — step the phase-advance through `planSession` (engine + flag installed; integration is the on-device point).

## Action items for SHA (cannot be fixed in code)
1. **Physical fork manufacturing spec → 12** (no Platonic Year fork).
2. **Solfeggio fork set** = a separate future-run product (the `solfeggioFallback` seam is ready).

## Do NOT deploy — hand back for SHA to review and drive.

---
