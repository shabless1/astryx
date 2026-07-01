# ASTRYX — Cowork QA Findings · 2026-06-28
### Pressure-test against `COWORK_QA_BRIEF_2026-06-25.md` · code-grounded pass

> **Method note (honest boundary):** the live preview's heavy chamber animation
> froze the browser channel repeatedly, so I pivoted from clicking the UI to
> **reading the actual source** — freeze-proof and more rigorous for selection
> logic. This verifies the **wiring** (what resolves to what). It does **NOT**
> verify the **sound** — whether MARS_EXC actually plays cooling, whether the
> regulator tracks land, whether phase transitions are smooth. **That by-ear pass
> is SHA's, on her device.** I'm flagging that line clearly, not papering over it.

---

## VERDICT: No P0 / code bugs found on the two priority systems. Both A and B are correctly wired.

The freshest, highest-risk code (the rewritten song engine + Earth bookends) holds
up under inspection. The only open items are two quick **DATA** verifications SHA
can do by ear, plus the by-ear experience pass itself.

---

## A — Recalibration song-selection engine ✅ WIRED CORRECTLY

**A1. Overstimulated → counterweights (the big one).** PASS.
`lib/chamber/forkRite.ts → resolvePlanets()`:
`overstimulated = dominant_state === 'excess' || 'blocked'`. When true,
`primary = reg0`, `regulator = reg1` (the two regulator planets), and the loud
signal planet is **never** assigned to a phase. Deficiency/balanced →
`primary = signalPrimary` (the planet itself). So Mars-excess leads with Moon +
Venus + Saturn, Mars stays silent — exactly the brief's requirement.

**A2. Songs match the fork per phase.** PASS.
`SoundEngineController.tsx:134` — `activePlanet = currentForkPlanet ?? primaryPlanet`
drives track resolution, accent color, and label. As phases advance,
`currentForkPlanet` changes → the song re-resolves to the current fork's planet.
No track plays through a phase it doesn't belong to.

**A3. Repeated fork → different variant.** PASS (with a DATA caveat, below).
`SoundEngineController.tsx:148-160` — `visitsRef` increments on each new visit to a
planet/state key; `rotShift = visits + skips`; `autoFile = versions[(base+rotShift) % len]`.
Second visit to the same planet/state advances one variant.

> ⚠ **DATA/CONTENT note (not a code bug):** the *seed* catalog has single-track
> pools — **Moon-blk = 1 track, Venus-def = 1 track.** For those states the
> rotation has nothing to rotate to and will replay the same file. The runtime R2
> manifest (`/api/catalog`) is supposed to widen every pool, so this likely
> self-heals live — **but confirm against the live manifest** that no
> primary/regulator state is stuck at one track.

---

## B — Earth bookends ✅ WIRED CORRECTLY

`SessionScreen.tsx:312-315`:
```
audioForkPlanet = stepIdx === 0 ? 'earthday'
                : isClosingStep   ? 'earthyear'
                : currentForkPlanet
```
- **Opens Earth Day** — first step (Opening Ground) → `earthday`. PASS.
- **Closes Earth Year** — `isClosingStep` (earthClose / silentIntegration / last
  integration) → `earthyear`. PASS.
- **Audio-only** — the on-screen visual stays the phase's own planet; only the
  track is overridden. PASS (matches brief).
- **Earth default = 1st track** — `SoundEngineController.tsx:156` `isEarthLayer` →
  `variantBase = 0`. PASS.
- **Filename spaces** — `earthyear` files are literally `Earth Year`, `Earth Year 2`.
  `buildTrackUrl` runs `encodeURIComponent` → `Earth%20Year%202.mp3`. The space
  fragility is already handled — **no 404 from naming.** PASS.

> ⚠ **DATA dependency (brief's known caveat):** bookends still require the R2 files
> to exist. The catalog comment says "Verified live in R2 2026-06-28." **Quick
> by-ear confirm:** start any session — do you hear Earth Day at the open and Earth
> Year at the close? If either is silent/"unavailable," it's a missing-file DATA
> gap, not code.

---

## Regression / safety surface ✅ all wired

- **Audio-bleed:** robust. `SoundEngineController.tsx:231` panicStops on chamber
  unmount; `app/page.tsx:223-231` panicStops on **every** screen change + a global
  handler. `audioSession.claim()` stops the prior source before a new one starts.
  Switching visual modes doesn't change source → no restart/duplicate. Leaving the
  chamber kills all audio.
- **Body-map play-tones:** one-at-a-time enforced via the single `audioSession`
  owner (`claim('chakraTone')` stops the prior tone). `BodyMap.tsx:650-653` — a
  `useEffect` cleanup keyed on `panelKey` calls `stopPureTone()` when the target
  changes **or the panel closes.** Tap-same-to-stop, tap-different-to-switch. PASS.
- **Compliance:** micro-disclaimer `ⓘ Reference tool · Not medical advice` present
  across Intake, Dashboard cards, Chart, Body Systems, Post-Session. **Malachite**
  shows `⚠ POLISHED/SEALED ONLY` red flag (`NatalChartWheel.tsx:597`,
  `PractitionerLensContent.tsx:195`, `PostSessionSummary.tsx:733`). Crisis gate
  lives in `lib/compliance.ts` + `sovereignAstryx.ts` + `DailyCheckInScreen` +
  `TeacherChat`. PASS.

---

## NOT verified in this pass (be honest about scope)
- **The actual sound / felt experience** — impossible for me; SHA's by-ear pass.
- **7 dashboard tabs, Solar Chart label, new-day vs same-day landing, Ask Astryx
  depth** — display/lower-risk; not exhaustively walked. Ask-Astryx depth is a
  KNOWN GAP per the brief, not a regression. I concentrated the freeze-proof
  inspection where real bugs hide: the audio selection engine + safety gates.

---

## SHA's action items (all quick, all by ear)
1. Run **one excess/blocked chart** and **one deficiency chart**. Confirm the
   excess session leads with the regulators (and the loud planet never plays), and
   the deficiency session draws on the primary. *This is the one test only you can
   run.*
2. Confirm **Earth Day opens / Earth Year closes** audibly.
3. Glance at the **live `/api/catalog`** (or just listen) to confirm no
   primary/regulator state is stuck on a single track (Moon-blk, Venus-def).

---

## What the "next directive" should be
There are **no bug-fixes to direct** from this pass — A and B passed. So the next
Claude Code directive is the **next build**, not a repair. Per our prior design
session, that's the **full-spectrum default session** (feet-up Pisces→Aries sweep,
all forks, breathwork bookends now with optional Earth Day/Year tone underneath,
EDR/EYR forks layering in with the future 12-fork set). Hold for SHA's by-ear pass
first — if it surfaces a real break, that goes in the directive too.
