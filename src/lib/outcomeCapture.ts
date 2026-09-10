/**
 * Outcome capture — pure shaping for the session flywheel (Roadmap 0.2).
 *
 * Two writes per session:
 *   1. START  — POST /api/sessions at Chamber completion: what ran.
 *   2. OUTCOME — PATCH /api/sessions/:id at the post-session check-in: how it landed.
 *
 * Everything here is a whitelist. Unknown keys are dropped, strings are
 * clamped, energy is an integer 1–10 or absent. Free text (notes, "where did
 * you feel it") NEVER enters the dataset — subjective felt-state only, which
 * is the compliance envelope for "recalibration response".
 *
 * No I/O, no Date.now, no randomness — safe to golden-test.
 */

/** The Calibration Standard the engine currently runs under (stamped server-side). */
export const CALIBRATION_STANDARD_VERSION = 'v0-draft'

const SIGNAL_STATES = new Set(['excess', 'deficiency', 'blocked', 'balanced'])
const PLACEMENT = new Set(['Yes', 'Somewhat', 'No', 'Not sure'])
const SUPPORT = new Set(['Yes', 'Somewhat', 'No', 'Too intense', 'Too soft'])

const clampStr = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t ? t.slice(0, max) : undefined
}

const strList = (v: unknown, maxItems: number, maxLen: number): string[] | undefined => {
  if (!Array.isArray(v)) return undefined
  const out = v
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems)
  return out.length ? out : undefined
}

/** 1–10 integer or undefined. Rejects NaN, floats, out-of-range, non-numbers. */
export const energyScore = (v: unknown): number | undefined => {
  if (typeof v !== 'number' || !Number.isInteger(v)) return undefined
  return v >= 1 && v <= 10 ? v : undefined
}

export interface SessionStartFields {
  energyBefore?: number
  carrierPlanet?: string
  signalState?: string
  forkSequence?: string[]
  intention?: string[]
}

/** Step 1 — shape the completion payload. */
export function shapeSessionStart(body: unknown): SessionStartFields {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const signal = clampStr(b.signalState, 32)?.toLowerCase()
  return {
    energyBefore: energyScore(b.energyBefore),
    carrierPlanet: clampStr(b.carrierPlanet, 32),
    signalState: signal && SIGNAL_STATES.has(signal) ? signal : undefined,
    forkSequence: strList(b.forkSequence, 24, 32),
    intention: strList(b.intention, 10, 80),
  }
}

export interface SessionOutcomeFields {
  energyAfter?: number
  outcome?: {
    feeling?: string[]
    bodyState?: string[]
    mentalState?: string[]
    placementAccuracy?: string
    chamberSupport?: string
  }
}

/** Step 2 — shape the check-in payload. Free text is dropped by construction. */
export function shapeSessionOutcome(body: unknown): SessionOutcomeFields {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const raw = (b.outcome && typeof b.outcome === 'object' ? b.outcome : {}) as Record<string, unknown>
  const placement = clampStr(raw.placementAccuracy, 16)
  const support = clampStr(raw.chamberSupport, 16)
  const outcome = {
    feeling: strList(raw.feeling, 12, 40),
    bodyState: strList(raw.bodyState, 12, 40),
    mentalState: strList(raw.mentalState, 12, 40),
    placementAccuracy: placement && PLACEMENT.has(placement) ? placement : undefined,
    chamberSupport: support && SUPPORT.has(support) ? support : undefined,
  }
  const hasAny = Object.values(outcome).some((v) => v !== undefined)
  return {
    energyAfter: energyScore(b.energyAfter),
    outcome: hasAny ? outcome : undefined,
  }
}
