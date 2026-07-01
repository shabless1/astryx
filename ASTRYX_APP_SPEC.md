# ASTRYX — Application Specification

**Live app:** https://n-pi-jet.vercel.app
**Category:** Multi-sensory wellness calibration web app (PWA)
**Positioning:** *Calibration not prediction. Blueprint not reading. Signal not sign. System not mysticism.*

This document describes **what the application is and what it is designed to do.** It is an objective specification — not a test script and not a marketing pitch.

---

## 1. Summary

Astryx takes a person's **birth data** (date, time, place) and their **current state** (self-reported symptoms / how they feel right now) and produces a personalized, **deterministic five-sense calibration protocol** delivered as a timed "Chamber" session. It uses real astronomical calculation (NASA-JPL ephemeris) as a structured pattern-recognition layer, then maps the result to sound, scent, taste, body, and sight outputs grounded in frequency science (Hans Cousto's cosmic octave), classical medical astrology, and botanical/mineral correspondences.

It is a **reference / self-care instrument**, not a medical device. All assessment language is probabilistic ("may suggest," "may indicate"); it does not diagnose, treat, or prescribe medically.

---

## 2. Core design principle — Planet ≠ Remedy

The defining behavior:

- The **chart** identifies the active **pattern** (which planet/aspect is dominant).
- The user's **symptoms** determine the **state** of that pattern: *excess · deficiency · blocked · balanced*.
- The output prescribes what **balances** the pattern — it is designed to never amplify an imbalance.

This applies to all **10 planets × 4 states**. Example of the intended behavior: a user with Mars-related symptoms of anger/inflammation (Mars *excess*) is meant to receive a *cooling/calming* protocol (Moon character, blue-green palette, peppermint/chamomile, slow exhale breath, cooling music) — not an energizing one.

---

## 3. End-to-end flow

1. **Intake** (4 steps): birth data → a "Resonance Scan" where the user taps statements across 10 planetary domains that feel true → optional free-text → intention.
2. **Chart calculation:** server computes planets, houses, aspects (Placidus natal chart; or "Solar Chart" mode if birth time is unknown).
3. **Protocol engine:** determines the dominant pattern + polarity state, then generates the 5-sense protocol and a SOAP-style assessment.
4. **Results screen:** diagnosis, "Today's Cosmic Weather" (current transits), prescriptions, the Chamber card, and deeper tabs (Natal Chart Wheel, Body Map).
5. **Chamber session:** a timed (3/7/11/22/33 min) full-screen multi-sensory experience.

---

## 4. The five-sense protocol

| Sense | Output |
|---|---|
| **Sound** | A calibrated soundscape (see §5) |
| **Scent** | Essential-oil blend with an action and delivery method |
| **Taste** | Herbal tea blend with ingredients + preparation |
| **Body** | Breath pattern, movement, posture, touch, orientation |
| **Sight** | Color palette + sacred-geometry shape + 5-phase motion |

All five derive from the same protocol and are meant to act as one calibration, adjusting together to the corrective direction when a state imbalance is detected.

---

## 5. Audio architecture (dual-layer)

Two layers play simultaneously in every session:

- **Tone.js synthesis** — exact planetary frequencies from the Cousto cosmic octave (e.g. Sun 126.22 Hz, Mars 144.72 Hz), with chord beds, melodic motifs, and a 5-phase arrangement (Entry → Activation → Peak → Regulation → Integration).
- **Recorded music layer** — real-instrument tracks (globally sourced: kora, ney, shakuhachi, cello, singing bowls, etc.) matched to the user's dominant planet and polarity state, streamed from a CDN.

The session UI shows a track indicator. Audio is designed to be calming and musical, evolving across the 5 phases, and to apply the corrective character when an imbalance is detected (e.g. an "excess" state pulls a regulating, opposite-character track).

---

## 6. Determinism

**The same birth data + the same symptoms must always produce the same output** — same chart, same protocol, same colors, same breath, same music track. There is no randomness in protocol generation and no AI-generated audio or text in the output. (Symptoms can change between visits → state may shift → corrective direction may differ; the underlying birth signature stays identical.)

---

## 7. Other surfaces

- **Natal Chart Wheel** — interactive SVG zodiac wheel (signs, Placidus houses, aspect lines, planet glyphs; "☉ Solar Chart" badge when birth time unknown).
- **Body Map** — holographic body with chakra nodes (frequency + Sanskrit name) and planetary body-region overlays; front/back, body-type, and view-mode toggles.
- **Cosmic Weather / Transit Protocols** — current sky transits to the natal chart, each with its own mini-protocol.
- **Daily Home** — returning users land on a daily screen (greeting, weather, daily mineral, symptom check-in, evening session).
- **Practitioner mode** — clinical terminology, exact Hz, session notes, PDF export, and a tuning-fork ("Sacred Tones") session guide. Gated to premium.

---

## 8. Access tiers

| Tier | Price | Access |
|---|---|---|
| Individual | $9.95/mo | Full personal protocol, daily home, body map, chamber |
| Practitioner | $39.95/mo | + clinical terminology, client roster, session notes, PDF export |
| Verified Practitioner | $59/mo | + verified badge, insurance-grade summaries, referral templates |

Free use is possible without an account (sessions not saved). Alternate billing rail: XRP (5 XRP = one year equivalent).

---

## 9. Technical specification

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Hosting | Vercel |
| Styling | Tailwind CSS |
| State | Zustand (persisted to localStorage) |
| Auth | NextAuth.js (email/password + Google OAuth) |
| Ephemeris | astronomy-engine (NASA-JPL) |
| Geocoding | OpenStreetMap Nominatim + tz-lookup (offline timezone) |
| Synthesis audio | Tone.js (Web Audio) |
| Music audio | MP3 streamed from Cloudflare R2 (public CDN) |
| Visuals | Native Canvas / SVG (chart wheel, body map, session geometry) |
| Payments | XRPL |
| PDF | jsPDF |

- **Platforms:** modern desktop + mobile browsers; installable PWA (Add to Home Screen).
- **Audio:** headphones recommended (binaural layer + spatial mix).
- **Caching:** PWA caches aggressively — a hard refresh loads the latest build.

---

## 10. Compliance posture

Astryx is positioned as the reference instrument; a licensed practitioner is the diagnostician. Every output-facing assessment uses probabilistic framing and carries a persistent disclaimer (`ⓘ Reference tool · Not medical advice`). Safety warnings from the underlying data (e.g. toxicity notes on certain minerals) are surfaced in the UI. It is not a substitute for professional medical or mental-health care.

---

*ASTRYX — a deterministic instrument that identifies what is active in a person's pattern and calibrates what would balance it.*
