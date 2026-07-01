/**
 * ASTRYX — Kaleidoscope Mandala Engine (Phase 3B)
 *
 * Produces a layered, multidimensional mandala spec consumed by BOTH renderers
 * (WebGL shader + SVG fallback). Fuses: planet preset (shape/symmetry/layers) +
 * corrective color field (signal-state correct) + state motion modifiers +
 * chamber-phase energy + breath sync.
 *
 * The mandala is the visual expression of the active fork — never decoration.
 */

import { planetColorProfile, chakraTint } from './planetColorTherapyLibrary'
import type { ShapeFamily } from './planetMandalaLibrary'
import { mandalaPreset, type ShaderMode } from './mandalaPlanetPresets'
import { mandalaStateMod, type MandalaDrift, type MandalaBloom } from './mandalaSignalStateModifiers'
import {
  buildBreathSync, resolveColorState, phaseVisual,
  type ChamberPhaseId, type BreathPatternLike, type BreathSync,
} from './visualShared'

export interface KaleidoscopeInput {
  planet: string
  sign?: string
  house?: number
  signalState: string          // display word, e.g. "Electrified"
  signalStateRaw?: string       // excess | deficiency | blocked | balanced
  correctiveDirection?: string[] | string
  activeFork?: string
  frequency?: string | number
  chamberPhase: ChamberPhaseId
  chakraOverlay?: string
  breathPattern: BreathPatternLike
  aspectPattern?: string
  visualMode?: string
}

export interface KaleidoscopeMandala {
  /** the carrier planet (for art-asset lookup). */
  planet: string
  /** display state key (elevated|depleted|blocked|balanced) for per-state art. */
  stateKey: string
  shapeFamily: ShapeFamily
  shaderMode: ShaderMode
  geometryLayers: number
  symmetryCount: number
  /** [primary, secondary, accent] hex — corrective field colours. */
  colorPalette: [string, string, string]
  coreColor: string
  glowColor: string
  chakraAccent: string | null
  glowStyle: 'soft'
  motionPattern: string
  /** radians/sec for the shader (small, signed; + = cw). */
  rotationPrimary: number
  rotationSecondary: number
  /** seconds per turn for CSS/SVG (larger = slower). */
  rotationPrimarySec: number
  rotationSecondarySec: number
  /** breath cycle seconds — the pulse the whole field breathes to. */
  pulseRate: number
  particle: { count: number; orbitSec: number; size: number; twinkleSec: number }
  breathSync: BreathSync
  /** 0..1 parallax / blur / layer-separation strength. */
  depth: number
  intensity: number
  /** 0..1 — amplified states reduce this. */
  brightness: number
  /** 0..1 — glow softness. */
  softness: number
  drift: MandalaDrift
  bloom: MandalaBloom
  safetyProfile: { reducedMotionSafe: true; maxOpacity: number }
  shapeLabel: string
  motionLabel: string
  visualInstruction: string
  why: string
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function generateKaleidoscopeMandala(input: KaleidoscopeInput): KaleidoscopeMandala {
  const preset = mandalaPreset(input.planet)
  const state = resolveColorState(input.signalStateRaw)
  const mod = mandalaStateMod(state)
  const phase = phaseVisual(input.chamberPhase)
  const breathSync = buildBreathSync(input.breathPattern)

  // Corrective colours (signal-state correct) — never amplify a hot planet.
  const cols = planetColorProfile(input.planet).states[state].colors
  const colorPalette: [string, string, string] = [
    cols[0], cols[1] ?? cols[0], cols[2] ?? cols[1] ?? cols[0],
  ]

  // Speed: slow base, made slower by amplified state + entry/regulation phases.
  const speedScale = mod.speedFactor * phase.speedFactor
  const rotationPrimarySec = Math.round(clamp(82 * speedScale, 60, 200))
  const rotationSecondarySec = Math.round(clamp(118 * speedScale, 80, 260))
  // Shader radians/sec (gentle): direction from preset; secondary counter-rotates.
  const dir = preset.rotatePrimaryDir === 'cw' ? 1 : -1
  const rotationPrimary = dir * clamp(0.032 / speedScale, 0.012, 0.05)
  const rotationSecondary = -dir * clamp(0.022 / speedScale, 0.010, 0.04)

  const geometryLayers = Math.max(3, Math.round(preset.baseLayers * (0.6 + phase.complexity * 0.5)))
  const depth = clamp(0.45 + phase.complexity * 0.4, 0.4, 0.95)
  const brightness = clamp(mod.brightnessFactor * (0.62 + phase.intensity * 0.4), 0.4, 1)
  const softness = clamp(0.5 + depth * 0.35, 0.5, 0.9)

  const particle = {
    count: clamp(Math.round(preset.particleCount * mod.particleFactor * (0.7 + phase.complexity * 0.4)), 6, 20),
    orbitSec: Math.round(clamp(90 * speedScale, 60, 220)),
    size: 2.2,
    twinkleSec: 7,
  }

  const visualInstruction = mod.bloom === 'compression-release'
    ? 'Inhale to gather · exhale to let the field open'
    : mod.drift === 'down'
      ? 'Let the field settle downward · long, slow exhale'
      : mod.bloom === 'outward'
        ? 'Let the glow bloom outward gently with the inhale'
        : 'Rest in the steady field · let the breath stay even'

  const why = `${input.planet} ${input.signalState} — ${preset.shapeLabel.toLowerCase()}, ${mod.motionLabel}; corrective colours, breath-synced.`

  return {
    planet: input.planet,
    stateKey: state,
    shapeFamily: preset.shapeFamily,
    shaderMode: preset.shaderMode,
    geometryLayers,
    symmetryCount: preset.symmetryCount,
    colorPalette,
    coreColor: colorPalette[0],
    glowColor: colorPalette[1],
    chakraAccent: chakraTint(input.chakraOverlay),
    glowStyle: 'soft',
    motionPattern: mod.motionLabel,
    rotationPrimary,
    rotationSecondary,
    rotationPrimarySec,
    rotationSecondarySec,
    pulseRate: breathSync.cycleSec,
    particle,
    breathSync,
    depth,
    intensity: phase.intensity,
    brightness,
    softness,
    drift: mod.drift,
    bloom: mod.bloom,
    safetyProfile: { reducedMotionSafe: true, maxOpacity: 0.95 },
    shapeLabel: preset.shapeLabel,
    motionLabel: mod.motionLabel,
    visualInstruction,
    why,
  }
}
