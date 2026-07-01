/**
 * ASTRYX Chamber — Chord Engine
 *
 * Generates the harmonic bed for the chamber. Per-planet character +
 * per-phase progression. Output is a phase-keyed map of chord arrays
 * the audio layer can voice as PolySynth pads.
 *
 * Per Sha's directive (Chamber 2 §CHORD ENGINE):
 *   Mercury  → light movement, extended harmonies (maj7 / 9th)
 *   Venus    → lush, maj7s, sus
 *   Mars     → power intervals (root / 5th / octave), tension
 *   Moon     → floating, unresolved
 *   Saturn   → sparse, grounded
 *
 * Per Chamber 2 §PHASE HARMONIC ARC (keep simple):
 *   Entry        — tonic / root
 *   Activation   — second or suspended
 *   Peak         — fifth / brightest expansion
 *   Regulation   — relative minor / regulator tone
 *   Integration  — fourth / subdominant return
 */

import type { ChamberDNA } from './ChamberDNAEngine'
import { type ScalePlan, noteAtDegree } from './ScaleEngine'
import type { PhaseId } from './ChamberConductor'

export type Voicing = 'open' | 'close' | 'sparse' | 'dense' | 'sus' | 'powerInterval'

export interface Chord {
  /** Tone.js note strings (e.g. ['D3','F3','A3','C4']) */
  notes: string[]
  /** Human-readable label for debug / practitioner UI */
  label: string
  /** Density 0..1 — used by audio layer for envelope gain */
  density: number
  /** Sustain duration in beats (1.0 = whole note) */
  sustainBeats: number
}

export interface ChordPlan {
  /** One representative chord per phase. Audio layer cycles through over time. */
  phases: Record<PhaseId, Chord[]>
  /** Voicing character — informs PolySynth patch */
  voicing: Voicing
  /** Per-planet "extension" — which scale degrees pile on top of the triad */
  extensions: number[]
}

// ─── PLANET → VOICING CHARACTER ─────────────────────────────────────

const PLANET_VOICING: Record<string, { voicing: Voicing; extensions: number[]; baseDensity: number }> = {
  Sun:     { voicing: 'open',         extensions: [4],         baseDensity: 0.65 },  // triad + 5th
  Moon:    { voicing: 'sus',          extensions: [3, 5],      baseDensity: 0.55 },  // sus2 + 6th — floating
  Mercury: { voicing: 'dense',        extensions: [6, 8],      baseDensity: 0.60 },  // maj7 + 9
  Venus:   { voicing: 'dense',        extensions: [6, 8],      baseDensity: 0.75 },  // lush maj7 + 9
  Mars:    { voicing: 'powerInterval', extensions: [4],        baseDensity: 0.70 },  // root + 5 + octave
  Jupiter: { voicing: 'open',         extensions: [4, 6],      baseDensity: 0.65 },  // open + maj7
  Saturn:  { voicing: 'sparse',       extensions: [],          baseDensity: 0.45 },  // bare triad, low
  Uranus:  { voicing: 'dense',        extensions: [4, 6, 8],   baseDensity: 0.55 },  // cluster-extended
  Neptune: { voicing: 'sus',          extensions: [4, 6],      baseDensity: 0.50 },  // hazy sus
  Pluto:   { voicing: 'powerInterval', extensions: [4],        baseDensity: 0.55 },  // dark power
}

// ─── PHASE → SCALE DEGREE ROOT ──────────────────────────────────────
// Simple harmonic arc per Sha's spec: tonic → 2nd/sus → 5th → relative
// minor / regulator → 4th. Degrees are 0-indexed (0 = tonic).

const PHASE_ROOT_DEGREE: Record<PhaseId, number> = {
  entry:       0,    // tonic
  activation:  1,    // 2nd / supertonic
  peak:        4,    // 5th — brightest expansion
  regulation:  5,    // 6th = relative minor
  integration: 3,    // 4th — subdominant return
}

// ─── BUILDER ────────────────────────────────────────────────────────

function buildChord(
  scale: ScalePlan,
  rootDegree: number,
  extensions: number[],
  voicing: Voicing,
  density: number,
): Chord {
  // Triad: root + 3rd + 5th (degrees 0, 2, 4 relative to chord root)
  const baseTriadDegrees = [0, 2, 4]
  const allDegrees = [...baseTriadDegrees, ...extensions]

  let notes: string[]
  let label: string

  if (voicing === 'powerInterval') {
    // Root + 5th + octave — no 3rd → ambiguous power
    notes = [
      noteAtDegree(scale, rootDegree),
      noteAtDegree(scale, rootDegree + 4),
      noteAtDegree(scale, rootDegree + 7),
    ]
    label = 'Power'
  } else if (voicing === 'sus') {
    // Replace 3rd with 4th — suspended
    notes = [
      noteAtDegree(scale, rootDegree),
      noteAtDegree(scale, rootDegree + 3),
      noteAtDegree(scale, rootDegree + 4),
      ...extensions.map((e) => noteAtDegree(scale, rootDegree + e)),
    ]
    label = 'Sus'
  } else if (voicing === 'sparse') {
    // Just root + 5th, octave below — bare
    notes = [
      noteAtDegree(scale, rootDegree - 7),
      noteAtDegree(scale, rootDegree + 4),
    ]
    label = 'Sparse'
  } else {
    // open / close / dense — all use triad + extensions
    notes = allDegrees.map((d) => noteAtDegree(scale, rootDegree + d))
    // Open voicing: spread chord by octave on every other note
    if (voicing === 'open' && notes.length >= 3) {
      notes = notes.map((n, i) => {
        if (i % 2 === 0) return n
        // Push odd notes up an octave
        const m = n.match(/^([A-G]#?)(\d)$/)
        if (m) return `${m[1]}${parseInt(m[2]) + 1}`
        return n
      })
    }
    label = extensions.length > 0 ? 'Extended' : 'Triad'
  }

  // De-duplicate while preserving order (extensions can collide with triad)
  const uniq: string[] = []
  for (const n of notes) if (!uniq.includes(n)) uniq.push(n)

  return {
    notes: uniq,
    label,
    density,
    sustainBeats: voicing === 'sparse' ? 2 : 1,
  }
}

/**
 * Build a full chord plan from DNA + scale.
 */
export function buildChordPlan(dna: ChamberDNA, scale: ScalePlan): ChordPlan {
  // Phase C — chord voicing follows effective planet so corrective state
  // produces corrective voicing (e.g. Mars Excess → Moon's floating sus
  // voicing instead of Mars's power-interval voicing).
  const planetForVoicing = dna.applyCorrective ? dna.effectivePlanet : dna.primaryPlanet
  const voicingConfig = PLANET_VOICING[planetForVoicing] ?? PLANET_VOICING.Sun

  const phases: Record<PhaseId, Chord[]> = {
    entry:       [],
    activation:  [],
    peak:        [],
    regulation:  [],
    integration: [],
  }

  // Each phase gets 1-2 chords. Peak gets 2 (slight progression).
  // Entry / Integration get 1 (sustained, restful).
  for (const phase of Object.keys(phases) as PhaseId[]) {
    const rootDeg = PHASE_ROOT_DEGREE[phase]
    const primary = buildChord(
      scale, rootDeg, voicingConfig.extensions, voicingConfig.voicing, voicingConfig.baseDensity,
    )

    // Every phase now carries a gentle 2-chord progression (not a single static
    // chord) so the chamber always feels like moving music. Each motion is
    // chosen to be consonant and soothing for its phase.
    const secondDensity = voicingConfig.baseDensity * 0.85
    const second = (deg: number, dens = secondDensity) =>
      buildChord(scale, deg, voicingConfig.extensions, voicingConfig.voicing, dens)

    if (phase === 'peak') {
      // Brightest expansion — lift up a 5th from the peak root.
      phases[phase] = [primary, second(rootDeg + 4, voicingConfig.baseDensity * 0.9)]
    } else if (phase === 'activation') {
      // Alternate the supertonic with the tonic — forward motion settling home.
      phases[phase] = [primary, second(0)]
    } else if (phase === 'entry') {
      // Gentle opening lift: tonic → 5th.
      phases[phase] = [primary, second(4)]
    } else if (phase === 'regulation') {
      // Soothing vi → IV settle (relative minor to subdominant).
      phases[phase] = [primary, second(3)]
    } else {
      // integration — plagal IV → I resolution to close the session.
      phases[phase] = [primary, second(0, voicingConfig.baseDensity * 0.8)]
    }
  }

  return {
    phases,
    voicing: voicingConfig.voicing,
    extensions: voicingConfig.extensions,
  }
}
