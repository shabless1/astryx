# FIXES_COMPLETE_v4.1 — Copy Restoration & Register Pass · Resume Fix · Track Resolution
*Completed 2026-07-02 · repo main (post-v4.0) · all gates green. Deployment waits on the owner clearing the Vercel account pause — nothing was deployed.*

**Gates:** `npm run lint:copy` clean (banned phrases + full transit coverage) · `npm test -- --run` 4/4 green (snapshots regenerated ONCE, diff reviewed copy-only) · `npx tsc --noEmit` 0 · `npm run build` green.

---

## FIX 1 — Copy Restoration & Register Pass ✅

### Audit finding (the inventory, from `git diff bccb8b8..HEAD -- src/data`)
- **Reworded in v4.0:** 17 transit strings (in place). **Blanked in v4.0: ZERO** — nothing was erased.
- **Always empty:** the "naked" dashboard transits (Neptune□Jupiter, Jupiter☍Venus, Saturn□Neptune…) were pairs that NEVER had entries — the interpretation table covered only **35 of 100** emittable planet pairs. Emission space (ephemeris): 10 transiting × 10 natal × 6 aspects = 600 combos, pair-keyed lookup.
- **Bonus bug:** the Saturn-return entry was keyed `"Saturn (return)"` — the lookup matches `to === natalPlanet`, so it was **unreachable since it was written**. Re-keyed to `"Saturn"`.

### What was authored (counts)
- **65 new pair entries** (every missing pair) — each with a specific 1–2 sentence energy/texture/direction description + a `Support:` five-layers doorway (tone, fork, breath, tea, scent, movement, practice). No boilerplate; every line pair-specific.
- **4 register rewrites** of surviving entries, including the owner's target case:
  - Venus→Mars: *"Magnetic attraction spike. Sexual energy active."* → *"Magnetism runs high — creative and sensual current in the same channel, and both want expression."* Support: *"Give it somewhere to go — movement, creative work, connection with a partner."*
  - Mars→Moon and Moon→Mars (blunt "reactivity spike" lines) → boiling-water register; Saturn-return support turned into a doorway.
- **New `aspectLenses` block** (6 authored motion clauses — conjunction "Fused and immediate —", square "Under friction that wants movement —", etc.). `lookupTransitInterpretation` (engine.ts) now COMPOSES `{lens} {pairEffect}` — every pair × aspect renders copy specific to both dimensions. No proper-noun-leading effects (verified), so the lowercase join is safe.
- **11 stress-signature transmutations** in `medicalAstrology.json` (symptomSignatures feed the diagnostic + RAG canon): "cancer susceptibility (cell mutation theme)" → "the body's deepest renewal cycles asking for real attention"; "chronic depression with somatic signs" → "a long heaviness that settles into the body — cold extremities, heavy limbs"; diabetes/metabolic-syndrome/autoimmune/addiction/manic lines likewise transmuted. Energetic truth kept, pathology naming gone.
- **1 fork-data fix** (`sacredTones_nervousSystem.json` Mars clinicalNote): "clients with depression, chronic fatigue" → "clients in heavy, low-vitality states — flat mood, deep fatigue, disconnection from the body."

### Register decisions of note
- Engine **matching vocabularies were NOT touched** (`planet-intake-map` keywords, `qualityLexicon` match arrays, `remedyPolarity` indicators, symptom slugs): users type words like "depression" and the polarity engine must match them — the symptom-vocabulary bridge is load-bearing. Matching vocab ≠ display copy.
- "Cancer" hits in signs/symptoms data are the zodiac sign — untouched.
- Teas, cell salts, forks, crystals remain in Support lines — they are the app's own five-layer remedies, not supplements.

### Lint extension (erasure = build failure, permanently)
`scripts/lint-data-copy.mjs` now fails when ANY of the 100 pairs is missing or has an empty `effect`/`intervention`, or any of the 6 `aspectLenses` is missing/empty. Also fixed a `same\b` false positive in the supplement guard (meant SAMe).

### Snapshots
Regenerated once after all copy edits; diff reviewed: only `interpretation.effect/intervention/duration` fields changed (`undefined` → composed copy for previously-naked pairs; lens prefixes on existing pairs). No structural/frequency/sequence changes. `npm run build:canon` re-run → 646 chunks.

## FIX 2 — Resume Restores the Wrong Phase ✅

**Root cause:** the displayed phase derives from `effectiveTime = sessionTime − pausedTotal + skew`, and `pausedTotal`/`skew`/`pinned` are LOCAL component state — lost on reload. Raw `sessionTime` alone cannot recover the phase after any pause/skip/linger. Separately, the "Now" header used the audio fallback planet (`chamberDNA.primaryPlanet`) on no-fork steps — hence "Now · Mercury Fork" during Opening Ground.

**The resume-state shape (store, persisted):**
```ts
chamberPhase: { index, id /*PhaseRole*/, label, startSec, count } | null   // live pointer, written by SessionScreen on every phase change
interruptedSession: { screen, sessionTime, startedAt,
                      phaseIndex?, phaseId?, phaseLabel?, phaseStartSec?, phaseCount? }
```
- SessionScreen writes `chamberPhase` on every `stepIdx` change; the rehydrate `merge` override folds it into the resume pointer and then NULLS the live pointer (no leakage into the next run).
- **Resume** sets `sessionTime = phaseStartSec` — the deterministic timeline re-lands exactly on that phase (verified `sequenceStepAt` boundary: `t < startSec + holdSec`, inclusive at start). Phase-level accuracy by design: you resume at the top of the phase you were in.
- **One state, three displays:** the "Now" label, the `n / N` counter, and the phase title all derive from `current` (the active step). New `nowLabel`: fork steps → "{Planet} Fork", Earth steps → "Earth Tone", Silence → "Silence". The audio-follow ref (`currentForkPlanet`) is untouched — music behavior unchanged.
- **Start fresh** (`handleStartSession`) clears pointer + `chamberPhase`; exit and complete also clear it.
- Resume card now reads e.g. *"Resume your session? · Primary Signal · Saturn · Phase 2 of 6"*.

## FIX 3 — Track Resolution Miss ✅

**Reproduction (manual test `tests/_repro-fix3.test.ts`, run with `ASTRYX_MANUAL_REPRO=1`):** traced every phase of the Smoke Test chart (both a balanced/Sun profile and a Saturn-blocked profile) through the exact controller resolution chain, HEAD-checking each URL against the live bucket. **Every key resolved 200** — the key mapping itself is sound (the v4.0 probe had already confirmed all 176 catalog files live). The observed "isn't available" is the ERROR PATH, which had three real defects:
1. single-variant pools bailed out of auto-skip (`versions.length < 2` → dead slot),
2. the tried-set never reset — one transient network blip poisoned every later revisit of that planet/state for the whole session,
3. no fallback existed beyond the pool — exhaustion = dead music slot.

**Fixes:**
- **Deterministic fallback chain** in `SoundEngineController`: rotate within the pool while untried variants remain → pool exhausted: the planet's own **NAT** pool → **Earth Day** ground layer (fixed mapping, no randomness; the fallback failing escalates once to Earth Day). Sticky per phase key so selection can't flip back to the broken track; cleared on phase change (fresh phase, fresh chance). Every missed key is `console.warn`'d (`[chamber-audio] missed key …`). **The session never shows a dead music slot.**
- **Key convention documented + hardened** in `astryxAudioLibrary.ts`: keys are `{planet-lowercase}/{state}/{STEM}.mp3`; new `normalizePlanetKey()` owns the *"Full Moon" fork → `moon` folder* mapping (a latent 404: `'Full Moon'.toLowerCase()` = `'full moon'`, a folder that doesn't exist) — used by `versionsFor`, `selectTrackFilename`, `buildTrackUrl`. `earthyear`'s no-subfolder/space-names special case documented in the same block.
- The player's song label reflects the EFFECTIVE (possibly fallback) selection — labeled honestly.
- Determinism: base selection is seed-driven and untouched; the fallback chain is a fixed mapping — same chart + same failures → same tracks. Golden tests unchanged and green.

---

## Verification status
- Code-level verification complete (traces above, gates green). **Browser verification for cowork on the restarted dev server (localhost:3000):** dashboard transit list for the Smoke Test chart (b. 1990-01-15 15:42, New York) — every transit shows lens-composed description + Support; Venus→Mars in the new register; session → advance to phase 3 → reload → Resume lands on phase 3 with all three displays agreeing; full 6-phase run with zero "isn't available" and a clean warn log.

## Deviations from the directive
- "Pair × aspect" coverage is delivered as **100 authored pairs × 6 authored aspect lenses, composed at lookup** rather than 600 hand-written strings — every emittable combination renders copy specific to both its pair and its aspect motion, with no cross-pair boilerplate; the lint enforces both dimensions.
- The resume card shows the phase label + n/N (directive example format); the "phase 1 of 6" wording came from the interrupted phase pointer rather than the chamber conductor's internal PhaseId (that state machine is audio-envelope-scoped, not the fork-sequence scoping the user sees).

*Deployment: intentionally NOT attempted — Vercel account pause is the owner's step (billing banner → clear → Redeploy, or ask Claude to `vercel --prod --yes` after).*
