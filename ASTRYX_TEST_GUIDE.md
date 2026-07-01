# ASTRYX — End-to-End Test Guide

**App URL:** https://n-pi-jet.vercel.app
**Build:** v4.x · Remedy Polarity Engine (all 10 planets) · Music Engine overhaul · Dual-layer Suno audio
**Last updated:** 2026-06-08
**Tester role:** Claude Cowork / human QA
**Goal:** Validate the full head-to-toe flow + report findings (UX bugs, broken interactions, polarity accuracy, audio quality, mobile responsiveness).

---

## 1 · What Astryx is

A **deterministic multi-sensory calibration system** that translates birth astrology + current symptoms into a personalized 5-sense protocol (Sound, Scent, Taste, Body, Sight). Real NASA-JPL ephemeris — not horoscope text.

> **Calibration not prediction. Blueprint not reading. Signal not sign.**

**The core intelligence — Planet ≠ Remedy:** the chart identifies the *pattern*; the user's *symptoms* set the *state* (excess / deficiency / blocked / balanced); the app prescribes what **balances** the pattern — never amplifies it. This applies to **all 10 planets**. Any case where Astryx outputs *more* of an already-excess energy is a bug.

**Same birth data + same symptoms = the same output, every time.** Deterministic is non-negotiable.

---

## 2 · Test setup

- **Incognito window** (or hard-refresh `Cmd/Ctrl+Shift+R`) every session start — the PWA caches aggressively; without this you test an old build.
- **Headphones** — there's a binaural layer and a music track under the synthesis.
- Desktop (Chrome/Firefox/Safari) + mobile (iOS Safari, Android Chrome).
- Volume up but comfortable.

---

## 3 · What's new in this build — focus here

1. **Dual-layer audio** — real-instrument music (Suno) plays alongside the Tone.js Cousto-Hz synthesis.
2. **Polarity intelligence across all 10 planets** (was effectively dead before; now live and symptom-driven).
3. **De-harshed, musical sound** — lush, calming; no more flat/harsh test-tone feel.
4. **Polarity now reaches the session visuals and the transit protocols** (previously chamber-only).
5. **No-symptom sessions correctly produce no correction** (natural planet character).

---

## 4 · Intake flow (4 steps)

**Step 0 — Personal:** Individual/Practitioner toggle · name · DOB · time (or "I don't know" → ☉ Solar Chart) · birth location (must autocomplete + confirm). "Begin Resonance Scan" disabled until name + DOB + location filled.
**Step 1 — Resonance Scan:** 10 planet cards, 3 statements each. Tap what "feels true." Counter shows "N activated."
**Step 2 — In Your Own Words:** optional free text.
**Step 3 — Intention:** free text + quick chips + Calibration Summary → **Generate My Protocol** → Analysis loader → Results.

**Report:** any step that doesn't validate, any mobile misalignment, geocode failures.

---

## 5 · Polarity intelligence — THE core test

Run all four Mars scenarios by tapping the **Mars** card statements:

| Scenario | Tap (Mars card) | Expected on Results |
|---|---|---|
| **A — Excess** | "carrying anger, frustration, or inflammation" | Badge **"Mars excess detected"** · "cool, calm, regulate" · **blue/green** palette · Moon character |
| **B — Deficiency** | "physical energy, libido, or motivation is depleted" | "Mars deficiency" · warming/activating · reds/oranges |
| **C — Blocked** | "stuck, blocked, or unable to move forward" | "Mars blocked" · release/mobilize |
| **D — Balanced** | tap **nothing** | **No** polarity callout · natural planet character |

Then test **other planets** the same way:
- **Mercury** "overstimulated, nervous, mentally overwhelmed" → Mercury excess → **grounding** (Saturn character).
- **Saturn** "chronic tension, restriction, stiffness" → Saturn excess → **warming** (Venus character).

On Results, verify the **Chamber CTA** callout (badge + corrective direction + Avoid line + palette) and expand **Prescriptions** to confirm scent / taste / breath / colors all match the corrective direction (not the planet's raw character).

**Practitioner mode** adds a trace panel: state, confidence, reasoning (`symptom "anger" → excess (+4)…`), and effective regulator planet.

> **Fail condition:** any reported imbalance that produces *more* of the same energy.

---

## 6 · Dual-layer audio (NEW — the big one)

Enter a Chamber, open the **Sound panel**, and per session confirm:

- The Suno **track dot glows LIVE** with a label like `♫ mars exc 01b`. (Dark = idle; **`ERR` = missing file → report the planet/state.**)
- You **hear a real instrument track** under the synthesis drone (kora, ney, cello, bowls, shakuhachi, etc.).
- The track **matches the state**: a Mars-**excess** session sounds cooling/lunar; a **balanced** session sounds like the planet itself.
- ⚠️ **MARS_EXC tracks must be cooling with NO percussion/drums.** If a Mars-excess track sounds driving/percussive/fiery, flag it — clinically wrong.
- **Determinism:** re-run the same birth data + symptoms → same track. Confirm it's not random.

**Known by design:** ~172 tracks across 10 planets × 4 states; the seed picks from whatever exists per slot, so coverage varies by planet (e.g. Venus def has 1, Jupiter nat has 9). That's expected — only a `LIVE` dot that produces no/`ERR` audio is a bug.

---

## 7 · Sound quality (NEW)

- Should feel **calming, musical, atmospheric** — chords + melody + pads, not a harsh stack of tones.
- **Not loud / distorted / clipping.** No painful high frequencies.
- Over a longer session, sound should **evolve through 5 phases** (gentle Entry → fuller Peak → soft Integration), fading smoothly (no clicks).
- "Hear Preview · 15s" on the Chamber CTA should be soft and lush, not painful.

**Report:** subjective rating 1–10, any harshness/clipping/dropouts, whether phases were audibly different.

---

## 8 · Polarity reaches visuals + transits (NEW)

- **Session visual:** during a corrective session the full-screen sacred geometry should shift to the **corrective palette** (e.g. blue/green for Mars-excess), not the planet's raw colors. Geometry shape still comes from the aspect.
- **Transit Protocol modal:** Results → Today's Cosmic Weather → expand a transit → **View Protocol**. If the transit involves a planet you're imbalanced for, it shows a corrective callout + adjusted sound/scent/taste/body/sight (strongest active correction wins).

---

## 9 · Surfaces to spot-check

- **Body Map** (See Why → Body Map): holographic body, rainbow chakra meridian, 7 chakra nodes (Hz + Sanskrit), planet glyphs on correct regions; Front/Back + sex + view-mode toggles; hover/tap detail panels.
- **Natal Chart Wheel:** 12 signs, Placidus houses, solid (hard) / dashed (soft) aspect lines, planet glyphs at correct longitudes, hover → detail; "☉ Solar Chart" badge when birth time unknown.
- **NavBar:** all tabs load (Home · Intake · Results · Clients · Body · History · Settings); mobile drawer.
- **Daily Home:** on a return visit (after one completed intake), lands on Home with greeting, cosmic weather, cell-salt card, symptom check-in chips, evening-session button.

---

## 10 · Practitioner-specific

Toggle Practitioner at intake, then verify: practitioner trace on Results, exact Hz visible, Transit modal "Practitioner Notes", PDF export, (client roster if accessible).

---

## 11 · Compliance (non-negotiable)

- Every assessment string uses **probabilistic framing** ("may suggest", "may indicate", "may correlate with"). **Never** "you have", "you are", "this is diagnostic." Report any absolute/diagnostic phrasing.
- Persistent footer on every screen: `ⓘ Reference tool · Not medical advice · Astryx may suggest patterns, not diagnose conditions`.
- **Malachite** must carry a red warning badge wherever it appears.
- All safety notes from the data files must render.

---

## 12 · Known limitations (not bugs)

- **Solar Chart confidence is not reduced** — only house-based scoring is approximate (per spec).
- **PWA caching is aggressive** — hard refresh required after deploys.
- **Cosmic Background video** is intentionally clipped to a HUD strip — not a missing background.
- The no-symptom case may still surface a *moderate* state from strong transits alone in rare charts — if you see a callout with zero symptoms tapped, note it.

---

## Report format

```
### Pass
- [what worked]

### Issues
For each: 1) steps  2) expected  3) actual  4) severity (blocker/major/minor/polish)  5) console error or ERR label

### Polarity accuracy
- Mars excess → cooling? (Y/N)   · deficiency → warming? · blocked → release? · balanced → no callout?
- Other planets tested + results

### Audio
- Each state pulled a state-appropriate track? (Y/N + examples)
- Any ERR track dots? (list planet/state)
- Any MARS_EXC track that felt activating instead of cooling?
- Sound rating (1–10) + harshness/clipping notes · phases audible?

### Mobile
- Touch targets, layout breakage, iOS Safari audio

### Top 3 priority fixes
```

---

**Success criterion:**
> A user reporting Mars-excess symptoms gets a Mars-**cooling** chamber — correct "Mars excess detected" badge, blue/green visuals, a cooling real-instrument track, and calming audio — and the same input always produces the same result. The system distinguishes pattern from remedy across all 10 planets.

Everything else is secondary to that. Thank you for testing.
