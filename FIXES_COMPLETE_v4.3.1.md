# FIXES_COMPLETE_v4.3.1 — Corrected Ladder + Chakra Recalibration
*Completed 2026-07-03 · supersedes v4.3 (shipped yesterday); reconciled in place. Gates: tsc 0 · tests 12/12 (+1 manual skipped) · lint:copy clean · build green.*

## Original spec
Found in v4.3's Step 0: **`ASTRYX_DIRECTIVE_J_FULL_SPECTRUM_SESSION.md`** (the reverse sweep was its deferred Phase 2). J's locked decisions still honored: modern rulerships, NAT-only, Earth bookends, deterministic timing. No separate chakra spec found in the repo — v4.3.1 is the chakra spec.

## Full Body — reconciled to the owner-canonical table
All 12 rung regions corrected in `FULL_BODY_LADDER` (forkRite.ts) exactly per the v4.3.1 table: Pisces·feet/Neptune, Aquarius·**shins**/Uranus, Capricorn·**knees**/Saturn, Sagittarius·**hips**/Jupiter, Scorpio·**pelvis region**/Pluto, Libra·**lower back**/Venus, Virgo·**intestines region**/Mercury, **Leo·solar plexus region**/Sun, Cancer·**chest region**/Moon, Gemini·**shoulders & hands**/Mercury, Taurus·**thymus & throat region**/Venus, Aries·**head**/Mars. Placement instructions rewritten per region — Mercury's two rungs (intestines vs shoulders/hands) and Venus's two (lower back vs thymus/throat) carry fully distinct copy, and the rung's placement LABEL now comes from this table (not sign-zone resolution), so the double-strikes display distinct placements. Ladder golden snapshot regenerated once — diff reviewed, region/copy-only.

**Data-file note (documented deviation):** `signBodyZones.json` was NOT edited. Its `body_zones` already agree with the table's territories at the granularity it stores; forcing Leo's zones from heart/spine to solar-plexus would alter the Calibrated engine's body-zone resolution and break this directive's own regression invariant (acceptance 5: Smoke chart must match v4.2 byte-for-byte). The owner table lives authoritatively in `FULL_BODY_LADDER`, which is the ladder's single source. One nuance flagged for owner review: the Leo rung's body-map DOT derives from the sign's zone machinery (chest-center area) while all labels/copy say "solar plexus region" — if the dot must sit lower, that's a small BodyPlacementEngine mapping addition.

## Chakra Recalibration (new)
- **`buildChakraSequence({durationSec, instrument})`** — 17 steps: Opening Ground → Root→Crown (7 centers, full holds) → Crown Turn (3 slow breaths) → Crown→Root (lighter sweep) → Earth Close. `CHAKRA` container, canonical 1650s (27.5 min), scales to any duration (tiling golden-tested).
- **Instrument sets, both derived from repo data (nothing invented):**
  - *Solfeggio:* Root 396 · Sacral 417 · Solar Plexus 528 · Heart 639 · Throat 741 · Third Eye 852 · Crown 963 — each value asserted present in `solfeggio-overlays.json` by the golden test (and matching CLAUDE.md Rule 2 / the BodyMap CHAKRAS canon).
  - *Planetary:* read from `sacredTones_nervousSystem.json` `chakra` fields — **each center maps to exactly one fork in the data; zero gaps, zero ambiguity**: Root→Earth Day (194.18), Sacral→Full Moon (210.42), Solar Plexus→Sun (126.22), Heart→Venus (221.23), Throat→Mercury (141.27), Third Eye→Neptune (211.44), Crown→Jupiter (183.58). The six "Extended" forks (Mars, Saturn, Uranus, Pluto, Earth Year, +) are correctly not centers.
- **Music layer decision (documented):** the chamber is music-only (H.3), and no Solfeggio audio exists in the bucket — so in BOTH instrument modes the music follows the center's planetary correspondence (Root rides the Earth-Day layer; Sacral plays Moon; etc.). The instrument choice changes the fork you strike and the displayed Hz, not the music. Deterministic either way.
- **Fork rendering:** planetary mode carries the real Sacred Tones fork per center (Earth Day is app-played → chamber-carries line, per the standing rule); solfeggio mode sets `fork: null` — every center shows the "tone plays from the chamber" line with the strike instruction in the step copy. No center is ever skipped.
- Completion writes `ChamberSession` `kind: "chakra_solfeggio" | "chakra_planetary"` (allowlisted in `/api/sessions`).

## Mode selection (three modes)
Picker now: Calibrated (preselected) · Full Body · **Chakra card with inline Solfeggio/Planetary pills** (preselects Planetary when `ownedForks` is non-empty — Sacred Tones ownership is the only set the store knows; both always selectable). Settings preference gains "Chakra". Dashboard secondary line: *"or run a Full Body or Chakra Recalibration →"* (opens the picker). Resume restores mode + instrument + exact step (`interruptedSession.mode: 'chakra'`; the persisted `chakraInstrument` keeps the same sequence on resume). Chakra is guest-runnable (canonical seed-0 DNA path shared with Full Body).

## Canon
Ladder-order entry corrected to the owner regions; three-mode comparison entry updated; new chakra entry (sequence, both instrument tables, chamber-carries rule) → `build:canon` → **650 chunks**.

## Acceptance status
- Golden tests: full-body (snapshot regenerated once, region-only diff) + chakra ×2 instruments (snapshots, byte-identity, 17-step shape, exact tiling, **frequencies asserted against both data files**) — 12/12 green.
- Browser: guest → Chamber tab → three-card picker → Chakra (Solfeggio) → 17-phase session live (mode/key/instrument/phase pointer all correct). Full Body regression covered by v4.3's live run + the regenerated golden.
- Calibrated regression: engine goldens unchanged and green; `buildForkSequence` untouched.
- Zero-warn audio runs + Mercury/Venus distinct-placement eyeballing: cowork's browser pass on the dev server (the placement labels are table-driven and golden-tested).

## Flagged for owner review
1. Leo rung body-map dot position (label says solar plexus; dot sits at the sign's chest-center zone).
2. Chakra descending Root keeps the previous center's (Moon) music flowing rather than re-entering the Earth-Day layer — consistent with the "Earth steps keep prior music" chamber rule; say the word to special-case it.
3. Solfeggio-mode cards show the strike instruction in the step copy; a dedicated solfeggio fork graphic/name-plate is a polish pass.
