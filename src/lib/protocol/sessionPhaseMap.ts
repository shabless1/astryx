/**
 * ASTRYX — Session Phase Map (Final 20% Directive §9)
 *
 * Five phases drive the entire session — visual, sound, and atmosphere
 * read from the same envelope so they stay synchronized.
 */

export type PhaseId = 'entry' | 'activation' | 'peak' | 'regulation' | 'integration'

export interface SessionPhase {
  id: PhaseId
  label: string
  /** 0..1 — global brightness / opacity scaler for the visual field */
  brightness: number
  /** 0..1 — pulse amplitude, motion velocity scaler */
  motionIntensity: number
  /** 0..1 — how many primitive instances render (ring count, grid cells, etc) */
  geometryComplexity: number
  /** Regulator color fades IN at the start of this phase */
  introduceRegulatorColor?: boolean
  /** Cross-fade primary→regulator color toward end */
  blendColors?: boolean
}

export const sessionPhases: SessionPhase[] = [
  { id: 'entry',       label: 'Entry',         brightness: 0.35, motionIntensity: 0.30, geometryComplexity: 0.25 },
  { id: 'activation',  label: 'Activation',    brightness: 0.65, motionIntensity: 0.55, geometryComplexity: 0.50 },
  { id: 'peak',        label: 'Peak Pattern',  brightness: 1.00, motionIntensity: 0.85, geometryComplexity: 1.00 },
  { id: 'regulation',  label: 'Regulation',    brightness: 0.75, motionIntensity: 0.45, geometryComplexity: 0.65, introduceRegulatorColor: true },
  { id: 'integration', label: 'Integration',   brightness: 0.45, motionIntensity: 0.25, geometryComplexity: 0.35, blendColors: true },
]

// Proportional phase weights (sum to 1.0). 5 even phases by default.
// Each phase claims 20% of the session timeline.
const PHASE_WEIGHTS = [0.20, 0.20, 0.20, 0.20, 0.20]

/**
 * Compute the current phase + local progress (0..1 within that phase)
 * given elapsed seconds and total session duration.
 */
export function getPhaseForProgress(elapsedSec: number, totalSec: number): {
  phase: SessionPhase
  localProgress: number
  globalProgress: number
  index: number
} {
  const safeTotal = Math.max(1, totalSec)
  const globalProgress = Math.min(1, Math.max(0, elapsedSec / safeTotal))

  let cumStart = 0
  for (let i = 0; i < sessionPhases.length; i++) {
    const w = PHASE_WEIGHTS[i]
    const start = cumStart
    const end = cumStart + w
    if (globalProgress < end || i === sessionPhases.length - 1) {
      const local = (globalProgress - start) / Math.max(1e-6, w)
      return {
        phase: sessionPhases[i],
        localProgress: Math.min(1, Math.max(0, local)),
        globalProgress,
        index: i,
      }
    }
    cumStart = end
  }
  return { phase: sessionPhases[0], localProgress: 0, globalProgress: 0, index: 0 }
}

/**
 * Smooth interpolation between two phases for visual cross-fades.
 * Returns a blended set of intensities so the canvas doesn't snap
 * at phase boundaries.
 */
export function getBlendedPhaseValues(elapsedSec: number, totalSec: number) {
  const cur = getPhaseForProgress(elapsedSec, totalSec)
  const next = sessionPhases[Math.min(cur.index + 1, sessionPhases.length - 1)]

  // Cross-fade in the last 12% of each phase into the next phase's values
  const FADE_THRESHOLD = 0.88
  const fade = cur.localProgress > FADE_THRESHOLD
    ? (cur.localProgress - FADE_THRESHOLD) / (1 - FADE_THRESHOLD)
    : 0
  const eased = fade * fade * (3 - 2 * fade)  // smoothstep

  const lerp = (a: number, b: number) => a + (b - a) * eased

  return {
    phaseId: cur.phase.id,
    phaseLabel: cur.phase.label,
    localProgress: cur.localProgress,
    globalProgress: cur.globalProgress,
    brightness:         lerp(cur.phase.brightness,         next.brightness),
    motionIntensity:    lerp(cur.phase.motionIntensity,    next.motionIntensity),
    geometryComplexity: lerp(cur.phase.geometryComplexity, next.geometryComplexity),
    introduceRegulator: cur.phase.introduceRegulatorColor || cur.phase.id === 'regulation' || cur.phase.id === 'integration',
    blendColors:        cur.phase.blendColors || cur.phase.id === 'integration',
  }
}
