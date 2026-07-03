# FIXES_COMPLETE_v4.3 — Full Body Recalibration (the 12-Fork Ladder)
*Completed 2026-07-03 · additive; the chart-driven Calibrated Session is untouched. Gates: tsc 0 · tests 7/7 (+1 manual skipped) · lint:copy clean · build green.*

## STEP 0 — The original spec WAS found
**`ASTRYX_DIRECTIVE_J_FULL_SPECTRUM_SESSION.md`** (2026-06-28, locked with SHA): the 10-fork feet-up Full-Spectrum Session — built and live — with the descending pass explicitly deferred: *"Reverse (head-down) sweep is Phase 2 — do not build it now."* v4.3 is that Phase 2. Honored from J: **modern rulerships** (locked ARCHITECT DECISION 2), **NAT tracks only** (attunement, never corrective), **Earth bookends**, **deterministic arithmetic timing**, no physical EDR/EYR forks in the sweep.

**Conflicts resolved (documented per v4.3):**
- *12 rungs vs J's de-duplicated 10:* v4.3 is the newer owner mandate → 12 rungs; Mercury (Virgo+Gemini) and Venus (Libra+Taurus) each sound twice, their track variant advancing deterministically on the second visit (session rotation).
- *"Data files win" vs modern rulers:* `signBodyZones.json` carries **traditional** rulers (Scorpio→Mars, Aquarius→Saturn, Pisces→Jupiter) for the counterweight engine. Body TERRITORIES follow the data file (they agree); FORK ASSIGNMENT follows J's locked modern-rulership decision — affirmed by v4.3's own table, and required for all ten planetary forks to appear. Documented at `FULL_BODY_LADDER` in `forkRite.ts`.

## The final ladder (feet → head; descent is the exact reverse)
| # | Sign | Territory (signBodyZones) | Fork |
|---|------|---------------------------|------|
| 1 | Pisces | Feet | Neptune |
| 2 | Aquarius | Ankles & calves | Uranus |
| 3 | Capricorn | Knees & bones | Saturn |
| 4 | Sagittarius | Hips & thighs | Jupiter |
| 5 | Scorpio | Pelvis & sacrum | Pluto |
| 6 | Libra | Lower back & kidneys | Venus |
| 7 | Virgo | Gut & digestion | Mercury |
| 8 | Leo | Heart & spine | Sun |
| 9 | Cancer | Chest & stomach | Moon |
| 10 | Gemini | Lungs, arms & hands | Mercury |
| 11 | Taurus | Neck & throat | Venus |
| 12 | Aries | Head & crown | Mars |

## What was built
- **`buildFullBodySequence({durationSec})`** (`forkRite.ts`) — 27 steps: Opening Ground → 12 ascending rungs → **Crown Turn** (held breath pause; previous planet's music keeps flowing) → 12 descending rungs → Earth Close. Pure function of duration; weights ground 3.0 ×2 / ascent 1.9 ×12 / turn 1.2 / descent 1.0 ×12 (descent = a lighter sweep, ~53% of an ascent hold). At the canonical 2100s (35 min): 150s grounds, 95s ascent rungs, 60s turn, 50s descent rungs; the close absorbs rounding so the timeline tiles exactly at ANY duration (golden-tested at 900/1800/2100/3600 — future Quick/Extended variants are a durationSec change; the app ships the canonical container).
- **`FULL_BODY` container** (`durationPresets.ts`, `fullBody: true`) — reuses the whole chamber stack: SoundEngineController (naturalOnly → every rung NAT), v4.2 normalized keys + fallback chain, body map, breath modules.
- **Canonical invariant:** one fixed DNA (seed 0) in Full Body mode → byte-identical rung order, placements, AND track selections for every user. Rungs place by the RUNG's sign territory (not the user's natal sign) via the existing BodyPlacementEngine. Each rung: fork name + Hz + placement instruction (voice-spec copy) + breath cue + per-planet music.
- **Mode picker** (`SessionModePicker`, screen `session-mode`) — two cards (Calibrated preselected) + "remember my choice" → Settings preference (Ask each time / Calibrated / Full Body). Wired at every session door: dashboard Begin, Results Enter Chamber, the Chamber nav tab (which no longer requires a reading — guests run Full Body directly; the Calibrated card routes to the scan). Same entitlement/trial gating as the rest of the app.
- **Persistence:** `interruptedSession.mode` — a Full Body ladder resumes as one, at the exact rung (v4.2 phase pointer). Guests get a Resume row in the picker (they have no Dashboard). Verified live: interrupted at Descent·Leo (19/27) → Resume → rung 19, `Now · Sun Fork`, card and macro-progress all agree.
- **Completion** writes a `ChamberSession` row (`kind: "full_body"`) via new `POST /api/sessions` (auth-guarded, fire-and-forget; the model existed since v4.0, this is its first writer).
- **Progress UI:** 27 per-step glyphs would be illegible → sequences >12 steps group into the four macro-phases (Ground · Ascent · Crown · Descent · Ground) under the fine-grained bar; the n/N counter carries the exact rung.
- **Fork ownership:** untouched — the existing per-fork "tone plays from the chamber" conversion line covers un-owned forks at every rung; no rung is ever skipped.
- **Canon:** 3 new `appKnowledge.json` entries (what it is, the ladder order, when to choose it vs Calibrated) → `build:canon` → 649 chunks. Ask Astryx can answer "what's the full body session?" in-voice.

## Acceptance status
- Golden test `tests/fullbody.golden.test.ts`: snapshot + double-run byte-identity + shape assertions (order, forks, no bare rungs, descent < ascent holds, exact tiling at 4 durations) — green twice.
- Live browser (guest): Chamber tab → picker → Full Body → 27-phase session (Opening Ground, macro groups, Earth tone card, 4-count box breath). Resume mid-descent verified (above).
- Calibrated regression: `buildForkSequence` untouched; engine golden fixtures unchanged and green; Calibrated card with no reading routes to the scan.
- Track resolution: every rung resolves its planet's NAT pool — all pool files HEAD-verified live in v4.2's probe; selection is seed-0 canonical; Mercury/Venus second visits advance one variant deterministically (session rotation, documented). Zero-warn full run to be eyeballed in cowork's pass alongside audio.
- All new strings pass `lint:copy`.

## Deviation notes
- "Quick/Standard/Extended" scaling: those duration names don't exist in the app; the builder is fully duration-scalable (tested) and the container ships at one canonical 35-min length — wiring multiple Full Body durations into the duration picker is a one-line follow-up when SHA wants it.
- The crown turn is its own step (27 total, not 26) — cleaner resume semantics and an honest held pause; the progress bar groups it as "Crown."
