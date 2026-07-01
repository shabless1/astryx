# ASTRYX — Master Play Document v2.0
### Strategic Architecture Before Code | June 2026

---

## The North Star

Astryx is a **personalized sensory recalibration instrument** built around SHA's 10 custom
planetary tuning forks. The natal chart is the diagnostic blueprint. The forks are the primary
physical intervention. Every other layer — color, crystal, herb, breath, direction, chakra,
sacred geometry — reinforces the same planetary frequency signal.

Every session must be **completely unique** to the client's chart, their current transits,
and what they report experiencing right now. The app computes the correct assessment and
builds a full multi-sensory recalibration plan. The client does not need to know astrology.

---

## The 5 Core Inputs → 1 Unified Output

```
NATAL CHART (planets, aspects, houses, ASC/MC)
       +
CURRENT TRANSITS (real-time planetary positions vs natal)
       +
STRUCTURED INTAKE (symptom questions mapped per planet)
       +
FREE-TEXT NARRATIVE ("what's going on with me right now")
       +
INTENTION ("I want to feel more...")
       ↓
ACTIVE PLANET LIST (ranked 1–3 by urgency)
       ↓
FULL RECALIBRATION PROTOCOL (10 sensory layers)
```

---

## PLAY A — Intelligent Intake Redesign

**Goal:** Transform the intake from a generic form into a diagnostic conversation that maps
exactly to planetary domains. The free-text field is the most important new element — it lets
the client speak naturally, and the app (via Claude API interpretation) maps their words to
the correct planets without them needing astrological vocabulary.

### A1 — Planet-Mapped Structured Questions

Each question domain traces to one or two planets. Answers score 0–10 per planet.

| Domain | Questions | Planet(s) |
|--------|-----------|-----------|
| Vitality & identity | Low energy? Heart palpitations? Back pain? Lack of confidence or purpose? | Sun |
| Emotion & cycles | Emotional swings? Poor sleep? Digestive upset? Hormonal fluctuation? | Moon |
| Mind & nervous system | Scattered thinking? Anxiety? Breathing issues? Communication breakdown? | Mercury |
| Connection & beauty | Relationship stress? Skin flare-ups? Lower back pain? Creative blocks? | Venus |
| Drive & inflammation | Headaches? Fever? Frustration? Joint heat? Anger or confrontation? | Mars |
| Expansion & excess | Digestive sluggishness? Weight fluctuation? Over-commitment? Liver/hip issues? | Jupiter |
| Structure & restriction | Chronic pain? Joint/bone issues? Fear? Felt blocked or burdened? | Saturn |
| Disruption & awakening | Sudden unexpected changes? Electric or nerve sensations? Feeling disconnected from old identity? Need to break free? | Uranus |
| Dissolution & immunity | Foggy thinking? Immune weakness? Unclear direction? Feeling invisible or ungrounded? Spiritual confusion? | Neptune |
| Transformation & power | Deep unavoidable shifts? Obsessive thoughts? Reproductive symptoms? Power struggles? Grief or death/rebirth themes? | Pluto |

### A2 — Free-Text Narrative Field

**Label:** "In your own words, what's going on with you right now? What brought you here today?"

**Processing:**
**Method: Claude API PRIMARY + offline keyword dictionary FALLBACK.**
(See Play A Recommendation section below for full rationale.)

- **Primary — Claude API interpretation:**
  Sends the full narrative to Claude with a system prompt that instructs it to score
  all 10 planets (Sun through Pluto) 0–10 based on the language used, including
  metaphor, emotion, and indirect symptom language. Returns:
  ```json
  {
    "scores": { "Sun": 2, "Moon": 7, "Mercury": 3, "Venus": 1, "Mars": 4,
                "Jupiter": 1, "Saturn": 8, "Uranus": 5, "Neptune": 6, "Pluto": 3 },
    "reasoning": "Phrases like 'carrying the weight of the world' and 'everything is grinding to a halt' correlate with Saturn themes...",
    "primaryPlanets": ["Saturn", "Moon", "Neptune"]
  }
  ```

- **Fallback — offline keyword dictionary (all 10 planets):**
  - Sun: "exhausted, no purpose, heart, back, confidence, visibility, burned out"
  - Moon: "can't sleep, emotional, crying, stomach, hormones, mood swings, mother"
  - Mercury: "anxious, scattered, can't focus, nervous, breathing, communication, racing thoughts"
  - Venus: "relationship, heartbreak, skin, lower back, beauty, money, creative block"
  - Mars: "angry, frustrated, headache, inflamed, fever, adrenaline, conflict, drive"
  - Jupiter: "bloated, too much, liver, hips, overcommitted, financial excess, weight"
  - Saturn: "stuck, blocked, joints, bones, chronic, fear, burden, restriction, aging"
  - Uranus: "chaotic, disrupted, electricity, nerve, sudden, shocking, need to break free, awakening"
  - Neptune: "foggy, confused, dissolving, invisible, immune, lymph, addiction, spiritual, feet"
  - Pluto: "obsessed, power struggle, grief, death, rebirth, transformation, control, deep, reproductive"

- Combined score: Claude API (65% weight) + structured questions (25% weight) + keyword match (10% weight)

### A3 — Intention / Goal Field

**Label:** "What do you want to feel at the end of this session? What are you calling in?"

**Examples → mapping:**
- "Peace, calm, groundedness" → Earth energy, Saturn/Moon balance
- "Clarity, focus, direction" → Mercury/Sun activation
- "Love, connection, creativity" → Venus activation
- "Strength, courage, momentum" → Sun/Mars activation
- "Release, let go, surrender" → Neptune/Pluto work

The intention shapes the *tone* of the recalibration prescription — same active planets,
but the session language, crystal choice, and breath practice orient toward the stated goal.

### Play A Recommendation — Claude API Primary

**Use Claude API as the primary interpretation method.** Here's why:

The offline keyword dictionary is literal. It catches "joints" → Saturn and "can't sleep" → Moon.
But clients don't speak in symptoms. They speak in lived experience:

- "I feel like I'm carrying the weight of the world" → Saturn (no keywords match, but meaning is unmistakable)
- "I keep dissolving into other people" → Neptune / Moon
- "Something in me is dying and being reborn" → Pluto
- "I'm finally done tolerating things that don't serve me" → Uranus awakening
- "My body feels electric and I can't sit still" → Uranus / Mars
- "I've lost all desire for anything" → Venus / Moon / Neptune

Claude API reads all of this correctly. The keyword dictionary gets maybe 40% of it.

**Architecture decision:**
- API primary (65% weight of free-text score)
- Keyword dictionary fallback (fires automatically when API is unavailable)
- Structured questions (always-on, 25% of total score)
- Ensures broad spectrum — no client's narrative gets reduced to literal symptom words

**Required:** Add `ANTHROPIC_API_KEY` to `.env.local` and Vercel env vars before Play A launches.

---

## PLAY B — Engine Upgrade: Tri-Source Scoring

**Goal:** Produce a ranked active-planet list that combines natal chart strength, current
transit pressure, and intake symptom data. Include transit explanation text — the "why now."

### B1 — Scoring Formula

```
Planet Score = (Natal Weight × 0.35) + (Transit Pressure × 0.40) + (Symptom Score × 0.25)
```

**Natal Weight:** Determined by:
- Is this planet in a prominent house (1, 4, 7, 10)? +2
- Is this planet conjunct ASC, MC, DSC, or IC? +3
- Is this planet in domicile or exaltation? +1
- Does this planet rule the chart ruler's sign? +2
- Is this planet involved in the dominant aspect pattern? +2

**Transit Pressure (real-time):** Calculated by astronomy-engine against current date:
- Transiting planet conjunct natal planet: +5
- Transiting planet square natal planet: +4
- Transiting planet opposition natal planet: +4
- Transiting planet trine natal planet: +2
- Transiting planet sextile natal planet: +1
- Within 2° of exact = "applying" (highest pressure)
- 2–5° past exact = "separating" (diminishing)

**Symptom Score:** Normalized 0–10 from structured intake + free-text NLP.

### B2 — Output Structure

```typescript
interface ActivePlanet {
  planet: string              // "Saturn"
  score: number              // 7.8 out of 10
  urgency: 'critical' | 'elevated' | 'active'
  transitDescription: string  // "Saturn is transiting your natal Moon..."
  calibrationWindow: string   // "Optimal window: now through July 14, 2026"
  bodyRegions: string[]       // ["spine", "joints", "knees", "teeth"]
  chakra: string              // "Root"
  element: string             // "Earth"
  direction: string           // "North"
}
```

### B3 — Transit Explanation Text

Plain language explanation generated from transit data:

*"Saturn is currently transiting your natal Moon in Pisces. This configuration may correlate
with emotional heaviness, a sense of restriction in your feelings, and physical manifestations
around the joints and lower extremities. This is also a window of deep structural emotional
work. The exact transit peaks June 28 — the most potent recalibration window is the 10 days
surrounding this date."*

---

## PLAY C — Body Map Upgrade

**Goal:** The body map becomes the diagnostic visual hub of the app. It shows at a glance
which areas need recalibration, where to place the forks and crystals, which chakras are
involved, and which nerve plexuses are affected.

### C1 — Five Overlay Layers (toggleable)

1. **Medical astrology regions** (existing) — planetary body region glow
2. **Tuning fork placement points** — precise anatomical points from sacredTones_nervousSystem.json
   - Each point labeled with fork name and Hz
   - Shows bone application points, nerve plexus entry points
3. **Crystal placement** — body placement for this session's crystal
4. **Chakra centers** — 7 main chakras with planet color overlay
5. **Nerve plexus network** — vagal nerve pathway + key plexus points

### C2 — Interaction Model

**Click any highlighted region →** Side panel opens with:
- Planet governing this region
- Sign in that house
- Active symptoms mapped to this area
- Which tuning fork addresses this region
- Fork placement instruction ("Place at the sternum, apply firm contact, hold 45 seconds")
- Crystal to place here
- Which chakra is nearby

**Click the tuning fork icon on a body point →** Launch that step in the session sequencer

---

## PLAY D — Session Screen Full Rebuild

**Goal:** Replace the breathing-only screen with a guided multi-sensory recalibration
experience that walks the client through their complete protocol step by step. Every step
is unique to their chart and current assessment.

### D1 — Session Step Sequencer (10 steps)

```
Step 1: PREPARE SPACE
  → Face [direction] (compass based on dominant element)
  → Set lighting: [planet color] candle or warm light filter
  → Begin diffusing: [scent blend] — diffuser start time 10 min before

Step 2: PREPARE TEA
  → Blend: [planet herb blend] — from sacredBotanicals.json
  → Steep: [X] minutes at near-boil
  → Intention: hold the cup and state your intention before drinking

Step 3: CRYSTAL ACTIVATION + PLACEMENT
  → Crystal: [crystal name] — why this crystal for this planet
  → Activation: Strike the [fork name] fork and hover 3" above crystal for 30 seconds
  → Placement: [body location diagram] — place on [area] during session

Step 4–8: TUNING FORK SEQUENCE (or Symphony Mode)
  → If physical forks available:
    Each fork gets its own step:
    "Step 4: [Fork name] — [Hz] Hz
     Apply to: [anatomical point]
     Method: [bone conduction / near-field / held near chakra]
     Hold: [X] seconds — observe breath response
     Vagal connection: [vagusStrength]"
  → If no physical forks (Symphony Mode):
    The app generates a live planetary symphony using Cousto frequencies
    All active planet tones layered simultaneously
    Generative melody from planetary scale
    Full immersive audio experience (see D3)

Step 9: BREATH + VISUALIZATION
  → Breath pattern: [element-based, not just 4-7-8]
    - Earth (Saturn/Capricorn/Taurus/Virgo): 4 count box breath
    - Fire (Sun/Mars/Aries/Leo/Sagittarius): Breath of fire
    - Water (Moon/Cancer/Scorpio/Pisces): 4-7-8 extended exhale
    - Air (Mercury/Gemini/Libra/Aquarius): Alternate nostril
  → Visualization: Sacred geometry pattern for dominant aspect
  → Color field: Full-screen pulse in planet color at session Hz rate

Step 10: CLOSE + GROUND
  → Strike Earth Day fork (194.18 Hz) if available
  → Drink remaining tea
  → Record: How do you feel now? (1–10 for each symptom)
  → SOAP note auto-generated from session data
```

### D2 — Fork Sequence Data Structure

From sacredTones_nervousSystem.json — each fork step populates:

```typescript
interface ForkStep {
  forkName: string          // "Saturn"
  hz: number                // 147.85
  placement: {
    bonePrimary: string     // "Lumbar vertebrae L3-L5"
    nervePlexus: string     // "Lumbar plexus"
    chakra: string          // "Root"
    clinicalNote: string    // compliance-cleared description
  }
  holdDuration: string      // "45–60 seconds. Observe breath response."
  vagusStrength: string     // "High"
  binauralOffset: number    // 2.5 (Hz offset for binaural when using app audio)
  applicationMethod: string // "bone conduction — apply stem to L3 spinous process"
}
```

### D3 — Planetary Symphony Generator (no-fork mode)

When the client does not have physical tuning forks, the app generates a real-time
immersive planetary composition. This is generative music, not a recording.

**SET 1 — SHA's 10 Planetary Tuning Forks (current)**

| Planet | Cousto Hz | Note | Mode | Body Focus |
|--------|-----------|------|------|------------|
| Sun | 126.22 | B | Lydian | Heart, spine, vitality |
| Moon | 210.42 | G# | Phrygian | Digestion, hormones, lymph |
| Mercury | 141.27 | C# | Dorian | Nervous system, lungs, hands |
| Venus | 221.23 | A | Mixolydian | Kidneys, skin, throat, lower back |
| Mars | 144.72 | D | Aeolian | Adrenals, head, musculature |
| Jupiter | 183.58 | F# | Ionian | Liver, hips, pituitary |
| Saturn | 147.85 | D | Locrian | Bones, joints, knees, teeth |
| Uranus | 207.36 | G# | Phrygian Dominant | Nervous system, ankles, biofield |
| Neptune | 211.44 | G# | Lydian b7 | Immune, lymph, pineal, feet |
| Pluto | 140.25 | C# | Diminished | Reproductive, elimination, cellular |

**SET 2 — Earth Resonance Forks (SHA creating after app completion)**

| Fork | Hz | Source | Purpose |
|------|----|--------|---------|
| Earth Day | 194.18 | Cousto | G — grounding regulator, present in every session |
| Earth Year (Om) | 136.10 | Cousto | C# — universal anchor, always in Layer 1 |
| Earth Platonic Year | 172.06 | Cousto | F — long-cycle cosmic alignment |
| Schumann Resonance | 7.83 | Earth EM field | Deepest ground state, theta brain sync |
| Schumann 2nd Harmonic | 14.3 | Earth EM field | Alpha transition, clarity |

**SET 3 — Solfeggio Forks (SHA creating after app completion)**

| Solfeggio | Hz | Traditional Purpose | Planetary Resonance |
|-----------|----|--------------------|---------------------|
| UT | 396 | Liberation from fear | Saturn / Mars |
| RE | 417 | Facilitating change | Uranus |
| MI | 528 | Transformation / DNA repair | Sun / Pluto |
| FA | 639 | Connecting / relationships | Venus / Moon |
| SOL | 741 | Awakening intuition | Mercury / Neptune |
| LA | 852 | Returning to spiritual order | Jupiter |
| SI | 963 | Divine connection | Neptune / Pluto |
| Extended 174 | 174 | Pain reduction, grounding | Saturn |
| Extended 285 | 285 | Cellular regeneration | Sun / Moon |

**Symphony Architecture (Tone.js layers):**

```
Layer 1 — DRONE: Active planet fundamental Hz (sustained sine, long attack)
Layer 2 — HARMONICS: Natural overtone series (2nd, 3rd, 4th harmonic, low volume)
Layer 3 — MELODIC: Generative melody from planet's scale — 4-note phrases, slow tempo
Layer 4 — COUNTER: Secondary active planet drone (right channel, slightly detuned)
Layer 5 — PULSE: Aspect-derived LFO (trine 0.12 Hz, conjunction 0.08 Hz, etc.)
Layer 6 — BINAURAL: 4–7 Hz theta binaural beat (deepens meditative state)
Layer 7 — NATURE: Ambient texture appropriate to element (fire crackle, water, wind, earth)
Layer 8 — SOLFEGGIO: Aspect-mapped solfeggio tone (existing, ultra-low volume)
```

**Customization controls visible during session:**
- Fork tones only / Symphony / Hybrid
- Tempo (slow / med / immersive)
- Volume per layer (advanced mode)
- Duration (20 / 40 / 60 min)

---

## PLAY E — Design System Overhaul

**Goal:** The design should match the caliber of the concept. Dark does not mean flat.
Every element must be readable, dramatic, and purposeful.

### E1 — Core Problems to Fix

| Problem | Fix |
|---------|-----|
| Text-white/40 everywhere unreadable | Primary text: 100% white. Secondary: 75% lavender-white |
| Flat black background | Layered cosmic depth: deep indigo aurora + nebula gradients + star field |
| All cards look the same | Each active planet card takes on that planet's color tint |
| Glow used as decoration | Glow used ONLY as accent and for active/playing states |
| Hz numbers too small | Large hero typography (28–36px) for primary diagnostic data |
| Session screen blank | Full planetary color field + geometry + fork guidance |

### E2 — Per-Planet Color Identity

When a planet is active, its color bleeds into the entire screen context:

| Planet | Color Name | Hex | Card Border Alpha | Background Tint Alpha |
|--------|------------|-----|-------------------|-----------------------|
| Sun | Gold | #F59E0B | 0.35 | 0.04 |
| Moon | Silver Lavender | #E0D9F5 | 0.35 | 0.03 |
| Mercury | Electric Cyan | #38BDF8 | 0.35 | 0.03 |
| Venus | Rose | #FB7185 | 0.35 | 0.03 |
| Mars | Crimson | #F87171 | 0.35 | 0.03 |
| Jupiter | Royal Violet | #A78BFA | 0.35 | 0.03 |
| Saturn | Steel Blue | #94A3B8 | 0.35 | 0.03 |
| Uranus | Ice Aqua | #67E8F9 | 0.35 | 0.03 |
| Neptune | Deep Indigo | #818CF8 | 0.35 | 0.03 |
| Pluto | Dark Magenta | #C084FC | 0.35 | 0.03 |
| Earth Day | Forest Green | #4ADE80 | 0.30 | 0.02 |
| Solfeggio | Warm White | #FFF9E6 | 0.25 | 0.02 |
| Schumann | Earth Brown | #D97706 | 0.25 | 0.02 |

### E3 — Typography Rules

- All headings: Cinzel, full white (#FFFFFF), never less than 80% opacity
- All body text: Exo 2, 87% white (rgba(255,255,255,0.87))
- Labels/captions: 55% white max — used only for non-critical metadata
- Planet data (Hz, score): Large Cinzel, planet accent color, full opacity
- No text below 12px in session-critical areas

---

## PLAY F — Chart Wheel Full Interactivity

**Goal:** Every element of the natal chart wheel is interactive and educational.

### F1 — Click Targets

**Click a planet glyph:**
- Expand panel: Planet in [sign], [house] house
- Body regions governed
- Current transit status ("Saturn is transiting your natal Moon")
- Tuning fork for this planet: [name] at [Hz]
- Which chakra, element, direction
- "Add to session" button

**Click an aspect line:**
- Aspect type, orb, applying/separating
- What this aspect may correlate with (physical, emotional, psychological)
- Both planets' body regions — where the tension or harmony manifests physically
- Recalibration approach for this aspect
- Which fork combination addresses it

**Click a house cusp:**
- House themes and life domains
- Planets in this house and their current activation status
- Transit activity in this house

---

## Build Sequence (Dependency Order)

```
PLAY A  →  PLAY B  →  PLAY C  →  PLAY D  →  PLAY E  →  PLAY F
Intake     Engine      Body Map    Session     Design     Chart
                                   + Music     Overhaul   Interactivity
```

Each play is a complete, testable unit before the next begins.
PLAY A is the foundation — without corrected intake, the engine produces wrong results.
PLAY E happens last because design should wrap correct content, not the other way around.

---

## Sound Issue (Pre-Play D Blocker)

The current Tone.js audio engine is not playing in production. Root causes identified:
1. AudioContext not fully awaited before engine reports ready (partially fixed)
2. Tone.Reverb.generate() async failure silently kills the chain in some browsers
3. Session screen design doesn't make the audio trigger obvious enough

**Decision:** Rather than continue patching the current engine, PLAY D will include a
full sound engine architectural review. The symphony generator (D3) represents a complete
upgrade to the audio system. The current engine remains as fallback; the new system
replaces it for all session-mode audio.

---

## Data Files Needed for Plays A–D

All data already exists in `/src/data/`. No new data files required for the core plays.
The following existing files are the source of truth:

| Play | Data Files Used |
|------|----------------|
| A | symptoms.json (expand), new: planet-intake-map.json |
| B | planets.json, aspects.json, houses.json, signs.json |
| C | sacredTones_nervousSystem.json, crystalsExpanded.json, signs.json |
| D | sacredTones_nervousSystem.json, sacredBotanicals.json, planetary-anchors.json, body-protocols.json, herbs.json, scents.json, colors.json |
| E | colors.json, design system tokens |
| F | aspects.json, planets.json, soap-templates.json |

New data file needed: `planet-intake-map.json` — maps each question to planet(s) with weight

---

*Astryx v2.0 Play Document | SHA Blyss | Sacred Vault Holdings*
*All concepts, frameworks, and proprietary system design are the intellectual property of SHA Blyss.*
*This document is confidential and protected.*
