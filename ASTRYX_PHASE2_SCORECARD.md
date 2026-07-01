# ASTRYX — Phase 2 Pressure-Cook Test Scorecard
**Date:** June 8, 2026  
**Build:** https://n-pi-jet.vercel.app  
**Test Scenario:** Mars Excess — DOB 07/15/1967 · 06:15 AM · New York, NY  
**Symptom Selected:** "I'm carrying anger, frustration, or inflammation in my body"  
**Intention:** Peace  

---

## WHAT WAS TESTED

- Intake → Analysis → Results → Session full flow
- Polarity detection and corrective routing
- Dual-layer audio (Tone.js + Suno)
- Session visual palette under polarity state
- Prescription cards (Sound / Scent / Taste / Body / Sight)
- Natal Chart Wheel
- Body Map
- Transit weather integration
- Sacred Extension Layer (Botanicals, Crystals, Cell Salts, Tuning Forks)
- Compliance framing
- Practitioner Trace

---

## CONFIRMED PASSES ✅

| # | Item | Detail |
|---|------|--------|
| 1 | Analysis screen | Sacred geometry figure renders, "Analyzing Your Resonance / Parsing Natal Positions…" |
| 2 | API chart calculation | `/api/chart` returns correctly, astronomy-engine completes without error |
| 3 | Mars identified as dominant | Correct planet isolated from chart + symptom score |
| 4 | Transit weather | 7 active transits rendered with correct aspect types, orbs, applying/separating status |
| 5 | Symptom routing | "Anger Inflammation" → Mars-Pluto pattern with probabilistic framing ("may be sourced from") |
| 6 | Cell salts | Kali Phos (active now) + Calcarea Fluorica (daily baseline) — both correct for chart |
| 7 | Innate Baseline Deficiencies | Carey/Bonacci gestation rule renders — Leo/Mag Phos, Virgo/Kali Sulph, Libra/Nat Phos |
| 8 | Sacred Botanical | Red Hibiscus (Hibiscus sabdariffa) — cooling, correct for Mars excess |
| 9 | Crystal | Bloodstone with body placement (lower abdomen / base of spine) |
| 10 | Tuning Fork | Mars · 144.72 Hz · note D · Femur / tibial shaft / L1-L3 |
| 11 | MARS EXCESS DETECTED badge | Shows "MARS EXCESS DETECTED · STRONG SIGNAL" in Chamber section |
| 12 | Chamber therapeutic intent | "cool, calm, regulate. Sound and color shift toward Moon character." Explicitly states "Avoid: heat · overstimulation · aggressive pulse · red overload." |
| 13 | Practitioner Trace | State: excess · confidence 10 (strong) · scoring chain visible · Effective planet: Moon (regulator for Mars excess) |
| 14 | Sound Engine label | "Cooling Calm Regulation" — correct corrective descriptor |
| 15 | Corrective Hz in session | 210.42 Hz (Moon frequency) active — NOT Mars 144.72 Hz — corrective engine working |
| 16 | Suno track resolved | MARS EXC 02 selected and showing LIVE badge — correct corrective track |
| 17 | Session tea blend | Peppermint · chamomile · lemon balm · rose — all cooling herbs, correct for excess |
| 18 | Duration options | Quick 3min / Daily 7min / Deep 11min / Immersion 22min / Practitioner 33min |
| 19 | Compliance footer | "Reference tool · Not medical advice" on every screen |
| 20 | Natal Chart Wheel | Full interactive SVG — 12 segments, Cancer ASC correct for 6:15 AM NY July 1967, planets at correct ecliptic positions, color-coded aspects (green trine, red square, dashed quincunx), ASPECTS/HOUSES toggles functional |
| 21 | Body Map | Human silhouette with rainbow chakra column, planetary glyphs at anatomically correct body regions, +1/+2 stacking indicators, 9 view modes (FRONT/BACK/♀/♂/ANATOMY/CHAKRAS/PLANETS/COMBINED/FULL) |
| 22 | Session flow | 10-step session, timer running, step progression correct |
| 23 | Waveform visualizer | Teal/green bars — visual cooling hint in the waveform layer |
| 24 | Safety notes | All safety disclaimers render: Red Hibiscus contraindications, Bloodstone safety, Cell Salt disclaimer |
| 25 | Tone.js init | Initializes cleanly, no errors in console |
| 26 | No crashes | Zero JavaScript errors across full flow |

---

## FAILURES AND ISSUES ❌

### P0 — Therapeutic Accuracy Failures (blocks product integrity)

**1. SIGHT card shows "red" for Mars EXCESS**  
The Sight prescription card shows "Soft ambient light in red tones" — Mars NAT color. For an overheated Mars excess state this is amplifying, not corrective. The Chamber text itself says "Avoid: red overload" but the Sight card tells the user to sit in red light. Direct contradiction. Should be silver-blue (Moon character).

**2. Session screen palette stays Mars red**  
The session background, TAP TO ACTIVATE button, progress bar, and volume slider all stay in the Mars red accent palette. The Chamber correctly states "Sound and color shift toward Moon character" but the visual system does not execute this shift. The palette must change to Moon's color (silver/pale blue) when state = excess.

**3. SOUND card shows 144.72 Hz (Mars NAT)**  
The Prescriptions section SOUND card shows "Play 144.72 Hz tone for 5-10 minutes" — the Mars natural frequency. For Mars excess the corrective sound is Moon at 210.42 Hz. The session engine correctly uses 210.42 Hz but the prescription DISPLAY card still shows NAT data. The user reads the prescription card and gets the wrong Hz.

**4. SCENT card shows ginger for inflamed Mars**  
Scent = "ginger · peppermint · clove." Ginger is warming/stimulating. The same protocol page says "Ginger, black pepper, cinnamon — avoid when inflamed." Ginger in the Scent card contradicts the text directly above it. For Mars excess, the corrective scent should be cooling (lavender, peppermint, rose, chamomile).

**5. BODY card shows warrior stance for Mars excess**  
Body = "controlled exhale 4 count · rooted warrior stance · isometric hold release." Warrior stance and isometric release are Mars NAT protocols — active, grounded, forceful. For a Mars excess state (user reporting anger, inflammation) the body instruction should be yielding, soft, non-effortful. Correct corrective: "restorative posture, slow supine release, child's pose or yin hold."

---

### Root Cause — ONE Structural Bug Drives All 5 P0 Failures

The prescription cards (Sound, Scent, Taste, Body, Sight) in `ResultsScreen.tsx` pull directly from the planet's NAT data without checking polarity state. The corrective logic exists inside `ChamberDNA` and `SoundEngineController` but it does NOT pipe back to update the 5-layer display.

**Fix required:**  
In `ResultsScreen.tsx`, when `protocol.polarity.dominant_state !== 'balanced'`, the prescription cards must:
- Read Sound Hz from the corrective planet (Moon for Mars excess → 210.42 Hz)
- Read Scent from the corrective planet's data
- Read Taste from the corrective planet's data
- Read Body from the corrective planet's corrective protocol (soft/yielding movement)
- Override Sight color with corrective planet's color (Moon = silver/pale blue)
- Display a "↔ Corrective Mode" indicator on each card so the user understands the protocol is therapeutic, not amplifying

---

### P1 — Should Fix

| # | Issue | Detail |
|---|-------|--------|
| 6 | Chip label mislabeled | "210.42 Hz / MARS" — 210.42 Hz is the Moon frequency. Should read "MOON" or "CORRECTIVE." Causes confusion in the session panel. |
| 7 | Activate button color | TAP TO ACTIVATE button is red/crimson — should shift to Moon palette for corrective sessions |
| 8 | "WHAT IT DOES IN YOUR BODY" compliance | "The activation system is overheating or burned out. Inflammation, accidents, rage." — direct declarative. Add "may suggest" framing. |
| 9 | Tone.js double-init | Fires `Tone.js ready` twice on session entry — one from window.Tone, one from static import. Harmless but indicates a redundant initialization path. |
| 10 | NEXT_PUBLIC_AUDIO_BASE_URL | Not set on this Vercel deployment — Suno music layer is silent. Must add this env var in Vercel dashboard to activate dual-layer audio. R2 URL: `https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev` |

---

## SCORECARD — Phase 1 vs Phase 2

| Category | Phase 1 | Phase 2 | Delta |
|----------|---------|---------|-------|
| Core Infrastructure / Stability | 6/10 | 9/10 | +3 |
| Polarity Detection | 3/10 | 9/10 | +6 |
| Polarity → Session Engine | 2/10 | 8/10 | +6 |
| Polarity → Results Display | 2/10 | 3/10 | +1 |
| Dual-Layer Audio Architecture | 0/10 | 8/10 | +8 |
| Sound Engine (Tone.js Hz accuracy) | 5/10 | 8/10 | +3 |
| Natal Chart Wheel | 7/10 | 10/10 | +3 |
| Body Map | 6/10 | 10/10 | +4 |
| Transit Weather | 5/10 | 9/10 | +4 |
| Sacred Extension Layer | 4/10 | 9/10 | +5 |
| Compliance Framing | 6/10 | 7/10 | +1 |
| Practitioner Trace | 0/10 | 10/10 | +10 |
| Session Visual Palette | 2/10 | 4/10 | +2 |
| **OVERALL** | **4.5/10** | **8.0/10** | **+3.5** |

---

## WHAT IMPROVED (Phase 1 → Phase 2)

- Polarity detection: fully rebuilt — state scoring, confidence calibration, effective corrective planet named
- Practitioner Trace: didn't exist in Phase 1 — now shows the full scoring chain
- Dual-layer audio: didn't exist — now has 172 tracks in R2, correct track resolves, LIVE badge
- Session sound engine: now uses corrective Hz (Moon 210.42) not Mars NAT
- Transit weather: was sparse — now 7 active transits with correct aspect data
- Body Map: was placeholder — now full silhouette with chakra column, 9 view modes
- Natal Chart: was functional but incomplete — now full interactive SVG with all aspects
- Sacred Extension Layer: fully populated (botanicals, crystals, cell salts, forks)

## WHAT STILL NEEDS FIXING

The only remaining architectural gap: **polarity does not propagate to the 5-layer prescription display.** The engine applies corrective logic, the Chamber describes corrective intent, the session sound uses corrective Hz — but the Prescriptions section that the user reads first still shows NAT data. This is the single highest-priority fix remaining.

Once that is resolved, the visual palette shift (session background + button color + SIGHT card) must follow.

---

## NEXT DIRECTIVE TO CLAUDE CODE

**Subject:** Fix prescription display polarity propagation + session visual palette shift

**File targets:**
- `src/components/screens/ResultsScreen.tsx` — prescription cards (Sound, Scent, Taste, Body, Sight)
- `src/components/engine/SoundEngineController.tsx` — TAP TO ACTIVATE button color, chip labels
- `src/components/screens/SessionScreen.tsx` — background palette, progress bar accent color

**Logic:**
```
if (protocol.polarity.dominant_state !== 'balanced') {
  const correctivePlanet = protocol.polarity.corrective_planet // e.g., 'moon'
  // Prescription cards pull from correctivePlanet data
  // Sight card color = correctivePlanet color
  // Session accent color = correctivePlanet color
  // Show "↔ Corrective Mode" badge on each card
}
```

**Also:**
- Fix chip label: "210.42 Hz / MARS" → "210.42 Hz / MOON"
- Add `NEXT_PUBLIC_AUDIO_BASE_URL=https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev` to Vercel env vars

---

*Phase 2 test complete — June 8, 2026*
