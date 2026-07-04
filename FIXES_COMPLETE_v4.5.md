# ASTRYX v4.5 — Chakra Session Redesign · FIXES COMPLETE

**Directive:** Chakra Session Redesign — Crown→Root→Crown traversal · Earth grounding close · chakra-color glow
**Base:** main @ `b1b26cb` (post-v4.4)
**Scope:** Chakra session mode only. Full Body, Calibrated, Full-Spectrum sessions untouched.

The owner's mandate (verbatim): *"The Chakra session sequence goes as follows: EARTH should have a breath count that relaxes the body, the body grid should show — not the Earth information card, that should be collapsible. Start from the Crown following the sequence down to the Root, back to the Crown, then end the session with the Earth grounding. The colors of each Chakra should glow and match the colors of the chakras (fork placement)."*

---

## What changed

### FIX 1 — Traversal order (the core change)
`buildChakraSequence()` in `src/lib/chamber/forkRite.ts` was rebuilt. The old shape
was *Opening Ground → 7 up (Root→Crown) → Crown Turn → 7 down → Earth Close* (17 steps).
The new shape is **16 steps**:

1. **Open · Centering** — a breath-only beat at the Crown, nothing struck (Earth Day audio underneath, as with every opening beat).
2. **Descent (Crown → Root)** — 7 centers struck: Crown → Third Eye → Throat → Heart → Solar Plexus → Sacral → Root.
3. **Ascent (Root → Crown)** — 7 centers struck (mirror): Root → Sacral → Solar Plexus → Heart → Throat → Third Eye → Crown.
4. **Close · Earth Grounding** — the final step (see FIX 2).

Per-center planet/tone mappings are unchanged (read from the data files). Only the
**order of traversal** changed. Both passes now strike (descent = first contact,
ascent = integrating return) — the old "lighter sweep" on the return is gone.
The Solfeggio ↔ Planetary toggle still drives which tone/fork is struck at each
center; the center **order is byte-identical for both instruments**.

### FIX 2 — The Earth grounding close (final step)
New `ChakraEarthClose` card (`SessionScreen.tsx`), rendered only for the chakra
`earthClose` step:
- **Relaxing 4-7-8 breath** — the existing `ELEMENT_BREATH.Water` pattern (inhale 4 · hold 7 · exhale 8), extended exhale to down-regulate. Breath-only; the Earth tone plays from the chamber (Earth Year audio), nothing struck.
- **Body grid is the primary rendered element** — the `ChamberBodyMap` body silhouette leads the card.
- **Earth information card is collapsed by default** — a `<details>` disclosure labelled *"Earth · why we ground →"*, expandable (the reverse of the old default).
- Distinct completion/integration copy — not a reuse of the Full Body ground-close string.

The reusable breath pacer was extracted as `BreathPacer` (shared by `BreathworkCard`
and `ChakraEarthClose`). `ChamberBodyMap`'s header now reads *"The body"* instead of
*"Where to hold the fork"* when `hideForkDot` is set (grounding/breath contexts).

### FIX 3 — Chakra-color glow at fork placement
Each struck center now carries its canonical chakra `color` (mirrored from the
`CHAKRAS` palette already shipped in `BodyMap.tsx`, so nothing conflicts):

| Center | Hex | | Center | Hex |
|---|---|---|---|---|
| Crown | `#B447FF` | | Solar Plexus | `#FFD600` |
| Third Eye | `#5B47FF` | | Sacral | `#FF8A1A` |
| Throat | `#1FB6FF` | | Root | `#FF3D5C` |
| Heart | `#43E66A` | | | |

The color rides on the `SequenceStep` (`centerColor`) so it is captured by the
golden snapshot and is deterministic per center. `SessionScreen` passes it as the
step accent → the `ChamberBodyMap` placement-marker aura + the step card accent
glow in the center's color. The **same center shows the same color on both the
descent and ascent pass** (color is a property of the center, not the direction).
No `Math.random` in the color path — the mapping is fixed data.

---

## Acceptance — verified

| # | Criterion | Result |
|---|---|---|
| 1 | Order: Open → Crown-down-to-Root (7) → Root-up-to-Crown (7) → Earth close; no center out of order | ✅ verified live (DOM walk of all 16 steps) |
| 2 | Earth step: body grid primary, Earth info collapsed-by-default & expandable, 4-7-8 breath runs, breath-only | ✅ verified live |
| 3 | Glow: every struck center glows its correct chakra color; same color both passes (Crown violet, Root red, …) | ✅ verified live (Crown `#B447FF` at steps 1 & 14; Root `#FF3D5C` at steps 7 & 8) |
| 4 | Toggle: Solfeggio ↔ Planetary switches the struck tone/fork; center order identical | ✅ golden test |
| 5 | Determinism: two identical runs → byte-identical step list; `lint:determinism` clean | ✅ golden test + eslint |
| 6 | Regressions: Full Body, Calibrated, launcher tiles, Astryx actions, deep-links unchanged & green | ✅ full suite + build green |
| 7 | Gates: chakra golden regenerated, `npm test` green, `lint:copy` clean, `tsc --noEmit` 0, production build green, zero `[chamber-audio]` warnings | ✅ all green |

**Verification checks run:**
- `tsc --noEmit` → 0 errors
- `vitest run` → 21 passed / 1 skipped (chakra golden snapshot regenerated for the intentional new sequence)
- `lint:copy` → zero banned-phrase findings
- `lint:determinism` → clean
- `next build` (production) → green, 11/11 static pages
- Live run of the chakra Planetary session in-browser → order, per-center glow colors, and Earth grounding close all confirmed; console clean (no `[chamber-audio]` warnings, no errors)

---

## Files touched
- `src/lib/chamber/forkRite.ts` — new traversal, `centerColor` on `SequenceStep`, `color` on `CHAKRA_CENTERS`, new weights
- `src/components/screens/SessionScreen.tsx` — `stepAccent` (chakra-color glow), `ChakraEarthClose`, `BreathPacer` extraction, chakra macro progress markers, breathwork/close routing, copy
- `src/components/engine/ChamberBodyMap.tsx` — `hideForkDot` header relabel
- `src/components/screens/DashboardScreen.tsx`, `SessionModePicker.tsx` — chakra tile/description copy updated to the new flow
- `tests/chakra.golden.test.ts` + `tests/__snapshots__/chakra.golden.test.ts.snap` — new 16-step shape, direction-aware frequency + color assertions

---

## Invariants held
- **Determinism** — same intake + instrument set → byte-identical step list, fork selection, audio. The chakra session is a fixed engine-driven sequence; the LLM never configures it.
- **Solfeggio / Planetary toggle** — works in the new sequence; same center order for both, only the struck tone/fork + displayed Hz differ per center.
- **Compliance voice** — new/edited strings use no named conditions and no supplement directives.
- **v4.4 regressions hold** — Full Body ladder, Calibrated Session, Sessions launcher + Astryx actions, and the `#session/chakra-planetary` / `#session/chakra-solfeggio` deep-links all unchanged and green.

---

## v4.5.1 — owner correction (fork placement + colors)

**Bug:** in the chakra session the body‑map orb was placing at the **fork planet's**
body zone (Crown = Jupiter → "the liver", at the hip) instead of the **chakra's own
fixed anatomical point.** Chakra placements are fixed per center — the same for
every fork (planetary or solfeggio) and every body.

**Fix:**
- New `chakraCenterPlacement(center)` in `BodyPlacementEngine.ts` — one orb at the
  chakra's fixed point, planet‑independent: Crown = top of the head · Third Eye =
  forehead · Throat = throat · Heart = center of the chest · Solar Plexus = upper
  abdomen · Sacral = lower abdomen · Root = base of the spine. `SessionScreen` routes
  every chakra center step through it (step card + body map + mandala/color views).
- `ChamberBodyMap` gains `chakraMode` → a clean single caption ("Crown · top of the
  head" · "Chakra placement · same for every body"), no Traditional/Natal framing.
- The APPLICATION line now references the chakra point ("sweeping over the top of the
  head"), never the fork's bone point ("the liver").
- **Colors corrected to the owner's spec:** Root red `#E53935` · Sacral orange
  `#FB8C00` · Solar Plexus yellow `#FDD835` · Heart green `#43A047` · Throat blue
  `#1E88E5` · Third Eye indigo `#3949AB` · **Crown white `#FFFFFF`.**

**Verified live (all 16 steps):** orb vertical position matches anatomy on both passes
(Crown 4% / top of head → Root 48% / base of spine), colors match the spec, caption is
clean, application line references the chakra point, no "liver" anywhere. `tsc` 0 ·
tests green · lint:copy + lint:determinism clean · production build green.

---
*Proprietary system architecture (Astryx / Cosmic Resonance System, SHA — Creations by Sacred Music).*
