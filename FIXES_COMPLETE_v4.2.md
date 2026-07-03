# FIXES_COMPLETE_v4.2 — Restore the Planetary Spine (hotfix)
*Completed 2026-07-02 · repo main · gates green: `npm test` 4/4 (+1 manual skipped) · `tsc --noEmit` 0 · `npm run build` green. No deploy (Vercel pause — owner's step).*

## The actual root cause (differs from the working theory — evidence below)

The five "missed" keys were **never missing**: the repro HEAD-checks every one of them
(saturn/nat/SATURN_NAT_03b, mars/nat/MARS_NAT_01, neptune/def/NEPTUNE_DEF_02,
venus/nat/VENUS_NAT_02b, earthyear "Earth Year 3") → **HTTP 200 against the live
bucket**, and the requested-vs-manifest dump shows every requested key present in
catalog.json, variant suffixes included.

What actually happened — a **self-inflicted error cascade** in the audio layer:
1. `astryxPlayer._kill()` disposes an element by setting `src = ''` — which fires the
   element's still-attached `error` listener → the GLOBAL `hasError` flag flipped on
   every ordinary crossfade teardown.
2. The v4.1 fallback effect reacted to that bare flag. By the time it ran, the NEXT
   file was already selected — so it marked a perfectly good track "tried," skipped,
   killed that probe (another spurious error), and cascaded through the entire pool →
   planet NAT → **Earth Day**, phase after phase, in milliseconds. Hence
   Earth→Earth→Earth→Earth→Earth→Earth with 5 warn lines naming healthy files.

## FIX 2 (the load-bearing one) — URL-attributed errors ✅
- `astryxPlayer`: disposed elements are muted (`__disposed` guard — teardown can
  never set the flag); only the live pipeline (current element or buffering probe)
  may set `_error`; new `getErrorUrl()` records WHICH URL failed; every
  canplay/playing clears both.
- `SoundEngineController`: the fallback effect and the `errored` state now require
  `getErrorUrl() === selectedUrl` — the controller reacts only when **its own
  currently selected track** failed. A stale flag can no longer skip anything.
- **Honest banner:** "This track isn't available yet" renders only when literally
  nothing plays AND our own track failed. When the fallback engages over working
  audio, the banner names what IS playing: *"Rerouted — now playing {Planet · State ·
  Variant}."* The fallback chain (pool → planet NAT → Earth Day) stays as the
  last-resort net, exactly as directed — it just can't be triggered by ghosts now.

## FIX 1 — Key reconciliation ✅
- **Canonical key:** `planet/state/STEM` — lowercase planet (via `normalizePlanetKey`,
  which owns the "Full Moon"→`moon` mapping), lowercase state, STEM verbatim
  (uppercase, variant suffixes like `_03b` carried by BOTH sides). Defined and
  documented at **`normalizeTrackKey()`** in `astryxAudioLibrary.ts`; the manifest
  generator (`scripts/generate-catalog-manifest.mjs`) documents lockstep with it.
  Controller override keys + warn lines now route through the normalizer.
- **Both sides dumped** for the Smoke Test chart (the manual repro now prints
  requested-vs-manifest per phase and FAILS on any absent key): all requested keys ∈
  manifest, all URLs 200, **middle four phases resolve their own planets** (planet ≠
  earthday). `earthyear` is seed-only by design (legacy space-named files, no state
  subfolder — buildTrackUrl special case, documented).
- **Variant suffixes reconciled by construction:** the manifest is generated from the
  bucket inventory, which carries the same stems the selector requests.
- catalog.json regenerated → **zero diff** (keys were already canonical);
  `SUNO_LIBRARY/catalog.json` refreshed. R2 root upload still requires an R2 token
  (none exists — same constraint documented in v4.0); the bundled manifest serves
  identical content through `/api/catalog` meanwhile.
- The "capitalized `Neptune/nat/`" sighting: display/log strings carried the
  capitalized planet name while URLs were always lowercased — cosmetic, now unified
  through the normalizer so logs and URLs speak one format.

## FIX 3 — Stale baked copy ✅
Chose **derive-at-render** (no copyVersion machinery needed): new
`freshTransitInterpretation()` export in `engine.ts` resolves transit display copy
from the CURRENT data files at render, falling back to the baked text. All four
transit display surfaces converted: DashboardScreen (Today's Pulse list),
ExploreDeeperCards, HomeScreen transit cards, PractitionerLensContent headline.
Pre-deploy users see compliance/register-current copy on next render — no
regeneration. The persisted deterministic core (signal, sequence, frequencies,
protocol JSON) is untouched; the engine still bakes interpretation for PDF/history
consumers.

## Acceptance status
- Requested-key trace: middle four phases ≠ earthday, all keys in manifest, all 200 ✓
  (manual repro, `ASTRYX_MANUAL_REPRO=1`).
- Determinism: selection is seed-modulo over a deterministic pool; the fallback chain
  is a fixed mapping — golden tests green twice, no randomness introduced ✓.
- Zero `[chamber-audio]` warns + banner behavior during a LIVE full session: verify in
  cowork's browser run on the restarted dev server (the cascade trigger — teardown
  errors — is eliminated at the source).

*Dev server restarted (detached) on localhost:3000 for verification.*
