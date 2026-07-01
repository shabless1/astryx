/**
 * ASTRYX — Mandala Signal-State Modifiers (Phase 3B)
 *
 * The signal state corrects the MOTION + ENERGY of the mandala (never just its
 * colour). Amplified states slow down + dim + drift downward (settling). Depleted
 * states brighten + bloom outward (strengthening). Restricted states use
 * compression-release. Coherent states hold a stable slow rotation.
 */

import type { ColorState } from './planetColorTherapyLibrary'

export type MandalaDrift = 'down' | 'out' | 'none'
export type MandalaBloom = 'stable' | 'outward' | 'compression-release'

export interface MandalaStateMod {
  /** multiplies rotation/orbit durations — >1 = SLOWER (calmer). */
  speedFactor: number
  /** 0..1 overall brightness scaler. */
  brightnessFactor: number
  drift: MandalaDrift
  bloom: MandalaBloom
  /** scales particle count + slows orbit. */
  particleFactor: number
  motionLabel: string
}

export const MANDALA_STATE_MODS: Record<ColorState, MandalaStateMod> = {
  // amplified / overactivated / electrified / heated → slow, settle, cool, dim a touch
  elevated:  { speedFactor: 1.45, brightnessFactor: 0.82, drift: 'down', bloom: 'stable',               particleFactor: 0.7, motionLabel: 'slow cooling settle' },
  // under-supported → gently brighten + slow outward bloom
  depleted:  { speedFactor: 1.05, brightnessFactor: 1.0,  drift: 'out',  bloom: 'outward',              particleFactor: 1.0, motionLabel: 'gentle outward bloom' },
  // restricted / compressed → compression-release, opens on the exhale
  blocked:   { speedFactor: 1.18, brightnessFactor: 0.92, drift: 'none', bloom: 'compression-release',  particleFactor: 0.85, motionLabel: 'compression–release' },
  // coherent → stable slow rotation, soft integration glow
  balanced:  { speedFactor: 1.0,  brightnessFactor: 0.95, drift: 'none', bloom: 'stable',               particleFactor: 0.9, motionLabel: 'stable slow rotation' },
}

export function mandalaStateMod(state: ColorState): MandalaStateMod {
  return MANDALA_STATE_MODS[state] ?? MANDALA_STATE_MODS.balanced
}
