# ASTRYX — Directive S · Addendum 2: Guided One-Position-at-a-Time Placement
### 2026-06-28 · kill the body-map flood → a sequenced, focused placement flow with cited hold timing
**Problem (SHA, live screenshot):** the Body view lights **every** fork position at once — the old Traditional/Natal dual-orbs (Directive K) **and** the new S reflex orbs — so the map reads as a constellation, not an instruction ("looks crazy and confusing"). We replace the flood with a **guided sequence: one fork, one position, one hold, then advance.**
**Read with:** `lib/chamber/forkRite.ts` (`composeSessionForks`/`buildForkSequence`), `lib/ReflexEngine.ts` (`reflexPointsFor`, `computeReflex`), `lib/BodyPlacementEngine.ts` (`signBodyRulershipLibrary`, `planetBodyRulershipLibrary`, `anchorForRegion`), `lib/chamber/durationPresets.ts`, `components/engine/BodyMap.tsx` + `ChamberBodyMap.tsx`, `components/screens/SessionScreen.tsx`.

> **Gating:** `npx tsc --noEmit` → 0 · `npm run build` ✓ · verify §A2-ACCEPT against a **preview** (SHA eyeballs before live) · then `rm -rf .next` → `vercel --prod --yes` · append "Part S Addendum 2 — Guided Placement" to `FIXES_COMPLETE_v3.md`. Determinism preserved; comfort-framed (no "treat"); premium (extended = practitioner unlock, never a discount); no credibility labels; distill-not-ingest; scope firewall holds.

## A2.1 — Retire the flood (single source of placement)
- **Remove the always-on multi-orb render.** The map no longer shows Traditional + Natal + all reflex points simultaneously. The Directive-K "traditional/natal" idea is **folded into the position candidates** (below) — it is a *ranking input*, not a separate always-on display.
- At any moment the map shows **exactly ONE active position** (the current step). Completed positions = a small dim ✓; upcoming = hidden or barely-there. One point, one instruction.

## A2.2 — Position selection: TOP 2 per fork, intake-ranked
For each fork in the `composeSessionForks` order, build ordered position candidates and take the **top 2**:
1. **The user's reported zone** — if intake said they hold tension in a zone governed by this signal's sign (or its reflex), that zone ranks **first** (it's their actual complaint). *Note: when the fork is a counterweight (the WHAT is a regulator), the position is still the COMPLAINT zone — the regulating tone applied where it's felt. WHICH fork = engine's counterweight; WHERE = the named zone.*
2. **The planet's primary anatomy point** (traditional rulership — `planetBodyRulershipLibrary` primary).
3. **The planet's secondary / natal point, then the reflex point** (lower rank).
Take **positions 1 and 2**. If the user named no zone for this fork, default to the planet's **primary + secondary** anatomy points. Deterministic ordering (stable, same inputs → same two positions).

## A2.3 — The sequence: fork · position steps
Expand the working sequence so each fork contributes **two consecutive placement steps**:
`Fork1·Pos1 → Fork1·Pos2 → Fork2·Pos1 → Fork2·Pos2 → …` (ordered by the existing composed fork order).
Each step carries: `{ planet, positionIndex (1|2), zoneLabel, anchor(x,y), side (front|back), holdProtocol }`. The Body map + session player advance **one step at a time**. Manual ← / → also steps positions; the timeline "resume the flow" advances them automatically.

## A2.4 — Music-synced hold timing (cited) + Individual/Practitioner split
Each planet plays ONE track (~3–3:30). The fork's **2 positions split that track evenly** — so the placement always fills the song.
**New `data/forkHoldProtocol.json`** (distilled from the tradition — Beaulieu Otto ceiling + LaSol point-hold; comfort-framed, never medical):
- **Position window = the planet's track length ÷ number of positions (default 2)** → ~**90s** for a 3:00 track, ~105s for 3:30. Compute from the actual track, don't hard-code 90.
- **Within each window, the cited 2-ring dose:** strike → hold **until the tone fades (~20–30s)** → **rest ~15s**, up to **2 rings** (≈80s, fits the ~90s window). The window IS the "twice per point" dose.
- **Why 2 positions:** moving to a new point at the mid-track mark **enforces Beaulieu's ceiling** — *"two rings a spot is plenty; more over-does it"* — no single point is ever over-rung across the song. Physiological + musical in one move.
- **Individual (default):** **one track per fork = 2 positions × ~90s, ≤2 rings/point.** The shortest effective length.
- **Practitioner (unlock):** extended — **repeat 4–5×, longer holds (5–15 min), both sides** ("complete that side") → runs beyond the single song (looped/longer track). Gate behind the Practitioner tier. No discount — premium unlock.
- Each position's on-screen timer counts its window; the ✓ appears when the window completes and the next orb cues (A2.5).

## A2.5 — Body-map render (two positions shown, ONE lit, next GLOWS to cue the change)
- The map shows the fork's **two positions**, but **only the active one is lit** (current planet's color); the other sits faint/inactive.
- **The transition cue (SHA's design):** when the position-1 window ends, position-1 dims to a soft **✓** and **position-2 pulses/glows bright** — the "move the fork now" signal — and the label flips to *"Now position two — move to your [zone]."* Optional soft chime at the hand-off so the client needn't watch the screen.
- Active label is plain: **"Mars · position 1 of 2 · hold until the tone fades, ring twice."** No simultaneous list.
- **Auto-flip Front/Back** to whichever side the active point is on (kills the manual guessing + the "?" in the screenshot).
- Tap the active point → one line + "Ask Astryx why →" (reflex reasoning stays in Astryx, not on the map).
- Fully synced to the track: the orb hand-off fires at the mid-track mark; ← / → and the timeline also drive it.

## A2.6 — Copy tone
One instruction at a time, calm and human: *"Now the Mars fork — hold at your solar plexus until the tone fades, then rest. That's position one of two."* No jargon walls, no simultaneous lists. Comfort framing throughout; `MICRO_DISCLAIMER` present.

## §A2-ACCEPT (verify on preview)
1. Body map shows **ONE** active position at a time — never the old flood.
2. Each fork surfaces its **top 2** positions, intake-ranked (user's reported zone first; else planet primary+secondary). Counterweight forks place at the **complaint zone**.
3. Sequence steps **Fork1·P1 → Fork1·P2 → Fork2·P1 → Fork2·P2 …**; each fork = one track, **position window = track ÷ 2 (~90s)**; at the mid-track mark position-1 → ✓ and **position-2 glows** to cue the change; Front/Back auto-flips; ←/→ and timeline also advance it.
4. **Individual** = one track/fork, 2 positions × ~90s, cited 2-ring dose (≤2 rings/point). **Practitioner** unlock exposes the extended (4–5×, 5–15 min, both sides) dose.
5. Determinism (same inputs → same two positions + order); comfort-framed; no "treat"; no credibility labels; `tsc` 0 · build ✓.

## AFTER
`tsc` 0 → build ✓ → verify §A2-ACCEPT on preview (SHA's eyes) → `rm -rf .next` → `vercel --prod --yes` → append "Part S Addendum 2 — Guided one-position-at-a-time placement (top-2 per fork, intake-ranked; fork·position sequence; cited hold timing with Individual/Practitioner split; single-orb synced body map)" to `FIXES_COMPLETE_v3.md`.

---
### Minor flag (not this addendum): the screenshot's "This track isn't available yet — try another song" means the Mars chamber-music mapping is missing a track. Log it; fix in the audio pass, separate from placement.
