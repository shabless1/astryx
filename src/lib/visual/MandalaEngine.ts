/**
 * ASTRYX — Mandala Engine (Phase 3)
 *
 * Turns the active fork's planet + signal state + chamber phase into a moving,
 * glowing mandala spec. Geometry family + symmetry come from the planet; motion,
 * rotation speed and density shift with state + phase. All motion is slow,
 * breath-synced and fluid — amplified states rotate SLOWER (settling), never faster.
 */

import { planetColorProfile, type ColorState } from './planetColorTherapyLibrary'
import {
  planetMandalaProfile, type ShapeFamily, type MandalaMotion, type RotationDir,
} from './planetMandalaLibrary'
import {
  buildBreathSync, resolveColorState, phaseVisual,
  type ChamberPhaseId, type BreathPatternLike, type BreathSync,
} from './visualShared'

export interface MandalaInput {
  planet: string
  sign?: string
  signalState: string
  signalStateRaw?: string
  correctiveDirection?: string[] | string
  activeFork?: string
  chamberPhase: ChamberPhaseId
  chakraOverlay?: string
  breathPattern: BreathPatternLike
  aspectPattern?: string
}

export interface MandalaOutput {
  shapeFamily: ShapeFamily
  geometryLayers: number
  symmetry: number
  colorPalette: string[]       // hex — matches the color therapy field
  glowStyle: 'soft'
  motionPattern: MandalaMotion
  rotationDirection: RotationDir
  pulseRate: number            // seconds per breath pulse (breath-synced)
  speed: number                // seconds per full rotation (larger = slower)
  breathSync: BreathSync
  intensity: number            // 0..1
  visualInstruction: string
  why: string
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export function generateMandala(input: MandalaInput): MandalaOutput {
  const mprof = planetMandalaProfile(input.planet)
  const cprof = planetColorProfile(input.planet)
  const st: ColorState = resolveColorState(input.signalStateRaw)
  const ms = mprof.states[st]
  const phase = phaseVisual(input.chamberPhase)
  const breathSync = buildBreathSync(input.breathPattern)

  const geometryLayers = Math.max(2, Math.round(mprof.baseLayers * (0.5 + phase.complexity * 0.6)))
  const speed = Math.round(ms.rotationSec * phase.speedFactor)

  const visualInstruction = cap(ms.motionWords)
  const why = `${input.planet} ${input.signalState} — ${mprof.shapeFamily.replace('-', ' ')} geometry, ${ms.motionWords}.`

  return {
    shapeFamily: mprof.shapeFamily,
    geometryLayers,
    symmetry: mprof.symmetry,
    colorPalette: cprof.states[st].colors,
    glowStyle: 'soft',
    motionPattern: ms.motion,
    rotationDirection: ms.rotation,
    pulseRate: breathSync.cycleSec,
    speed,
    breathSync,
    intensity: phase.intensity,
    visualInstruction,
    why,
  }
}
