/**
 * ASTRYX — Chamber Visual Shared Helpers (Phase 3)
 *
 * Breath-sync model + chamber-phase modifiers shared by the Color Therapy and
 * Mandala engines. All motion here is slow and gentle by construction.
 */

import { toDisplayState } from '@/lib/signalCopy'
import type { ColorState } from './planetColorTherapyLibrary'

export type ChamberPhaseId = 'entry' | 'activation' | 'peak' | 'regulation' | 'integration'

export interface BreathCycleStep { label: string; secs: number }
export interface BreathPatternLike { name: string; cycle: BreathCycleStep[] }

export interface BreathSync {
  cycleSec: number
  inhaleSec: number
  holdSec: number
  exhaleSec: number
  patternName: string
  cue: string
}

/** Build a breath-sync descriptor from an element breath pattern. */
export function buildBreathSync(pattern: BreathPatternLike): BreathSync {
  const cycle = pattern?.cycle ?? []
  const cycleSec = Math.max(4, cycle.reduce((a, c) => a + c.secs, 0))
  const find = (kw: string) =>
    cycle.filter((c) => c.label.toLowerCase().includes(kw)).reduce((a, c) => a + c.secs, 0)
  const inhaleSec = find('inhale') || Math.round(cycleSec * 0.33)
  const holdSec = find('hold')
  const exhaleSec = find('exhale') || Math.round(cycleSec * 0.4)
  return {
    cycleSec, inhaleSec, holdSec, exhaleSec,
    patternName: pattern?.name ?? 'Breath',
    cue: 'Inhale to expand · exhale to settle',
  }
}

/** Map any engine state (raw or display word) to the 4-bucket ColorState. */
export function resolveColorState(signalStateRaw?: string): ColorState {
  return toDisplayState(signalStateRaw) as ColorState
}

export interface PhaseVisual {
  /** 0..1 overall brightness/opacity scaler */
  intensity: number
  /** multiplies animation durations — higher = SLOWER (calmer) */
  speedFactor: number
  /** 0..1 geometry density scaler */
  complexity: number
  words: string
}

export const PHASE_VISUAL: Record<ChamberPhaseId, PhaseVisual> = {
  entry:       { intensity: 0.35, speedFactor: 1.30, complexity: 0.45, words: 'soft · low intensity · slow fade-in' },
  activation:  { intensity: 0.58, speedFactor: 1.12, complexity: 0.65, words: 'a little brighter · clearer geometry · gentle movement' },
  peak:        { intensity: 0.88, speedFactor: 1.00, complexity: 1.00, words: 'fullest glow · most visible mandala · still slow and safe' },
  regulation:  { intensity: 0.62, speedFactor: 1.22, complexity: 0.70, words: 'cooler · slower · settling · grounding' },
  integration: { intensity: 0.45, speedFactor: 1.35, complexity: 0.50, words: 'soft · stable · warm · closing glow' },
}

export function phaseVisual(id: ChamberPhaseId): PhaseVisual {
  return PHASE_VISUAL[id] ?? PHASE_VISUAL.peak
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
