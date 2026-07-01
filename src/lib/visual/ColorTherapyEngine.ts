/**
 * ASTRYX — Color Therapy Engine (Phase 3)
 *
 * Turns the active fork's planet + signal state + chamber phase into a FULL
 * color therapy field (not a dot). Corrective-first: amplified states cool and
 * settle; depleted states warm and expand; blocked states bloom and release.
 * Chakra color is blended softly on top and never overrides the correction.
 */

import { hexToRgba } from '@/lib/utils'
import {
  planetColorProfile, chakraTint, type ColorMotion,
} from './planetColorTherapyLibrary'
import {
  buildBreathSync, resolveColorState, phaseVisual, clamp01,
  type ChamberPhaseId, type BreathPatternLike, type BreathSync,
} from './visualShared'

export interface ColorTherapyInput {
  planet: string
  sign?: string
  house?: number
  signalState: string          // display word, e.g. "Electrified"
  signalStateRaw?: string       // excess | deficiency | blocked | balanced
  correctiveDirection?: string[] | string
  activeFork?: string
  frequency?: string | number
  chamberPhase: ChamberPhaseId
  element?: string
  chakraOverlay?: string
  bodyPlacement?: string
  breathPattern: BreathPatternLike
}

export interface ColorTherapyOutput {
  dominantColor: string
  supportColor: string
  accentColor: string
  backgroundGradient: string
  glowColor: string
  pulseColor: string
  chakraAccent: string | null
  colorNames: string[]
  motionPattern: ColorMotion
  motionSpeed: number          // seconds per gentle cycle (larger = slower)
  intensity: number            // 0..1
  breathSync: BreathSync
  avoidColors: string[]
  visualInstruction: string
  why: string
}

const BASE_SPEED: Record<ColorMotion, number> = {
  'settle-down': 16,   // amplified — slowest (settling)
  'expand-warm': 12,
  'bloom-release': 13,
  'steady-pulse': 11,
}

const BEHAVIOR: Record<ColorMotion, string> = {
  'settle-down': 'cools and settles downward',
  'expand-warm': 'warms and expands gently',
  'bloom-release': 'opens and releases',
  'steady-pulse': 'holds a steady, integrating glow',
}

export function generateColorTherapy(input: ColorTherapyInput): ColorTherapyOutput {
  const prof = planetColorProfile(input.planet)
  const st = resolveColorState(input.signalStateRaw)
  const sp = prof.states[st]
  const phase = phaseVisual(input.chamberPhase)

  const dominantColor = sp.colors[0]
  const supportColor = sp.colors[1] ?? sp.colors[0]
  const accentColor = sp.colors[2] ?? supportColor

  // Amplified fields glow with the COOLER support color (never intensify).
  const glowColor = st === 'elevated' ? supportColor : dominantColor
  const pulseColor = supportColor
  const ctint = chakraTint(input.chakraOverlay)

  // Background gradient by corrective motion. Settling fields fall downward;
  // restoring/opening fields radiate from centre. Kept calm (mid alpha → bg).
  let backgroundGradient: string
  switch (sp.motion) {
    case 'settle-down':
      backgroundGradient =
        `linear-gradient(180deg, ${hexToRgba(supportColor, 0.5)} 0%, ${hexToRgba(dominantColor, 0.5)} 46%, #020208 100%)`
      break
    case 'expand-warm':
      backgroundGradient =
        `radial-gradient(circle at 50% 58%, ${hexToRgba(dominantColor, 0.6)} 0%, ${hexToRgba(supportColor, 0.38)} 44%, #020208 80%)`
      break
    case 'bloom-release':
      backgroundGradient =
        `radial-gradient(circle at 50% 50%, ${hexToRgba(dominantColor, 0.55)} 0%, ${hexToRgba(supportColor, 0.4)} 42%, #020208 82%)`
      break
    default:
      backgroundGradient =
        `radial-gradient(circle at 50% 50%, ${hexToRgba(dominantColor, 0.5)} 0%, ${hexToRgba(supportColor, 0.36)} 46%, #020208 84%)`
  }

  const motionSpeed = Math.round(BASE_SPEED[sp.motion] * phase.speedFactor)
  // Amplified states are slightly dimmer (never harsh at peak).
  const intensity = clamp01(phase.intensity * (st === 'elevated' ? 0.9 : 1))

  const why = `${input.planet} is ${input.signalState.toLowerCase()}, so the field ${BEHAVIOR[sp.motion]} instead of intensifying it.`

  return {
    dominantColor, supportColor, accentColor,
    backgroundGradient, glowColor, pulseColor,
    chakraAccent: ctint,
    colorNames: sp.colorNames,
    motionPattern: sp.motion,
    motionSpeed,
    intensity,
    breathSync: buildBreathSync(input.breathPattern),
    avoidColors: sp.avoid,
    visualInstruction: sp.instruction,
    why,
  }
}
