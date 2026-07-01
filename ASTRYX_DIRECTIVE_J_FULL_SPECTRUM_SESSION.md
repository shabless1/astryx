# ASTRYX — Directive J: Full-Spectrum Session + Recalibration Composition Engine
### Claude Code handoff · 2026-06-28 · driven by SHA's design lock-in
> **Two parts. PART TWO (J.5–J.8, the corrective-engine rebuild) is the higher priority** — it fixes the thin/repeating session SHA found in live testing. Part One (J.1–J.4) adds the new Full-Spectrum session. They are independent; if sequencing work, **do Part Two first**.
**Read with:** `CLAUDE.md`, `COMPLIANCE.md`, `COWORK_QA_FINDINGS_2026-06-28.md`, `FIXES_COMPLETE_v3.md` (esp. Part I + the H/H.3 music-only chamber + the I-FIX player), `lib/chamber/forkRite.ts`, `lib/chamber/durationPresets.ts`, `components/screens/SessionScreen.tsx`.

> **Context.** The corrective chamber (signal-hierarchy → counterweight forks) is built and QA-passed. This directive adds a **second, parallel session type**: a **Full-Spectrum Recalibration** that runs **all 10 planetary forks** in a **feet-up anatomical sweep**, **bookended by breathwork** (no fork), with **Earth Day** played under the opening breath and **Earth Year** under the closing breath. It is an *attunement/maintenance* session — not a corrective one — so it does NOT consult the signalHierarchy and does NOT drive any planet's excess track.
>
> **Gating (do all, in order):** `npx tsc --noEmit` → 0 errors · `npm run build` ✓ · `rm -rf .next` then `vercel --prod --yes` · append a "Part J — Full-Spectrum Session" section to `FIXES_COMPLETE_v3.md`. Determinism (no `Math.random`) + compliance + the single-audio-owner rule stay intact.

---

## ARCHITECT DECISIONS (locked — build to these, don't re-litigate)

These were decided with SHA. Implement them as stated; where a sub-choice remains, make the better call and document it in `FIXES_COMPLETE_v3.md` (per `CLAUDE.md`: never ask SHA to code).

1. **Sweep direction = FEET-UP** (Pisces/feet → Aries/head). The zodiacal man, ascending.
2. **The 10-fork feet-up order** (modern rulerships, de-duplicated to the most foot-ward body region each planet governs):

   | # | Fork (planet) | Sign governed | Body region (feet→head) |
   |---|---------------|---------------|--------------------------|
   | 1 | **Neptune** | Pisces | feet |
   | 2 | **Uranus** | Aquarius | ankles / calves |
   | 3 | **Saturn** | Capricorn | knees / bones |
   | 4 | **Jupiter** | Sagittarius | hips / thighs |
   | 5 | **Pluto** | Scorpio | pelvis / reproductive |
   | 6 | **Venus** | Libra | kidneys / lower back |
   | 7 | **Mercury** | Virgo | abdomen / gut |
   | 8 | **Sun** | Leo | heart / spine |
   | 9 | **Moon** | Cancer | chest / stomach |
   | 10 | **Mars** | Aries | head |

   **Validate this order against `data/signs.json` `body_regions`** before hardcoding. If the data places a region differently, follow the data and document the change. (Mercury rules Gemini too, Venus rules Taurus too, Mars rules Scorpio too — we keep each planet at its single most foot-ward region so all 10 forks appear exactly once.)
3. **Each full-spectrum fork plays its planet's NAT (natural/balanced) track** — never exc/def/blk. This is an attunement, not a correction; it protects the "never amplify" rule. (The existing resolver already returns NAT for any planet not in the signalHierarchy tiers — confirm and rely on it; do not special-case.)
4. **Breathwork bookends (no fork):** the session OPENS with a breathwork phase (no fork) and CLOSES with a breathwork phase (no fork). **Earth Day audio plays under the opening breath; Earth Year audio under the closing breath** — reuse the existing bookend wiring (`SessionScreen.tsx` `audioForkPlanet`: `stepIdx === 0 → 'earthday'`, closing step → `'earthyear'`). Reuse the existing breath guide UI; scale its duration to the phase length.
5. **Physical EDR/EYR forks are NOT in this build.** SHA has 10 forks in hand now; the 12-fork set (adding Earth-Day-Rotation + Earth-Year-Rotation physical forks) is a later production run. For now the Earth bookends are **app audio only**, carried under the breathwork. Do not add EDR/EYR to the fork sweep.
6. **Reverse (head-down) sweep is Phase 2 — do not build it now.** Keep this directive to the feet-up default.

---

## FIX J.1 — Add the Full-Spectrum container (FOUNDATION — do first)

**Where:** `lib/chamber/durationPresets.ts`

**The problem:** `ChamberDurationKey` only knows the three corrective containers (`15_PERSONAL | 30_DEEP | 60_PRACTITIONER`). There is no container for an all-forks attunement.

**What to build:**
- Extend the union: `export type ChamberDurationKey = '15_PERSONAL' | '30_DEEP' | '60_PRACTITIONER' | 'FULL_SPECTRUM'`.
- Add a new `PhaseRole` value `'breathwork'` (no-fork breathing phase) and a `PhaseSource` value `'breath'`.
- Add a `FULL_SPECTRUM` architecture. It is NOT the primary/secondary/tertiary shape — it is breathwork + a 10-step fork sweep + breathwork. Because the 10 forks are fixed (not engine-resolved), represent the sweep either as 10 explicit `bodyPlacement`-style steps **or** flag the container so the builder (J.2) expands it. Recommended: add an optional `fullSpectrum?: true` field to `ChamberDurationPreset` and keep `architecture` as just the two breathwork bookends; the builder fills the 10 forks between them. Document whichever you choose.
- Suggested timing (~28 min, adjustable): opening breath **3 min**, 10 forks **~2 min each = 20 min**, closing breath **3 min**, plus ~2 min slack. Set `durationSec` to match the sum exactly so the timeline math lands.
- Register it in `CHAMBER_DURATIONS` with `label: 'Full-Spectrum Recalibration'`, `description: 'All ten planetary forks, feet to head — a full-body attunement'`, `minMode: 'user'` (everyone sees it).

**Verification:** `getDurationPreset('FULL_SPECTRUM')` returns the new container; `durationsForMode('user')` now includes it; `tsc` clean.

---

## FIX J.2 — The Full-Spectrum sequence builder (CORE FUNCTION — depends on J.1)

**Where:** `lib/chamber/forkRite.ts`

**The problem:** `buildForkSequence()` places `hierarchy.primary/secondary/tertiary` planets into the architecture. The full-spectrum session ignores the hierarchy and runs all 10 forks in fixed order.

**What to build:**
- A new exported function `buildFullSpectrumSequence({ durationSec }): SequenceStep[]` that emits, in order:
  1. **Opening Breath** — `role: 'breathwork'`, `fork: null`, no planet tone (Earth Day audio is applied downstream in SessionScreen, not here).
  2. **Ten fork steps** in the locked feet-up order (Neptune → Mars from the J table). Each step: `planet` = the planet, `fork` = `forkFor(planet)`, `phaseLabel` = e.g. `"Pisces · Feet"` (sign · region from `signs.json`), `role: 'bodyPlacement'`. Reuse `PLANET_TO_FORK` for the display fork name (e.g. Moon → 'Full Moon').
  3. **Closing Breath** — `role: 'breathwork'`, `fork: null`.
- Divide `durationSec` deterministically across the 12 steps (breath bookends get their fixed minutes from J.1; the remaining seconds split evenly across the 10 forks; the last fork absorbs any rounding remainder — mirror the existing `buildForkSequence` rounding approach so the timeline is exact and deterministic). **No `Math.random`.**
- Keep `sequenceStepAt()` and `forkSequenceDisplay()` working for the new sequence (they operate on `SequenceStep[]`, so they should — verify).

**Verification:** calling `buildFullSpectrumSequence({ durationSec: <FULL_SPECTRUM secs> })` returns 12 steps in the exact feet-up order, breathwork first and last, all 10 forks present exactly once, step start/end times tiling the full duration with no gap or overlap.

---

## FIX J.3 — Wire SessionScreen to the new session type (depends on J.2)

**Where:** `components/screens/SessionScreen.tsx`

**The problem:** `SessionScreen` always calls `buildForkSequence({ hierarchy, polarity, architecture, durationSec })`. It must branch to `buildFullSpectrumSequence` when the active container is `FULL_SPECTRUM`.

**What to build:**
- At the `useMemo` that builds `sequenceSteps` (~line 245), branch on `chamberDurationKey === 'FULL_SPECTRUM'` → `buildFullSpectrumSequence({ durationSec: chamberDurationSec })`; else the existing corrective builder. Keep the memo deps correct.
- **Earth bookends:** confirm the existing `audioForkPlanet` logic still fires — opening step (`stepIdx === 0`) → `'earthday'`, closing step → `'earthyear'`. **Extend `isClosingStep`** to also count the new closing `role: 'breathwork'` step (currently it checks `earthClose | silentIntegration | (integration && isLast)`). So: the closing breath plays Earth Year, the opening breath plays Earth Day. The 10 forks in between resolve to each planet's **NAT** track (no tier state → balanced → nat — verify in `SoundEngineController`).
- **Breathwork phases render the breath guide, not a fork card.** For `role === 'breathwork'` steps, render the existing breath guide UI (the 4-7-8 / pacer already in this screen) instead of the fork/body-placement step card. Scale the pacer to the phase's length. Show a calm "Breathe — settling the field" (open) / "Breathe — sealing the session" (close) label. No fork-placement dot during breathwork.
- **Visual during the forks:** the body map highlights each fork's body region as it plays (existing per-planet behavior). The mandala/color/combined modes work unchanged.

**Verification:** selecting Full-Spectrum and entering the chamber: opening breath screen with Earth Day audio → 10 forks feet→head, each showing its body region + its NAT track → closing breath with Earth Year audio. Switching visual modes does not restart audio. Leaving the chamber stops all audio (existing `panicStop`).

---

## FIX J.4 — Surface it in the container picker (depends on J.1)

**Where:** `components/screens/ResultsScreen.tsx` (the container chooser, ~lines 1455–1612)

**The problem:** users need to choose Full-Spectrum vs the corrective containers.

**What to build:**
- The picker already maps `durationsForMode(...)`, so the new container appears automatically once J.1 sets `minMode: 'user'`. **Confirm it renders** and is selectable (`setChamberDurationKey('FULL_SPECTRUM')`).
- Add one line of framing copy on the Full-Spectrum card distinguishing it from the corrective sessions — e.g. *"A full-body attunement through all ten forks — not targeted to today's signal."* Keep it compliant (no medical claims; probabilistic/neutral language).
- Make sure the persisted `chamberDurationKey` (store line ~493) round-trips the new key, and that `getDurationPreset` falls back safely if an old persisted key is stale (it already does).

**Verification:** the card shows for an Individual user, selecting it persists, and the session launches the full-spectrum flow.

---
---

# PART TWO — The Recalibration Composition Engine (CORRECTIVE sessions)

> **This is the higher-priority half of the directive.** SHA's live testing found the corrective chamber is **too thin and repeats forks**: an overstimulated chart yields only Moon → Venus → Moon-again → Saturn (reads as 2 forks). The rich intelligence the app already computes — a **three-tier signalHierarchy**, polarity **regulators**, planet-mapped **intention chips**, **resourced/balance** planets (Directive I.1), and the **NarrativeSignalParser** symptom→planet map — is **discarded** by `resolvePlanets()`, which collapses everything to 3 fixed roles. Consequences SHA hit directly: selecting **Abundance never surfaced Jupiter**; a **stalled** state never surfaced **Mercury or Uranus**; sessions repeat the primary instead of building breadth.
>
> **Root cause (in `lib/chamber/forkRite.ts`):** `resolvePlanets()` returns only `{ primary, regulator, integration }`, drawn mostly from a 4-planet `GROUNDING_PREFERENCE`. The architecture then **repeats** the primary via the `primaryReturn` slot. Intention only re-orders the regulator pool, so an *activating* intention (Abundance/Jupiter) can never appear. The secondary/tertiary signal tiers are never placed.
>
> **The fix:** replace the 3-role resolver with a **composition engine** that builds an ordered, de-duplicated list of **≥4 distinct forks** from the intelligence already computed, guarantees the intention fork, guarantees a balance/resource fork, and lays each across its own phase so nothing repeats before the floor is met. The **never-amplify** rule is preserved and *generalized* to every tier.

## FIX J.5 — Intention → fork map + wire intention into selection (FOUNDATION — do first in Part Two)

**Where:** new `lib/chamber/intentionMap.ts`; consumed by the composer (J.6); intention threaded through `lib/engine.ts` → `ForkSequenceInput`.

**The problem:** `formData.intention` (chips from `INTENTION_CHIPS`) + `formData.intentionText` are captured at intake but never become a fork. Intention only biases regulator ordering, so activating intentions can't surface.

**What to build:**
- Add the **approved intention→planet map** (SHA-confirmed 2026-06-28), keyed to the exact 12 `INTENTION_CHIPS` strings:
  ```
  Clarity → Mercury        Peace → Moon            Energy → Sun
  Healing → Neptune        Strength → Mars         Emotional balance → Moon
  Abundance → Jupiter      Transformation → Pluto  Spiritual connection → Neptune
  Grounding → Saturn       Love → Venus            Focus → Mercury
  ```
- `intentionPlanet(intentionChips: string[], intentionText?: string): string | null` — resolves the **first** matching chip to its planet (deterministic, chip order as the user selected). If no chip, optionally keyword-match `intentionText` against the existing `NarrativeSignalParser` keyword/supportPlanet table; if still nothing, return `null` (**never invent** an intention fork).
- Thread the resolved `intentionPlanet` into the protocol so it reaches `buildForkSequence`/the composer (add to `ForkSequenceInput` and pass it from `SessionScreen`/`engine.ts` where the sequence is built).

**Verification:** selecting **Abundance** yields `intentionPlanet → 'Jupiter'`; **Love → Venus**; no intention selected → `null` (no phantom fork).

## FIX J.6 — `composeSessionForks()` replaces `resolvePlanets()` (CORE — depends on J.5)

**Where:** `lib/chamber/forkRite.ts`

**What to build** — a single deterministic composer:
```
composeSessionForks({ hierarchy, polarity, intentionPlanet, resourcedPlanets, targetCount }): string[]
```
returning an **ordered, de-duplicated** list of distinct planet names of length `targetCount` (floor 4).

**Composition priority (deterministic order; each candidate passed through the never-amplify filter below):**
1. **Lead** — the primary signal. If primary is **overstimulated** (excess/blocked) → its **counterweight regulator** (existing logic). If deficient/balanced → the **primary planet itself** (activate it).
2. **Secondary signal** planet (`hierarchy.secondary`) — carries the 2nd symptom thread.
3. **Tertiary signal** planet (`hierarchy.tertiary`) — the aggravator/3rd thread (**this is where "stalled" → Mercury/Uranus lives**; it was being dropped).
4. **Intention planet** (J.5) — **guaranteed a slot** whenever the user expressed one. (Abundance→Jupiter now always appears.)
5. **Balance/resource anchor** — a planet from `resourcedPlanets` (Directive I.1), used for the integration/close. The recalibration draws on what's already strong.
6. **Backfill** to reach `targetCount` from, in order: remaining `polarity.protocol.regulator_planets`, then `INTEGRATION_PREFERENCE`, then `GROUNDING_PREFERENCE` — never duplicating.

**Never-amplify filter (generalized — apply to EVERY candidate, not just the primary):** if a candidate signal planet is in an **excess/blocked** state, represent it by its **counterweight/regulator**, never by itself. A **deficient/balanced** signal is placed as itself (to activate). This makes the *entire* set non-amplifying, not just the lead.

**Balance guarantee (SHA: "the recalibration MUST include balance"):** the final set must contain **at least one activation/resource fork** — i.e. at least one of {the intention planet, a resourced planet, a deficient signal placed as itself}. If after composition the set is *all regulators* (pure suppression), inject the intention planet (or, if none, the highest resourced planet) before backfill. Document this guard.

**Floor + cap:** enforce `length >= max(4, targetCount)` distinct; if real candidates are fewer than 4, backfill from grounding preference to reach 4. `targetCount` comes from the container (J.7): **15-min = 4, 30-min = 6, 60-min = 8** (SHA-approved).

**Remove/replace** the stale `resolvePlanets()` and the header comment claiming "the regulator already reflects intention bias" — that's superseded.

## FIX J.7 — Lay the composed list across phases (no lazy repeats — depends on J.6)

**Where:** `lib/chamber/durationPresets.ts` (architectures) + `lib/chamber/forkRite.ts` (`buildForkSequence`)

**The problem:** `buildForkSequence` maps each phase's fixed `source` (primarySignal/secondarySupport/…) to one of 3 planets, and `ARCH_15` repeats the primary in `Primary Return`. That's the visible repeat.

**What to build:**
- Give each container a `forkCount` (15→4, 30→6, 60→8). Build the composed list to that length (J.6).
- Rework `buildForkSequence` so the **working phases** (everything between the Earth-open and the Earth/integration-close) are filled **one distinct composed fork per phase, in composition order** — not by re-reading a fixed `source`. Widen the architectures so there are enough working slots to seat `forkCount` distinct forks (15-min needs ~4 working slots: Earth open → 4 forks → integration/Earth close).
- **Reprise rule:** the lead fork may reprise **once** as the penultimate "return home" beat in **30/60 only**, and **only after all distinct forks are placed**. The 15-min session is **4 distinct, no repeat**.
- Re-tile phase timing deterministically across `durationSec` (last working phase + close absorb rounding, as today). Earth bookends + the J.1–J.3 Earth-Day/Year audio wiring stay intact.

**Verification:** a 15-min corrective session shows **4 distinct forks** + Earth, **no planet repeats**; a 30-min shows 6 distinct (+ optional single lead reprise); timing tiles exactly.

## FIX J.8 — Cross-state verification harness (QA — depends on J.6/J.7)

**Where:** a temp `/api/vtest`-style route or unit assertions (delete the temp route before final deploy).

**Assert, deterministically:**
1. **Mars-excess + Abundance intention** → set **leads with Venus/Moon** (counterweights), **Jupiter present** (intention), **≥4 distinct**, and **Mars never plays its EXC track**.
2. **"Stalled" narrative** → **Mercury and/or Uranus present** (secondary/tertiary signal now placed).
3. **Deficient primary** → the **primary planet itself leads** (activation, not its regulator).
4. **Every container** → distinct fork count == its `forkCount`; **no repeat before the floor**; balance guard satisfied (≥1 activation/resource fork).
5. **Determinism** → identical inputs produce a second-for-second identical sequence (run twice, deep-equal).

---

## GLOBAL RULES (unchanged, non-negotiable)
- **Determinism:** no `Math.random` anywhere in the sequence or audio selection. The feet-up order is fixed; the time split is arithmetic.
- **Compliance:** every new user-facing string passes the COMPLIANCE.md bar — probabilistic framing, no diagnosis, the `ⓘ Reference tool · Not medical advice` footer present on the session/results surfaces, crisis gate untouched. Malachite (if it ever surfaces in this flow) keeps its red polished/sealed-only warning.
- **Audio = chamber only**, single owner (`audioSession`), music-only (no synth tone). Each full-spectrum fork = the planet's **NAT** track. `NEXT_PUBLIC_AUDIO_BASE_URL` still gates the layer.
- **Never amplify:** full-spectrum tones the baseline (NAT) of each planet — it must never pull a planet's excess/blocked corrective track. This is the core safety reason for the NAT rule; do not "optimize" it away.
- **No new `any`.** Types extend cleanly from `durationPresets.ts` and `forkRite.ts`.

## AFTER ALL FIXES
1. `npx tsc --noEmit` → **0 errors**.
2. `npm run build` → **✓**.
3. Run the verification gates: J.1–J.4 (full-spectrum: 12 steps, feet-up order, exact tiling) **and** J.8 (composition engine: the 5 assertions — Mars-excess+Abundance, stalled→Mercury/Uranus, deficient-leads-as-self, per-container distinct counts, determinism). Delete any temp `/api/vtest` route before deploy.
4. `rm -rf .next` → `vercel --prod --yes`.
5. Append two sections to `FIXES_COMPLETE_v3.md`:
   - **"Part J (One) — Full-Spectrum Recalibration Session"**: the container, the builder, the feet-up order shipped (and any deviation forced by `signs.json`), the NAT-only decision, the breathwork/Earth-bookend wiring.
   - **"Part J (Two) — Recalibration Composition Engine"**: the intention→fork map, `composeSessionForks` priority + the generalized never-amplify filter, the balance guarantee, the per-container forkCounts (4/6/8), and how the architectures were widened to seat distinct forks without repeats.

## OPEN ITEM FOR SHA (do not block on it)
The 10-fork timing (~2 min each / ~28 min total) is a first pass. After SHA sits through one full-spectrum session by ear, she may retune per-fork dwell time or total length — leave the per-step minutes in one clearly-commented constant in `durationPresets.ts` so that's a one-number change, not a refactor.
