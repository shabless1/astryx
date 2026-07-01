/**
 * ASTRYX Chamber — Melody Generator
 *
 * Deterministic motif generator. Same DNA → same motif, every session.
 *
 * Per Sha's directive (Chamber 2 §MELODY GENERATOR):
 *   Deterministic. Repeatable. Protocol-driven. Do NOT use random note
 *   generation. Same protocol always generates the same melodic DNA.
 *
 * Per-planet melody character:
 *   Mercury  — arpeggio-like, quick (4-note rapid)
 *   Venus    — stepwise, lyrical (smooth contour)
 *   Mars     — power intervals (root / 5th / octave), rhythmic
 *   Moon     — floating, unresolved (no tonic resolution)
 *   Saturn   — sparse (long rests, low register)
 *   Sun      — radiant, ascending centered
 *   Jupiter  — expansive (wide-leaping intervals)
 *   Uranus   — angular, modal jumps
 *   Neptune  — drifting, scalar
 *   Pluto    — descending, deep
 */

import type { ChamberDNA } from './ChamberDNAEngine'
import type { ScalePlan } from './ScaleEngine'
import { noteAtDegree } from './ScaleEngine'
import { createPRNG, seededInt } from './chamberSeed'

export interface MelodyMotif {
  /** Sequence of note events */
  notes: MelodyNote[]
  /** Total beats in one motif iteration */
  beats: number
  /** Seconds per beat at chamber's intrinsic tempo */
  beatSec: number
  /** Pause seconds between motif repeats (Saturn = long, Mercury = brief) */
  restSec: number
  /** Character label for practitioner debug */
  character: string
}

export interface MelodyNote {
  /** Tone.js note string. null = rest */
  note: string | null
  /** Duration in beats */
  duration: number
  /** Velocity 0..1 — feeds synth attack */
  velocity: number
}

// ─── PER-PLANET MOTIF SHAPE ─────────────────────────────────────────
// Each shape is a list of scale degrees the melody walks through.
// 0 = tonic, 2 = 3rd, 4 = 5th, 7 = octave, -3 = below tonic, etc.

interface PlanetMelodyShape {
  /** Default degree pattern (will be lightly varied by seed) */
  degrees: number[]
  /** Beat values per note */
  rhythm: number[]
  /** Beats per motif (must equal sum of rhythm) */
  beats: number
  /** Tempo: seconds per beat */
  beatSec: number
  /** Rest seconds between motif repeats */
  restSec: number
  /** Velocity range [min, max] */
  velocityRange: [number, number]
  character: string
}

const PLANET_SHAPES: Record<string, PlanetMelodyShape> = {
  Sun:     { degrees: [0, 2, 4, 5, 4, 2],            rhythm: [1, 1, 1, 2, 1, 2], beats: 8,  beatSec: 0.55, restSec: 1.0, velocityRange: [0.55, 0.85], character: 'Radiant ascending' },
  Moon:    { degrees: [2, 4, 7, 4, 2, 4, 7, -1],     rhythm: [2, 2, 2, 1, 1, 2, 2, 2], beats: 14, beatSec: 0.65, restSec: 2.0, velocityRange: [0.35, 0.55], character: 'Floating unresolved' },
  Mercury: { degrees: [0, 2, 4, 7, 4, 2, 0, 4],      rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], beats: 4, beatSec: 0.40, restSec: 0.7, velocityRange: [0.45, 0.70], character: 'Quick arpeggio' },
  Venus:   { degrees: [0, 2, 1, 2, 4, 3, 2, 0],      rhythm: [1, 1, 1, 1, 2, 1, 1, 2], beats: 10, beatSec: 0.55, restSec: 1.4, velocityRange: [0.45, 0.70], character: 'Stepwise lyrical' },
  Mars:    { degrees: [0, 4, 7, 4, 0, 7, 4, 0],      rhythm: [0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1], beats: 6, beatSec: 0.42, restSec: 0.6, velocityRange: [0.60, 0.90], character: 'Power-interval rhythmic' },
  Jupiter: { degrees: [0, 4, 7, 9, 7, 4, 0, 4],      rhythm: [1, 1, 1, 2, 1, 1, 1, 2], beats: 10, beatSec: 0.55, restSec: 1.2, velocityRange: [0.55, 0.80], character: 'Expansive wide-leap' },
  Saturn:  { degrees: [0, -3, 0, 2, 0],              rhythm: [3, 2, 4, 2, 5], beats: 16, beatSec: 0.75, restSec: 4.0, velocityRange: [0.40, 0.60], character: 'Sparse low' },
  Uranus:  { degrees: [0, 4, 1, 6, 2, 7, 3, 0],      rhythm: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5], beats: 6, beatSec: 0.45, restSec: 0.8, velocityRange: [0.45, 0.75], character: 'Angular modal' },
  Neptune: { degrees: [0, 1, 2, 1, 2, 4, 3, 2, 1, 0], rhythm: [1, 1, 1, 1, 2, 2, 1, 1, 1, 2], beats: 13, beatSec: 0.70, restSec: 2.5, velocityRange: [0.30, 0.55], character: 'Drifting scalar' },
  Pluto:   { degrees: [4, 2, 0, -3, 0, -3, -5],      rhythm: [2, 2, 3, 2, 1, 2, 3], beats: 15, beatSec: 0.65, restSec: 3.0, velocityRange: [0.40, 0.65], character: 'Descending deep' },
}

// ─── BUILDER ────────────────────────────────────────────────────────

export function buildMelodyMotif(dna: ChamberDNA, scale: ScalePlan): MelodyMotif {
  // Phase C — motif character follows effective planet so corrective state
  // produces corrective melody (e.g. Mars Excess → Moon's floating motif
  // instead of Mars's power-interval rhythmic motif).
  const planetForShape = dna.applyCorrective ? dna.effectivePlanet : dna.primaryPlanet
  const shape = PLANET_SHAPES[planetForShape] ?? PLANET_SHAPES.Sun
  const rng = createPRNG(dna.seed ^ 0xCAFE5EED)    // independent stream for melody

  // Light deterministic variation: swap two adjacent degrees in the motif
  // (one swap per session) so the motif feels "spoken" not robotic, while
  // staying fully deterministic.
  const degrees = [...shape.degrees]
  if (degrees.length >= 4) {
    const swapIdx = seededInt(rng, 1, degrees.length - 2)
    const tmp = degrees[swapIdx]
    degrees[swapIdx] = degrees[swapIdx + 1]
    degrees[swapIdx + 1] = tmp
  }

  // Velocity per note — also seeded
  const [vMin, vMax] = shape.velocityRange
  const notes: MelodyNote[] = degrees.map((deg, i) => {
    const note = noteAtDegree(scale, deg)
    const velocity = vMin + (vMax - vMin) * (0.5 + 0.5 * Math.sin(dna.seed * 0.0001 + i))
    return { note, duration: shape.rhythm[i] ?? 1, velocity }
  })

  return {
    notes,
    beats: shape.beats,
    beatSec: shape.beatSec,
    restSec: shape.restSec,
    character: shape.character,
  }
}

/**
 * Convenience: total motif length in seconds (motif beats + rest).
 */
export function motifPeriodSec(motif: MelodyMotif): number {
  const playSec = motif.notes.reduce((s, n) => s + n.duration * motif.beatSec, 0)
  return playSec + motif.restSec
}
