# ASTRYX — Session Handoff for Final Testing
### 2026-06-16 · for the next Claude Code · pass to test + tweak before launch

**Live:** https://n-pi-jet.vercel.app · latest deploy **`astryx-8s8d4doxs`**
**Read first:** this file → `FIXES_COMPLETE.md` (newest-first change log) → `COMPLIANCE.md` → `CLAUDE.md`.
Companion docs: `ASTRYX_CHART_VALIDATION.md`, `ASTRYX_QA_CHECKLIST.md`, `ASTRYX_USER_MANUAL.md`.

---

## ENVIRONMENT / WORKFLOW (save yourself the pain)
- **No git repo.** Deploy straight from the folder: `vercel --prod --yes` (authed as `shabless1`). Document results in `FIXES_COMPLETE.md`.
- **Windows + OneDrive path with spaces.** Before every dev/build: `powershell.exe -NoProfile -Command "Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue"`. Python is NOT installed — use Node.
- **Gate every deploy:** `npx tsc --noEmit` → 0, then `npm run build` → ✓ 9/9 pages, then deploy.
- **Preview MCP can't spawn a dev server from this path.** For engine/logic checks, run `npm run dev` via Bash (backgrounded) + curl a temp `/api/vtest` route, then DELETE it before deploy. **Audio + visual + mobile can only be confirmed on a real device** — that's the gap that needs human testing.
- **Stale `.next/types` gotcha:** after deleting a temp route, `tsc` may error on a cached `.next/types/...vtest` file — `rm -rf .next` and re-run; it's not a real error.

## NON-NEGOTIABLE LAWS (carry on every change)
1. **Determinism** — no `Math.random` in chart/protocol/audio/placement selection. Same inputs = same output.
2. **No medical claims** — probabilistic framing; honor `COMPLIANCE.md`. New softer wording must not become medical claims.
3. **`signalHierarchy.primary` is the ONE subject** — never recompute a separate "dominant."
4. **Never amplify** — correction governs sound/scent/taste/body/sight/placement.
5. **Audio is chamber + Music-tab ONLY**, exactly one source at a time. Everything routes through `audioSession` (`panicStop()` on every exit). The chamber is **music-only** (no Tone.js started).
6. **Forks are central/symbiotic** — never "you don't need forks." It's the **Resonance Fork**; the app guides its placement.
7. Naming: **Resonance Chamber** (never "pressure/convergence chamber"), **session** (never "rite"), **Calibration Insight** (never "diagnosis"), **5-Sense Calibration Plan** (never "prescriptions"), resonance state words (Amplified/Over-radiant/Compressed…) not "excess/running high."

---

## WHAT'S DONE & LIVE (do not regress)

### Audio (was the biggest pain — now solid)
- **`sunoPlayer.ts`** rewritten overlap-proof: tracks every `<audio>` element, cross-fades hard-dispose old ones via a guaranteed `setTimeout` backstop, `stop()` disposes ALL. No more stacking/ghost audio.
- **`lib/audioSession.ts`** — single `AudioSessionManager` (`claim(source)`/`panicStop()`/`stopAll()`), wired to every screen change (`page.tsx`), Stop, Exit, unmount, and `pagehide`.
- **Chamber player (`SoundEngineController.tsx`) v4** is the single audio owner: **nothing plays until Play**; full transport (play/pause · stop · volume/mute · seek scrubber · ◄◄/►► version cycle · ↺ replay); **Default vs Customize** song choice persisted; **minimize ▾/▴** so it doesn't cover the body map.

### Chamber session (FIX 1 + reorg)
- **Timer + rite are ONE unit:** `chamberRunning` flag — the clock + fork progression run ONLY after Play; Pause freezes both; Exit/Stop end it. Individual hides the count-up clock; Practitioner keeps it.
- **Sweep step removed** (it rendered an empty "supporting seven" screen). Individual session = open → 3 main forks → close; Practitioner = open → all supporting → mains → close.
- **Body map LEADS each fork step** (see below).

### Results (Individual Lite vs Practitioner Full)
- **`ResultsScreen.tsx`**: Individual lands on the **"Today's Resonance"** signal card (Appendix A spec: Frequency Signal → Planetary Carrier → Calibration Response → Fork Sequence → Why → Five Small Things → Ask Astryx). Full report (Calibration Insight, Cosmic Weather, Symptom Routing, Mineral, 5-Sense Plan, full chart) is collapsed behind **"Explore Deeper."** Practitioner sees everything.
- **Exactly ONE Enter Chamber, at the very END** of the report (`#chamber-entry`). No chamber button on the card.
- **No audio anywhere on Results** (transit cards = info + "strike your {planet} fork ~5 min").
- **`signalCopy.ts`** — the 40-line Why matrix (10 planets × 4 states; SHA's 10 approved verbatim) + resonance state vocabulary.

### Body map system (the latest directive)
- **Intake** has a **Body Map Selection** field (Female / Male / Prefer not to say → `IntakeData.bodyMapType`).
- **4 unified maps LIVE** at `public/images/bodymaps/{male,female}-{anterior,posterior}.png` (male-posterior style). Used by the chamber AND the deep Body Grid.
- **`BodyPlacementEngine.ts`** — ranked placement (symptom → SIGN body field → planet → chakra → house → signal state) → primary/secondary placement, chakra overlay, anterior/posterior view, application style, and a "Why." Pulls each fork planet's natal sign+house from the chart.
- **`ChamberBodyMap.tsx`** — instructional map that leads each fork step: glowing placement zone + chakra overlay + Front/Back toggle + Placement label + How + Why.
- **Deep Body Grid (`BodyMap.tsx`)** chakras repositioned (crown above head … root beneath the pelvic bone, root distinct from sacral) and enlarged.

### Intake / persistence / misc
- **I.1 balance signal:** per-planet "This feels balanced & strong" toggle → `resourcedPlanets`; the polarity engine treats them as resources (prefers them as regulators), never deficits. **Verified.**
- **Persistence:** active reading (`protocol`/`chartData`/`accentColor`) + History persist across reload; History writes on generation.
- **First-run orientation** card on intake; **Solar Chart** mode clearly qualified (sign insights useful, houses/angles less precise).
- **Version** single-sourced (`lib/version.ts` = 1.4.0). **Logo** = top-left, `astryx logo no background.png`.
- **Music Library tab** — browse full catalog (human "Planet · State · Variant" names), favorites, build-your-own sequences; persisted.
- **Manifest:** app fetches `/api/catalog` (a same-origin proxy → R2 `catalog.json`) and merges over the seed catalog. ⚠️ `catalog.json` is NOT in the bucket yet → library grows once SHA uploads it; until then the 172-track seed is the pool (works fine).

### Chart accuracy
- **Validated** (`ASTRYX_CHART_VALIDATION.md`): 10 charts 1955–2026, Sun signs 10/10, Saturn signs match ingress history, **no false Saturn Return** (the 1957 concern does not reproduce). SHA says accuracy is fixed — **do not re-touch the math.**

---

## WHAT NEEDS TESTING + TWEAKS (the to-do for the next session)

### A · Device QA (can't be done headlessly — highest priority)
Run `ASTRYX_QA_CHECKLIST.md` on iPhone Safari/Chrome, Android Chrome, tablet. Confirm:
- Chamber: silent until Play; Pause freezes clock+audio+forks together; exactly one song at a time; minimize works; **no overlap / no ghost audio after exit**.
- Body map **leads** each fork step; the glow lands on the correct zone for the active planet; gender selection routes the right figure; Front/Back toggles.
- Individual sees only card + (collapsed) Explore Deeper + one Enter Chamber at the end; Practitioner sees full depth.
- Body Grid taps open the governance panel; chakra dots sit right on the new maps.
- No "rite", no "excess", no raw codes, logo correct, version 1.4.0.

### B · Likely tweaks
- **Placement/chakra anchor nudges** — the glow coordinates (`bodyMapAnchorLibrary` in `BodyPlacementEngine.ts`; `CHAKRAS` y-values in `BodyMap.tsx`) are best-estimate %s on the new art and may need a few-percent nudge. Quick to adjust.
- **Chamber-vs-end placement** — SHA's final call was ONE Enter Chamber at the END (this overrode the earlier "right after the first card"). Keep it at the end unless told otherwise.

### C · Open features not yet built (documented in FIXES_COMPLETE.md)
- **FIX 2** — per-track silent-file detection + guaranteed fallback tone (default volume already audible at 0.9).
- **FIX 3** — Light/color swatch in the in-chamber CLOSE step (the signal card already renders one).
- **FIX 4** — Results "blank black void" while scrolling: could NOT reproduce headlessly; suspect the expanded **See Why → ChartTabs** tall containers (NatalChartWheel/BodyMap). Needs in-browser repro.
- **FIX 8** — a dedicated "Prepare Your Resonance Chamber" screen (gather forks / set volume / Start) before entry; currently the Prepare card + in-chamber Play cover it.
- **FIX 9** — a compact one-line "Daily Cosmic Weather" summary for Lite (cosmic weather is currently just collapsed behind Explore Deeper).
- **FIX 13** — post-session **continuation card** (focus / fork sequence / tea / breath / color / next check-in).
- **Chart regression test** — turn `ASTRYX_CHART_VALIDATION.md` into a runnable harness so accuracy can't silently regress.
- **Deep-view wording** — the transit-protocol modal / practitioner detail still say "excess" in places; sweep them to resonance words (Lite is already clean).
- **`catalog.json` upload** to R2 so the music library grows monthly without a redeploy (generator: `scripts/generate-catalog-manifest.mjs`).

---

## KEY FILES MAP
- **Engine (deterministic):** `lib/engine.ts`, `lib/ephemeris.ts`, `lib/RemedyPolarityEngine.ts`, `app/api/chart/route.ts`
- **Signal copy / placement:** `lib/signalCopy.ts` (Why matrix), `lib/BodyPlacementEngine.ts` (fork placement), `lib/bodyMapPlacement.ts` (asset resolve)
- **Audio:** `lib/sunoPlayer.ts`, `lib/audioSession.ts`, `lib/sunoLibrary.ts`, `app/api/catalog/route.ts`, `components/engine/SoundEngineController.tsx`
- **Chamber:** `components/screens/SessionScreen.tsx`, `lib/chamber/forkRite.ts`, `lib/chamber/ChamberDNAEngine.ts`, `components/engine/ChamberBodyMap.tsx`
- **Screens:** `ResultsScreen.tsx`, `IntakeScreen.tsx`, `MusicLibraryScreen.tsx`, `engine/BodyMap.tsx`, `layout/NavBar.tsx`
- **State:** `lib/store.ts` (Zustand, persisted), `lib/version.ts`
- **Assets:** `public/images/bodymaps/` (4 unified maps), `public/images/astryx logo no background.png`

*The individual should feel guided; the practitioner fully equipped. Reorganize the gold — don't melt it down.*
