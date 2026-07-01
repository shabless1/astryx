/**
 * ASTRYX Chamber — Scale Engine
 *
 * Planet → scale family. Returns scale step patterns (semitone offsets
 * from tonic) and a tonic note for the chamber. Deterministic — same DNA
 * always produces the same scale choice.
 *
 * Per Sha's directive (Chamber 2 §SCALE ENGINE):
 *   Mercury  → Lydian / Mixolydian / Pentatonic
 *   Venus    → Major / Dorian / Suspended
 *   Mars     → Minor (Aeolian) / Phrygian / Rhythmic modes (→ Dorian)
 *   Moon     → Aeolian / Dorian / Modal ambient (→ Dorian)
 *   Neptune  → Whole Tone / Ambient Modal (→ Lydian)
 *   Jupiter  → Major / Lydian
 *   Saturn   → Harmonic Minor / Sparse Modal (→ Phrygian)
 *   Sun      → Major / Lydian (default)
 *   Uranus   → Whole Tone / Lydian #4
 *   Pluto    → Phrygian / Harmonic Minor
 */

import type { ChamberDNA } from './ChamberDNAEngine'
import { createPRNG, seededPick } from './chamberSeed'

export type ScaleName =
  | 'major' | 'minor' | 'dorian' | 'phrygian'
  | 'lydian' | 'mixolydian' | 'aeolian'
  | 'harmonicMinor' | 'pentMajor' | 'pentMinor'
  | 'wholeTone' | 'lydianSharp4' | 'suspended'

// Semitone offsets from tonic.
const SCALE_STEPS: Record<ScaleName, number[]> = {
  major:         [0, 2, 4, 5, 7, 9, 11],
  minor:         [0, 2, 3, 5, 7, 8, 10],
  aeolian:       [0, 2, 3, 5, 7, 8, 10],   // = natural minor
  dorian:        [0, 2, 3, 5, 7, 9, 10],
  phrygian:      [0, 1, 3, 5, 7, 8, 10],
  lydian:        [0, 2, 4, 6, 7, 9, 11],
  mixolydian:    [0, 2, 4, 5, 7, 9, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  pentMajor:     [0, 2, 4, 7, 9],
  pentMinor:     [0, 3, 5, 7, 10],
  wholeTone:     [0, 2, 4, 6, 8, 10],
  lydianSharp4:  [0, 2, 4, 6, 7, 9, 11],   // same as lydian; reserved for future weighting
  suspended:     [0, 2, 5, 7, 9],          // sus + 9 + 13 feel
}

// Planet → ordered list of scale candidates. Index 0 is the default;
// the PRNG picks weighted by position (favors first).
const PLANET_SCALES: Record<string, ScaleName[]> = {
  Sun:     ['major', 'lydian'],
  Moon:    ['aeolian', 'dorian'],
  Mercury: ['lydian', 'mixolydian', 'pentMajor'],
  Venus:   ['major', 'dorian', 'suspended'],
  Mars:    ['minor', 'phrygian', 'dorian'],
  Jupiter: ['major', 'lydian'],
  Saturn:  ['harmonicMinor', 'phrygian'],
  Uranus:  ['wholeTone', 'lydian'],
  Neptune: ['wholeTone', 'lydian'],
  Pluto:   ['phrygian', 'harmonicMinor'],
}

// Planet → preferred tonic note (matches existing PLANET_MODES in soundEngine
// for continuity with the audible identity).
const PLANET_TONIC: Record<string, string> = {
  Sun: 'B', Moon: 'G#', Mercury: 'C#', Venus: 'A', Mars: 'D',
  Jupiter: 'F#', Saturn: 'D', Uranus: 'G#', Neptune: 'G#', Pluto: 'C#',
}

// Semitone offsets for note names from C.
const PITCH_CLASS: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
  'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
}

const PC_TO_NAME = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// ─── PUBLIC API ────────────────────────────────────────────────────

export interface ScalePlan {
  scaleName: ScaleName
  tonicNote: string         // e.g. 'D'
  tonicOctave: number       // e.g. 4
  steps: number[]           // semitones from tonic
  /** Full scale spanning given octaves as Tone.js note strings (e.g. 'D4', 'E4', ...) */
  notes: string[]
}

/**
 * Resolve the chamber's scale + tonic + concrete note list.
 * Octaves default to 3..5 covering bass + melody + harmony range.
 */
export function buildScalePlan(
  dna: ChamberDNA,
  opts: { octaveBase?: number; octaveSpan?: number } = {},
): ScalePlan {
  const octaveBase = opts.octaveBase ?? 3
  const octaveSpan = opts.octaveSpan ?? 3

  const rng = createPRNG(dna.seed ^ 0xA1A1A1A1)   // independent stream for scale choice

  // Phase C — when polarity correction applies, use the effectivePlanet
  // (regulator planet) for scale selection. AND if the polarity protocol
  // specifies a scale_override token, that takes priority over both planets.
  const override = dna.polarity?.protocol?.scale_override
  const overrideMap: Record<string, ScaleName> = {
    'major_soft':       'major',
    'major_bright':     'major',
    'lydian':           'lydian',
    'lydian_warm':      'lydian',
    'lydian_bright':    'lydian',
    'mixolydian':       'mixolydian',
    'mixolydian_clear': 'mixolydian',
    'dorian':           'dorian',
    'aeolian_soft':     'aeolian',
    'aeolian_deep':     'aeolian',
    'aeolian_grounded': 'aeolian',
    'phrygian_grounded':'phrygian',
  }
  const overridePick: ScaleName | null =
    (override && dna.applyCorrective) ? (overrideMap[override] ?? null) : null

  const planetForScale = dna.applyCorrective ? dna.effectivePlanet : dna.primaryPlanet
  const candidates = PLANET_SCALES[planetForScale] ?? PLANET_SCALES.Sun

  // Weighted pick favoring index 0 (default scale), then index 1, etc.
  // Simple decay: prob ∝ 1 / (1 + i). Deterministic via PRNG.
  const weights = candidates.map((_, i) => 1 / (1 + i))
  const total = weights.reduce((s, w) => s + w, 0)
  let r = rng() * total
  let pick: ScaleName = candidates[0]
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]
    if (r <= 0) { pick = candidates[i]; break }
  }

  // Override has final say (when polarity correction applies)
  if (overridePick) pick = overridePick

  // Tonic comes from effective planet so corrective key matches corrective character
  const tonicNote = PLANET_TONIC[planetForScale] ?? PLANET_TONIC[dna.primaryPlanet] ?? 'D'
  const steps = SCALE_STEPS[pick]

  // Generate full note list across requested octaves
  const tonicPc = PITCH_CLASS[tonicNote]
  const notes: string[] = []
  for (let oct = octaveBase; oct < octaveBase + octaveSpan; oct++) {
    for (const step of steps) {
      const pc = (tonicPc + step) % 12
      const octAdjust = Math.floor((tonicPc + step) / 12)
      notes.push(`${PC_TO_NAME[pc]}${oct + octAdjust}`)
    }
  }

  return {
    scaleName: pick,
    tonicNote,
    tonicOctave: octaveBase + 1,    // middle octave as default
    steps,
    notes,
  }
}

/**
 * Get a specific scale degree as a Tone.js note string.
 * degree 0 = tonic, 1 = 2nd, 2 = 3rd, etc. Negative wraps below.
 */
export function noteAtDegree(plan: ScalePlan, degree: number): string {
  const stepCount = plan.steps.length
  const normalized = ((degree % stepCount) + stepCount) % stepCount
  const octShift = Math.floor(degree / stepCount)
  const semitones = plan.steps[normalized]
  const tonicPc = PITCH_CLASS[plan.tonicNote]
  const absSemi = tonicPc + semitones
  const pc = ((absSemi % 12) + 12) % 12
  const oct = plan.tonicOctave + octShift + Math.floor(absSemi / 12)
  return `${PC_TO_NAME[pc]}${oct}`
}
