/**
 * ASTRYX Chamber — Aspect Behavior Engine
 *
 * Per Sha's directive (Chamber 2 §ASPECT BEHAVIOR ENGINE):
 *   "Aspects must influence sound. Current implementation appears to
 *    ignore this. Aspects should affect rhythm, harmony, movement, and
 *    phrasing."
 *
 * Translates the chamber's dominant aspect into concrete rhythmic and
 * spatial parameters consumed by the audio layer:
 *   - pulse rate
 *   - chord retrigger interval
 *   - melody rest factor (lengthens / compresses motif spacing)
 *   - panning sweep behavior
 *   - polyrhythm secondary voice timing
 *
 *   Conjunction → stacking / convergence / reinforcement (1:1)
 *   Opposition  → call-and-response / dialogue (2:1)
 *   Square      → tension / syncopation / interrupted rhythm (4:3)
 *   Trine       → flow / continuity (3:2)
 *   Sextile     → responsive / cooperative (6:5)
 *   Quincunx    → adjustment / asymmetric correction (5:6)
 *
 * Polyrhythm is kept subtle and chamber-like, never chaotic percussion.
 */

import type { ChamberDNA, AspectKey } from './ChamberDNAEngine'

export type RhythmPattern =
  | 'steadyPulse'
  | 'leftRightOscillation'
  | 'syncopatedInterrupted'
  | 'smoothContinuous'
  | 'responsivePulse'
  | 'irregularCorrection'

export interface AspectBehavior {
  /** Master pulse rate (Hz) for the master tremolo / pulse LFO */
  pulseHz: number
  /** Voice 2 rate as ratio of pulseHz (polyrhythm subtle layer) */
  voice2Ratio: number    // e.g. 1.5 for trine 3:2
  /** Chord retrigger interval — beats between chord pulses */
  chordIntervalBeats: number
  /** Multiplier on melody rest seconds (>1 = more space, <1 = tighter) */
  melodyRestFactor: number
  /** Panning swing in stereo width 0..1 */
  panSwing: number
  /** Panning LFO Hz */
  panRateHz: number
  /** Rhythm pattern label — informs UI + audio chain */
  rhythm: RhythmPattern
  /** When true, chord 2 enters as call-response (delayed reply) */
  callResponse: boolean
  /** When true, syncopated kick on offbeat */
  syncopated: boolean
  /** Stability 0..1 — informs subtle drift / glitch behavior in quincunx */
  stability: number
}

const ASPECT_BEHAVIORS: Record<AspectKey, AspectBehavior> = {
  conjunction: {
    pulseHz: 0.08,
    voice2Ratio: 1.0,            // 1:1 unison stacking
    chordIntervalBeats: 4,
    melodyRestFactor: 1.0,
    panSwing: 0.10,
    panRateHz: 0.05,
    rhythm: 'steadyPulse',
    callResponse: false,
    syncopated: false,
    stability: 0.95,
  },
  opposition: {
    pulseHz: 0.20,
    voice2Ratio: 2.0,            // 2:1 octave — bilateral dialogue
    chordIntervalBeats: 4,
    melodyRestFactor: 1.2,
    panSwing: 0.80,              // wide L/R dialogue
    panRateHz: 0.15,
    rhythm: 'leftRightOscillation',
    callResponse: true,
    syncopated: false,
    stability: 0.75,
  },
  square: {
    pulseHz: 0.60,
    voice2Ratio: 4 / 3,          // 4:3 cross-rhythm
    chordIntervalBeats: 3,
    melodyRestFactor: 0.85,      // tighter, urgent
    panSwing: 0.30,
    panRateHz: 0.40,
    rhythm: 'syncopatedInterrupted',
    callResponse: false,
    syncopated: true,
    stability: 0.55,
  },
  trine: {
    pulseHz: 0.12,
    voice2Ratio: 3 / 2,          // 3:2 perfect fifth feel
    chordIntervalBeats: 4,
    melodyRestFactor: 1.15,      // breathe more
    panSwing: 0.15,
    panRateHz: 0.08,
    rhythm: 'smoothContinuous',
    callResponse: false,
    syncopated: false,
    stability: 0.90,
  },
  sextile: {
    pulseHz: 0.25,
    voice2Ratio: 6 / 5,          // 6:5 minor third — light tension
    chordIntervalBeats: 4,
    melodyRestFactor: 1.0,
    panSwing: 0.20,
    panRateHz: 0.12,
    rhythm: 'responsivePulse',
    callResponse: true,
    syncopated: false,
    stability: 0.85,
  },
  quincunx: {
    pulseHz: 0.18,
    voice2Ratio: 5 / 6,          // 5:6 inverted — offset
    chordIntervalBeats: 5,        // odd-count
    melodyRestFactor: 1.1,
    panSwing: 0.25,
    panRateHz: 0.10,
    rhythm: 'irregularCorrection',
    callResponse: false,
    syncopated: true,
    stability: 0.40,
  },
}

export function getAspectBehavior(dna: ChamberDNA): AspectBehavior {
  return ASPECT_BEHAVIORS[dna.dominantAspect] ?? ASPECT_BEHAVIORS.conjunction
}
