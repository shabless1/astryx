# ASTRYX — FIXES COMPLETE v4.4
## Session Navigation Redesign · Astryx-as-Operator · v4.3.1 Defect Fixes
**Date:** 2026-07-03 · **Branch:** main · **Status:** all gates green, verified in browser

---

## FIX 1 — Dashboard Session Launcher ✅

**The discoverability fix.** Three always-visible session tiles now sit directly under the
Daily Check-In header, ABOVE the tab nav — so they render on every dashboard tab
(Check-In, Today's Pulse, and all the rest), above the fold. Verified on both tabs.

| Tile | Copy | Launch |
|------|------|--------|
| **Today's Calibration →** | "Tuned to your chart and today's sky" + live chip (e.g. "Sun-led today", colored by the fork's planet) | `#session/custom` |
| **Full Body →** | "All twelve forks, ground to crown and back" + "12 forks · ~35 min" | `#session/full-body` |
| **Chakra →** | "Seven centers, root to crown" + Solfeggio/Planetary toggle ON the tile | `#session/chakra-{instrument}` |

- Tiles launch **directly** — never through the picker. One tap from the dashboard.
- The chakra toggle updates the remembered instrument (`chakraInstrument` store) without
  launching (stopPropagation) — verified in browser.
- Mobile: `grid-cols-1 sm:grid-cols-3` — tiles stack vertically.
- **Nav rename:** CHAMBER → **SESSIONS** ([NavBar.tsx](src/components/layout/NavBar.tsx)).
  The picker landing keeps its "Choose your session" title; "Chamber" remains the name of
  the in-session environment only.
- **Resume card names its mode** (Fix 1.5): "Resume Full Body Recalibration? · …" /
  "Resume Chakra Recalibration? · …" via `RESUME_MODE_LABEL[interruptedSession.mode]`.

### Deep-link vocabulary (the ONE routing language)
`#session/custom` · `#session/full-body` · `#session/chakra-planetary` ·
`#session/chakra-solfeggio` — used identically by the tiles, the deep-link shim,
the hash-sync (the URL now names the ACTIVE mode), and Astryx's action buttons.

### Bonus fix found during verification — deep-link vs. async rehydration
zustand v4 persist rehydrates **asynchronously**. The deep-link mount effect used to fire
against default state, and the mid-flow merge then landed after it and clobbered its
writes — observed live: a cold `#session/chakra-planetary` silently **resumed an
interrupted Full Body ladder** instead. The effect now defers routing until
`useAppStore.persist.hasHydrated()` / `onFinishHydration`, and `handleSessionAction` /
`beginSession` read `protocol` from `getState()` (the mount closure predates hydration).
Re-verified: cold chakra deep-link over an interrupted full-body session now opens the
chakra flow at Opening Ground.

## FIX 2 — Astryx Sets Up the Chamber ✅

- **[src/lib/astryx/actions.ts](src/lib/astryx/actions.ts)** — `deriveAstryxActions(message, report)`:
  pure, deterministic, LLM-free. Keyword intent (transits/today/session/calibrate/full body/
  chakra/solfeggio) + the engine's already-computed daily state → `{label, sessionHash,
  context}[]`. The daily lead planet comes from the report (headline transit → signal
  hierarchy → dominant pattern), never from the LLM.
- **/api/astryx** returns the `actions` array alongside the reply (server-derived, step 6).
- **TeacherChat** renders each action as a prominent gradient button card under the reply
  ("Begin today's calibration → / Sun-led · tuned to today's sky"). Tap → chat closes →
  `handleSessionAction(sessionHash)` — the chamber opens exactly as from a dashboard tile.
- **Check-in gate preserved:** a stale-day custom action routes to the Dashboard's
  Check-In tab first — the deterministic pipeline is never skipped.
- **Offline sovereign fallback** derives actions with the SAME function on the client
  (`runLocal`) — identical buttons on preview deployments; crisis turns suppress actions.
- **Canon updated:** `app-astryx-sets-up-chamber` entry in appKnowledge.json →
  `build:canon` → **651 chunks**. Astryx now says she can set up the chamber and that
  she never computes the session — the engine does.

**Browser-verified:** "what are today's transits and what should I do?" → grounded reply +
"Begin today's calibration → Sun-led · tuned to today's sky" button → chat closed,
`#session/custom`, calibrated chamber open.

## FIX 3 — v4.3.1 defects ✅

1. **Natal overlay leak in Full Body** — ladder rungs passed `resolvePlacement(planet)`
   with no sign override, so the user's natal orb/labels/how-to leaked in. The
   SequenceStepCard call site now builds mode-aware placement: canonical sessions get the
   rung's own region as `primaryLabel`, `natalPlacement.sameAsTraditional: true` (hides
   every natal affordance), the step's own purpose as the how-line, and a mode-true
   why-line ("The ladder places every body the same way — traditional territory, rung by
   rung."). Calibrated Session behavior untouched.
   **Verified:** Saturn rung shows Knees on the card, body map, and how-to box; zero
   natal labels anywhere in the mode.
2. **Chakra Root recycled the Opening Ground copy** — Root (planet Earth, fork null) fell
   into the hardcoded Earth-Om grounding block. `signalFork` steps now get their own
   center block: placement box, Hz, HOLD, and the strike cue ("The tone also plays from
   the chamber — sound your own fork here if you hold one, or simply receive.").
   **Verified:** step 2/17 reads "Ascent · Root — sound the Earth Day fork at the base of
   the spine — let the root center receive it." No duplicate ground card.
3. **Grammar** — "at the below the navel" → "point just below the navel"; "at the between
   the brows" → "point between the brows". All chakra + ladder placement strings proofread.
   **Verified:** Sacral step reads "at the point just below the navel".

## Tests & gates

| Gate | Result |
|------|--------|
| `tests/actions.golden.test.ts` (NEW) | ✅ 7 tests — byte-identical determinism, snapshot, all intents, fallback chain, no-action turns |
| `tests/chakra.golden.test.ts` | ✅ snapshots deliberately regenerated (`-u`) for the corrected bodyPoint strings |
| Full suite `npm test -- --run` | ✅ 19 passed, 1 skipped (manual repro harness) |
| `lint:copy` | ✅ zero banned phrases, 100 pairs × 6 lenses |
| `lint:determinism` | ✅ |
| `tsc --noEmit` | ✅ 0 errors (also caught a real TDZ: `sessionMode` read in the hash-sync deps before declaration — hoisted) |
| `npm run build` | ✅ green (prisma + lints + tests + next build) |
| Browser | ✅ all acceptance walks above; zero `[chamber-audio]` warns in console across mode navigation |

## Files touched
- `src/components/screens/DashboardScreen.tsx` — SessionLauncher (3 tiles + toggle), resume mode label
- `src/components/layout/NavBar.tsx` — CHAMBER → SESSIONS
- `src/app/page.tsx` — `handleSessionAction`, hydration-safe deep-link shim, mode-aware hash sync, wiring
- `src/lib/astryx/actions.ts` — NEW deterministic action generator
- `src/app/api/astryx/route.ts` — actions in the response envelope
- `src/components/teacher/TeacherChat.tsx` — action button cards + `onAction`
- `src/components/screens/SessionScreen.tsx` — Fix 3.1 placement override, Fix 3.2 center-step block
- `src/lib/chamber/forkRite.ts` — Fix 3.3 bodyPoint strings
- `src/data/appKnowledge.json` + `src/data/astryxCanon.json` — canon entry (651 chunks)
- `tests/actions.golden.test.ts` — NEW · `tests/__snapshots__/*` — chakra regen + actions snapshot

---
*Proprietary — Astryx / Cosmic Resonance System · SHA — Creations by Sacred Music. Lives in the project repo only.*
