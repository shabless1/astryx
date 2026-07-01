# ASTRYX — Suno Music Library: Methodology & Developer Handoff
**Version:** 1.0  
**For:** Next developer working on multi-planet tier extension  
**Author:** Astryx Build Session — June 2026

---

## 1. WHAT THE MUSIC SYSTEM DOES (Plain Language)

Every Astryx session plays two simultaneous audio layers:

**Layer 1 — Tone.js synthesis** (always active)  
Mathematically precise planetary Hz frequencies generated in real time. These are the exact cosmic octave frequencies calculated by Hans Cousto from planetary orbital periods. They run as sustained tones underneath everything.

**Layer 2 — Suno Music** (requires `NEXT_PUBLIC_AUDIO_BASE_URL` env var)  
Real instrument recordings — cello, singing bowls, kora, shakuhachi, gamelan — generated to match the planetary character and polarity state. These sit on top of the Tone.js layer. Together they produce sound that is both scientifically grounded AND musically human.

The Suno layer is what SHA calls "de-harshed" audio — real instruments instead of pure drone tones.

---

## 2. HOW TRACKS ARE CATEGORIZED

### The Grid: 10 Planets × 4 States × ~4 Variants

```
PLANET   × STATE  × VARIANT = TRACK
MARS     × EXC    × 02      = MARS_EXC_02.mp3
MOON     × NAT    × 01      = MOON_NAT_01.mp3
SATURN   × DEF    × 03      = SATURN_DEF_03.mp3
```

**10 Planets:**  
Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto

**4 States:**
| Code | Name | Meaning |
|------|------|---------|
| `nat` | Natural | Balanced — planet operating normally |
| `exc` | Excess | Overactive — too much of this planet's energy |
| `def` | Deficiency | Underactive — not enough of this planet's energy |
| `blk` | Blocked | Energy present but unable to flow (stuck, frozen) |

**~4 Variants per combination** — provides variety; selected deterministically (same birth data = same track every time).

**Total library: 172 tracks**

**R2 Storage Path:**  
`https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev/{PLANET}/{STATE}/{PLANET}_{STATE}_{NN}.mp3`  
Example: `.../MARS/EXC/MARS_EXC_02.mp3`

---

## 3. THE CORRECTIVE FRAMEWORK — THE MOST IMPORTANT CONCEPT

**This is non-obvious and must be understood before touching the music system.**

### nat tracks = AMPLIFY the planet's character

A `nat` track sounds like the planet. Mars NAT sounds like Mars — driving, percussive, energetic, D Aeolian, 72 BPM. You play this when the user's Mars is balanced and you want to activate it.

### exc/def/blk tracks = COUNTERACT with a DIFFERENT planet's character

A corrective track does NOT sound like the primary planet. It uses a different planet's Hz, BPM, mode, and instruments to balance the excess or deficiency.

**Example — Mars Excess:**
- User reports: anger, inflammation, overstimulation
- What they DON'T need: more Mars energy (percussion, driving beats)
- Corrective planet: Moon
- Mars EXC tracks are: **G# Phrygian, 53 BPM, ZERO percussion, cooling instruments** (cello, singing bowls, soft harp, sustained strings)
- The track sounds like Moon, not Mars
- If it sounds like Mars — it failed. Regenerate it.

**How to identify the corrective planet for each state:**

| Planet | EXC corrective | DEF corrective | BLK corrective |
|--------|---------------|----------------|----------------|
| Sun | Moon | Mars | Mercury |
| Moon | Saturn + Mercury | Sun | Venus |
| Mercury | Saturn | Moon | Sun |
| Venus | Mars | Moon | Jupiter |
| Mars | Moon ⚠️ | Sun | Venus |
| Jupiter | Saturn | Venus | Sun |
| Saturn | Venus + Jupiter | Mars | Moon |
| Uranus | Saturn | Sun | Mercury |
| Neptune | Mercury + Saturn | Venus | Mars |
| Pluto | Venus | Jupiter | Saturn |

⚠️ **Mars Excess is the most clinically critical state in the library.** This is a user reporting anger, inflammation, heat, or rage. The music MUST be genuinely cooling and calming. Zero percussion of any kind.

---

## 4. BPM MATH — TEMPO IS THE FREQUENCY OCTAVED DOWN

Every BPM in the library is mathematically derived from the corrective planet's Cousto Hz:

```
Cousto Hz ÷ 2 = BPM (faster planets: Sun, Moon, Mercury, Venus, Mars)
Cousto Hz ÷ 4 = BPM (slower planets: Jupiter, Saturn, Uranus, Neptune, Pluto)
```

Examples:
- Moon: 210.42 ÷ 4 = 52.6 → **53 BPM** (used for all Moon-character corrective tracks)
- Mars: 144.72 ÷ 2 = 72.4 → **72 BPM** (Mars NAT)
- Saturn: 147.85 ÷ 4 = 36.9 → **~49 BPM** (Saturn NAT and some corrective tracks)

The BPM is not arbitrary. Tempo IS the frequency, octaved down into the audible rhythm range.

---

## 5. CURRENT ARCHITECTURE (Single Planet)

### Data Flow

```
Intake symptoms + chart
        ↓
Protocol engine scores each planet
        ↓
Dominant planet identified
        ↓
ChamberDNA created:
{
  seed: number,              // derived from birth data — deterministic
  primaryPlanet: 'mars',
  applyCorrective: true,
  polarity: {
    dominant_state: 'excess'
  }
}
        ↓
stateFromChamberDNA(dna) → 'exc'
        ↓
selectTrackFilename('mars', 'exc', seed) → 'MARS_EXC_02'
        ↓
buildTrackUrl() → full R2 URL
        ↓
sunoPlayer.load(url) → sunoPlayer.play(3s fade)
        ↓
Session plays one track, volume changes by phase
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/sunoLibrary.ts` | Track catalog (CATALOG object), all track names, selection logic |
| `src/lib/sunoPlayer.ts` | HTMLAudioElement manager, phase volume, fade in/out |
| `src/components/engine/SoundEngineController.tsx` | Wires sunoPlayer into session, shows LIVE/ERR badge |
| `src/types/index.ts` | ChamberDNA type definition |

### Phase Volume System (sunoPlayer.ts)

The single track plays throughout but volume shifts by session phase:

```typescript
const PHASE_VOLUME = {
  entry:      0.60,
  activation: 0.80,
  peak:       1.00,    // loudest at peak
  regulation: 0.75,
  integration: 0.50    // quietest at close
}
const SUNO_LEVEL = 0.80  // master level multiplier
```

### Deterministic Selection

```typescript
Math.abs(seed) % tracks.length
```

Same birth data = same seed = same track index = same track every session. This is intentional — each user has a "signature track" for their chart. It creates personal resonance.

---

## 6. EXTENDING TO THREE-PLANET TIERS — RECOMMENDED APPROACH

### The New Model: Dominant / Secondary / Tertiary

The scoring engine already calculates scores for all 10 planets. The top 3 can be surfaced as primary, secondary, tertiary.

### Recommendation: Phase-Linked Track Cycling

Map the three planets to the five session phases:

```
Phase 1-2 (Entry + Activation) → Primary planet track
Phase 3   (Peak)                → Secondary planet track
Phase 4-5 (Regulation + Integration) → Tertiary planet track
```

**Why this works:**
- The session has a natural narrative arc: introduction → deepening → integration
- Primary planet (most urgent) gets the first impression and full activation
- Secondary planet deepens the experience at the peak
- Tertiary planet guides the close, landing the session in integration
- Each planet's polarity state independently determines which track plays (nat/exc/def/blk)

This mirrors the Tone.js 6-channel system, which already plays:
- Primary planet Hz on left channel
- Secondary planet Hz + binaural on right channel
- Earth Om in center

The Suno music layer should mirror this hierarchy over time.

### Required ChamberDNA Extension

```typescript
interface ChamberDNA {
  seed: number
  primaryPlanet: string
  secondaryPlanet?: string        // NEW
  tertiaryPlanet?: string         // NEW
  applyCorrective: boolean
  polarity: {
    dominant_state: PolarityState
    secondary_state?: PolarityState   // NEW
    tertiary_state?: PolarityState    // NEW
  }
}
```

### Required sunoPlayer Extension

Add a `setActivePlanet(planet, state, seed)` method that cross-fades tracks:

```typescript
// Called by SoundEngineController on phase change
sunoPlayer.setActivePlanet('saturn', 'nat', seed)  // cross-fade to secondary track at peak
```

Cross-fade duration: 3-5 seconds. The outgoing track fades down while the incoming track fades up.

### Required SoundEngineController Extension

```typescript
// Pre-resolve all three tracks at session start
const primaryTrack   = resolveTrack(chamberDNA, 'primary')
const secondaryTrack = resolveTrack(chamberDNA, 'secondary')
const tertiaryTrack  = resolveTrack(chamberDNA, 'tertiary')

// On phase change
setOnPhaseChange(phase => {
  sunoPlayer.setPhase(phase)   // volume
  if (phase === 'peak') {
    sunoPlayer.crossFadeTo(secondaryTrack.url, 4000)
  }
  if (phase === 'regulation') {
    sunoPlayer.crossFadeTo(tertiaryTrack.url, 4000)
  }
})
```

### Alternative: Simpler Playlist Queue

If cross-fading is too complex for the current timeline, use a sequential playlist:

```typescript
const playlist = [primaryTrack, secondaryTrack, tertiaryTrack]
// Play primary for the first 40% of session duration
// Play secondary for middle 35%
// Play tertiary for final 25%
```

This is simpler but less synchronized with session phases.

### Polarity State Per Planet — Independent Scoring

Each planet in the tier gets its own state evaluated independently:

```
Primary: Mars → excess → plays MARS_EXC_02 (Moon character)
Secondary: Saturn → nat → plays SATURN_NAT_01 (Saturn character)
Tertiary: Mercury → def → plays MERCURY_DEF_03 (Moon/Sun character)
```

The same corrective logic applies to each planet independently. A balanced secondary planet plays its NAT track even if the primary is in excess.

---

## 7. IMPORTANT RULES — DO NOT CHANGE

1. **Hz frequencies come from `planetary-anchors.json` only.** Never use other Hz values.

2. **The corrective planet table (Section 3) is canonical.** Do not reassign which planet corrects which without consulting SHA.

3. **Mars Excess = zero percussion, always.** No drums, no frame drum, no rhythmic pulse. Cooling instruments only. This is a safety consideration — users in this state may be in genuine distress.

4. **Deterministic selection must be preserved.** `Math.abs(seed) % tracks.length` must remain the selection mechanism. Do not add randomization.

5. **NEXT_PUBLIC_AUDIO_BASE_URL gates the entire layer.** If not set, the Suno layer is silently bypassed. Tone.js still runs. This is the feature flag — respect it.

6. **Track naming convention is fixed:** `{PLANET}_{STATE}_{NN}` all caps. Do not rename tracks.

7. **R2 folder structure is fixed:** `{PLANET}/{STATE}/{PLANET}_{STATE}_{NN}.mp3`. Do not restructure.

---

## 8. WHAT NEEDS TO BE SET IN VERCEL BEFORE AUDIO WORKS

```
NEXT_PUBLIC_AUDIO_BASE_URL = https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev
```

Without this, the music layer is completely silent (by design). Add it in Vercel dashboard → Project Settings → Environment Variables.

---

## 9. CURRENT GAP TO FIX BEFORE THREE-PLANET WORK

Before implementing multi-planet tiers, one structural bug must be fixed:

**The Results screen prescription cards (Sound, Scent, Taste, Body, Sight) pull from NAT planet data regardless of polarity state.** The corrective logic exists in ChamberDNA and the session engine, but does not pipe back to the prescription display layer.

Fix in `ResultsScreen.tsx`:
```typescript
// When state !== 'balanced', read prescription data from the CORRECTIVE planet
// not the primary planet's NAT data
if (polarity.dominant_state !== 'balanced') {
  const correctivePlanet = getCorrectionTarget(primaryPlanet, polarity.dominant_state)
  // Pull Sound Hz, Scent, Taste, Body, Sight from correctivePlanet data
}
```

This fix must land first. The three-planet tier extension builds on top of a correctly functioning single-planet system.

---

*End of handoff document — June 2026*
