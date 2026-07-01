/**
 * ASTRYX Chamber — Sign Modulation Engine
 *
 * Per Sha's directive (approved §2 in the Chamber 2 confirmation):
 *   "Mars in Aries should not sound like Mars in Pisces. Use sign
 *    placement to modify: attack, blur, movement, brightness, density,
 *    articulation, rhythm style."
 *
 * Reads sign-modulation.json (modulation tag per sign) and translates the
 * tag into concrete audio parameter modulators that bend the chamber's
 * harmonic / melodic / textural behavior.
 *
 * These modulators are applied as multipliers / offsets ON TOP of the
 * planet's default character — never replacing it.
 */

import type { ChamberDNA } from './ChamberDNAEngine'
import signModulationData from '@/data/sign-modulation.json'

export interface SignModulation {
  /** Bias toward solfeggio Hz used as a chamber tint (informs solfeggio layer) */
  biasHz: number
  /** Modulation tag from sign-modulation.json (e.g. 'sharp_initiating_percussive') */
  tag: string

  // Concrete audio parameter modulators (multiply or add on top of defaults):

  /** Attack envelope multiplier (>1 = slower attack, <1 = sharper) */
  attackMul: number
  /** Filter brightness multiplier (>1 = brighter, <1 = darker) */
  brightnessMul: number
  /** Reverb / delay wet multiplier (>1 = more space, <1 = drier) */
  blurMul: number
  /** Rhythmic articulation: 0=legato, 1=staccato */
  articulation: number
  /** Density multiplier on chord voicing + melody note count */
  densityMul: number
  /** Movement speed multiplier on pulse + LFO rates */
  movementMul: number
  /** Sub-bass weight 0..1 */
  bassWeight: number
}

// ─── TAG → PARAMETER TRANSLATION ──────────────────────────────────
// Each modulation tag from sign-modulation.json maps to a specific
// parameter profile. These are intentionally distinct and audible.

const TAG_TO_MODULATION: Record<string, Omit<SignModulation, 'biasHz' | 'tag'>> = {
  sharp_initiating_percussive: {
    attackMul: 0.55, brightnessMul: 1.25, blurMul: 0.75,
    articulation: 0.85, densityMul: 1.10, movementMul: 1.20, bassWeight: 0.55,
  },
  slow_sustained_grounding: {
    attackMul: 1.65, brightnessMul: 0.80, blurMul: 1.30,
    articulation: 0.15, densityMul: 0.95, movementMul: 0.65, bassWeight: 0.85,
  },
  alternating_dual_oscillating: {
    attackMul: 0.90, brightnessMul: 1.10, blurMul: 0.95,
    articulation: 0.55, densityMul: 1.05, movementMul: 1.15, bassWeight: 0.50,
  },
  wave_like_tidal_protective: {
    attackMul: 1.45, brightnessMul: 0.90, blurMul: 1.40,
    articulation: 0.20, densityMul: 0.90, movementMul: 0.85, bassWeight: 0.70,
  },
  radiant_centered_amplifying: {
    attackMul: 0.95, brightnessMul: 1.30, blurMul: 1.05,
    articulation: 0.45, densityMul: 1.15, movementMul: 1.05, bassWeight: 0.60,
  },
  precise_corrective_pattern: {
    attackMul: 0.70, brightnessMul: 1.15, blurMul: 0.85,
    articulation: 0.80, densityMul: 1.00, movementMul: 1.10, bassWeight: 0.55,
  },
  balancing_symmetrical_smoothing: {
    attackMul: 1.15, brightnessMul: 1.00, blurMul: 1.15,
    articulation: 0.30, densityMul: 1.00, movementMul: 0.95, bassWeight: 0.55,
  },
  deep_penetrating_pressure_release: {
    attackMul: 1.55, brightnessMul: 0.75, blurMul: 1.25,
    articulation: 0.40, densityMul: 1.05, movementMul: 0.80, bassWeight: 0.90,
  },
  expanding_rising_outward: {
    attackMul: 1.05, brightnessMul: 1.20, blurMul: 1.20,
    articulation: 0.35, densityMul: 1.10, movementMul: 1.10, bassWeight: 0.55,
  },
  compressed_minimal_structural: {
    attackMul: 1.20, brightnessMul: 0.85, blurMul: 0.90,
    articulation: 0.65, densityMul: 0.80, movementMul: 0.90, bassWeight: 0.75,
  },
  electric_pattern_break: {
    attackMul: 0.55, brightnessMul: 1.35, blurMul: 0.80,
    articulation: 0.90, densityMul: 1.15, movementMul: 1.30, bassWeight: 0.45,
  },
  dissolving_ambient_oceanic: {
    attackMul: 1.85, brightnessMul: 0.85, blurMul: 1.65,
    articulation: 0.10, densityMul: 0.85, movementMul: 0.75, bassWeight: 0.65,
  },
}

const DEFAULT_MODULATION: Omit<SignModulation, 'biasHz' | 'tag'> = {
  attackMul: 1.0, brightnessMul: 1.0, blurMul: 1.0,
  articulation: 0.5, densityMul: 1.0, movementMul: 1.0, bassWeight: 0.55,
}

// ─── PUBLIC ─────────────────────────────────────────────────────────

export function getSignModulation(dna: ChamberDNA): SignModulation {
  const sign = dna.primarySign
  const data = (signModulationData as Array<{ sign: string; bias_hz: number; modulation: string }>)
    .find((s) => s.sign === sign)
  const tag = data?.modulation ?? 'balancing_symmetrical_smoothing'
  const biasHz = data?.bias_hz ?? 432
  const params = TAG_TO_MODULATION[tag] ?? DEFAULT_MODULATION

  return { biasHz, tag, ...params }
}
