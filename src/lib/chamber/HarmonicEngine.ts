/**
 * ASTRYX Chamber — Harmonic Engine (Orchestrator)
 *
 * Top-level. Combines DNA + Scale + Chord + Melody + AspectBehavior +
 * SignModulation into a single `HarmonicPlan` the audio layer consumes.
 *
 * "Chart → DNA → Everything" — this is the "Everything" for the
 * musical layer of the chamber. The soundEngine reads from a single
 * HarmonicPlan; it never has to know about the 5 sub-engines.
 */

import type { ChamberDNA } from './ChamberDNAEngine'
import { buildScalePlan, type ScalePlan } from './ScaleEngine'
import { buildChordPlan, type ChordPlan } from './ChordEngine'
import { buildMelodyMotif, type MelodyMotif, motifPeriodSec } from './MelodyGenerator'
import { getAspectBehavior, type AspectBehavior } from './AspectBehaviorEngine'
import { getSignModulation, type SignModulation } from './SignModulationEngine'

export interface HarmonicPlan {
  scale: ScalePlan
  chords: ChordPlan
  melody: MelodyMotif
  aspect: AspectBehavior
  sign: SignModulation

  /** Convenience: total motif period seconds (motif play + rest) */
  motifPeriodSec: number

  /** Pulse rate (Hz) with sign modulation applied */
  effectivePulseHz: number

  /** Master attack multiplier for layer envelopes */
  effectiveAttackMul: number
  /** Master reverb / blur multiplier */
  effectiveBlurMul: number
  /** Master brightness multiplier (filter cutoff) */
  effectiveBrightnessMul: number
  /** Master density multiplier on chord + melody voicing */
  effectiveDensityMul: number
}

/**
 * Build the full harmonic plan for a chamber.
 *
 * Pure function: same DNA → same plan, no Tone.js dependency, no side
 * effects. The soundEngine reads this plan once when starting a session.
 */
export function buildHarmonicPlan(dna: ChamberDNA): HarmonicPlan {
  // 1. Scale — picks tonic + steps from planet's scale family (seeded)
  const scale = buildScalePlan(dna, { octaveBase: 3, octaveSpan: 3 })

  // 2. Chord plan — per-phase chord beds (planet voicing × phase root degree)
  const chords = buildChordPlan(dna, scale)

  // 3. Melody motif — deterministic from DNA seed + planet shape
  const melody = buildMelodyMotif(dna, scale)

  // 4. Aspect behavior — rhythm, pulse rate, polyrhythm ratio, panning
  const aspect = getAspectBehavior(dna)

  // 5. Sign modulation — bends attack / blur / brightness / density
  const sign = getSignModulation(dna)

  // 6. Compose effective parameters (aspect × sign × DNA defaults)
  const effectivePulseHz       = aspect.pulseHz * sign.movementMul
  const effectiveAttackMul     = sign.attackMul
  const effectiveBlurMul       = sign.blurMul
  const effectiveBrightnessMul = sign.brightnessMul
  const effectiveDensityMul    = sign.densityMul

  return {
    scale,
    chords,
    melody,
    aspect,
    sign,
    motifPeriodSec: motifPeriodSec(melody),
    effectivePulseHz,
    effectiveAttackMul,
    effectiveBlurMul,
    effectiveBrightnessMul,
    effectiveDensityMul,
  }
}

/**
 * Practitioner / preview convenience — human-readable summary.
 */
export function summarizeHarmonicPlan(plan: HarmonicPlan): string {
  return [
    `Scale: ${plan.scale.scaleName} (tonic ${plan.scale.tonicNote})`,
    `Chord voicing: ${plan.chords.voicing}`,
    `Melody character: ${plan.melody.character}`,
    `Aspect rhythm: ${plan.aspect.rhythm} @ ${plan.effectivePulseHz.toFixed(2)} Hz`,
    `Sign modulation: ${plan.sign.tag}`,
  ].join(' · ')
}
