/**
 * ASTRYX Chamber Conductor
 *
 * The clock authority. Owns the 5-phase timeline for the chamber.
 *
 * Per Sha's directive: the conductor coordinates ALL layers. Visual reads
 * from it. Sound reads from it. Breath reads from it. There is no second
 * clock anywhere in the app — drift is impossible by construction.
 *
 * Scales the 5-phase proportions to ANY total duration:
 *   Entry       13.3%
 *   Activation  20.0%
 *   Peak        26.7%
 *   Regulation  20.0%
 *   Integration 20.0%
 *
 * Lifecycle:
 *   const conductor = new ChamberConductor({ dna, durationSec, onPhaseChange })
 *   conductor.start()
 *   ... ticks every 250ms, emits phase change events when crossing boundaries ...
 *   conductor.stop()
 *   conductor.dispose()
 */

import type { ChamberDNA } from './ChamberDNAEngine'

export type PhaseId = 'entry' | 'activation' | 'peak' | 'regulation' | 'integration'

export interface PhaseSpec {
  id: PhaseId
  label: string
  proportion: number      // fraction of total duration
  /** 0..1 energy envelope at the phase START */
  energyStart: number
  /** 0..1 energy envelope at the phase END */
  energyEnd: number
  /** Visual brightness multiplier */
  brightness: number
  /** Geometry complexity multiplier */
  complexity: number
  /** Motion intensity multiplier */
  motion: number
}

// Reference 900-second phase plan, expressed as proportions.
// Scale to any total duration by multiplying.
export const PHASE_SPEC: PhaseSpec[] = [
  { id: 'entry',       label: 'Entry',        proportion: 0.133, energyStart: 0.00, energyEnd: 0.30, brightness: 0.35, complexity: 0.25, motion: 0.30 },
  { id: 'activation',  label: 'Activation',   proportion: 0.200, energyStart: 0.30, energyEnd: 0.85, brightness: 0.65, complexity: 0.50, motion: 0.55 },
  { id: 'peak',        label: 'Peak',         proportion: 0.267, energyStart: 0.85, energyEnd: 1.00, brightness: 1.00, complexity: 1.00, motion: 0.85 },
  { id: 'regulation',  label: 'Regulation',   proportion: 0.200, energyStart: 1.00, energyEnd: 0.50, brightness: 0.75, complexity: 0.65, motion: 0.45 },
  { id: 'integration', label: 'Integration',  proportion: 0.200, energyStart: 0.50, energyEnd: 0.15, brightness: 0.45, complexity: 0.35, motion: 0.25 },
]

// ─── EVENTS ────────────────────────────────────────────────────────

export interface ConductorState {
  /** Wall-clock seconds since start() */
  elapsedSec: number
  /** Total chamber duration */
  totalSec: number
  /** 0..1 across whole session */
  globalProgress: number
  /** Current phase */
  phaseId: PhaseId
  phaseLabel: string
  /** 0..1 within current phase */
  phaseProgress: number
  /** Smoothed energy envelope 0..1 (interpolates within phase) */
  energy: number
  /** Phase-derived visual scalars */
  brightness: number
  complexity: number
  motion: number
  /** True if conductor is currently running */
  running: boolean
}

type StateSubscriber = (state: ConductorState) => void
type PhaseSubscriber = (phaseId: PhaseId, previousPhaseId: PhaseId | null) => void

// ─── BOUNDARY COMPUTATION ──────────────────────────────────────────

interface PhaseBoundary {
  spec: PhaseSpec
  startSec: number
  endSec: number
}

function computeBoundaries(totalSec: number): PhaseBoundary[] {
  let cum = 0
  return PHASE_SPEC.map((spec) => {
    const startSec = cum
    const endSec = cum + spec.proportion * totalSec
    cum = endSec
    return { spec, startSec, endSec }
  })
}

// Smoothstep easing for energy envelope interpolation
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

// ─── CONDUCTOR CLASS ───────────────────────────────────────────────

export interface ChamberConductorOptions {
  dna: ChamberDNA
  durationSec: number
  /** Polling tick interval (ms). 250 = 4 fps state updates — plenty for visuals + sound. */
  tickMs?: number
  /** Fired on every tick with the latest state */
  onTick?: StateSubscriber
  /** Fired ONLY when phase changes (transitions) */
  onPhaseChange?: PhaseSubscriber
}

export class ChamberConductor {
  private dna: ChamberDNA
  private totalSec: number
  private tickMs: number
  private boundaries: PhaseBoundary[]

  private intervalId: ReturnType<typeof setInterval> | null = null
  private startTime: number = 0     // ms (epoch) — set on start
  private accumulatedPauseMs = 0
  private pauseStart: number | null = null

  private currentPhaseId: PhaseId = 'entry'
  private running = false

  private tickSubs: Set<StateSubscriber> = new Set()
  private phaseSubs: Set<PhaseSubscriber> = new Set()

  constructor(opts: ChamberConductorOptions) {
    this.dna       = opts.dna
    this.totalSec  = opts.durationSec
    this.tickMs    = opts.tickMs ?? 250
    this.boundaries = computeBoundaries(this.totalSec)
    if (opts.onTick)        this.tickSubs.add(opts.onTick)
    if (opts.onPhaseChange) this.phaseSubs.add(opts.onPhaseChange)
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────

  start(): void {
    if (this.running) return
    this.startTime = performance.now()
    this.accumulatedPauseMs = 0
    this.pauseStart = null
    this.currentPhaseId = 'entry'
    this.running = true

    // Fire immediate state + phase
    this.emitState()
    this.fireInitialPhase()

    this.intervalId = setInterval(() => this.tick(), this.tickMs)
  }

  stop(): void {
    if (!this.running) return
    this.running = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    // Final emit so subscribers see the end state
    this.emitState()
  }

  pause(): void {
    if (!this.running || this.pauseStart != null) return
    this.pauseStart = performance.now()
  }

  resume(): void {
    if (!this.running || this.pauseStart == null) return
    this.accumulatedPauseMs += performance.now() - this.pauseStart
    this.pauseStart = null
  }

  dispose(): void {
    this.stop()
    this.tickSubs.clear()
    this.phaseSubs.clear()
  }

  /** Jump to a specific phase (for preview mode / practitioner override). */
  jumpToPhase(target: PhaseId): void {
    const boundary = this.boundaries.find((b) => b.spec.id === target)
    if (!boundary) return
    const newElapsedMs = boundary.startSec * 1000
    this.startTime = performance.now() - newElapsedMs - this.accumulatedPauseMs
    this.maybeEmitPhaseChange()
    this.emitState()
  }

  /** Change total duration mid-flight (rare; used for practitioner adjustments). */
  setDuration(durationSec: number): void {
    this.totalSec = durationSec
    this.boundaries = computeBoundaries(durationSec)
  }

  subscribe(cb: StateSubscriber): () => void {
    this.tickSubs.add(cb)
    return () => this.tickSubs.delete(cb)
  }

  onPhase(cb: PhaseSubscriber): () => void {
    this.phaseSubs.add(cb)
    return () => this.phaseSubs.delete(cb)
  }

  getState(): ConductorState {
    return this.computeState()
  }

  // ─── INTERNAL ────────────────────────────────────────────────────

  private tick(): void {
    if (this.pauseStart != null) return    // paused
    const before = this.currentPhaseId
    this.maybeEmitPhaseChange()
    this.emitState()
    // If we ran past the end, stop
    const state = this.computeState()
    if (state.elapsedSec >= this.totalSec) {
      this.stop()
    }
    void before
  }

  private computeElapsedSec(): number {
    if (!this.running && this.startTime === 0) return 0
    const nowMs = performance.now()
    const pausedMs = this.pauseStart != null
      ? this.accumulatedPauseMs + (nowMs - this.pauseStart)
      : this.accumulatedPauseMs
    const elapsedMs = nowMs - this.startTime - pausedMs
    return Math.max(0, Math.min(this.totalSec, elapsedMs / 1000))
  }

  private findBoundary(elapsedSec: number): PhaseBoundary {
    for (const b of this.boundaries) {
      if (elapsedSec < b.endSec) return b
    }
    return this.boundaries[this.boundaries.length - 1]
  }

  private computeState(): ConductorState {
    const elapsedSec = this.computeElapsedSec()
    const boundary = this.findBoundary(elapsedSec)
    const phaseProgress = boundary.endSec === boundary.startSec
      ? 0
      : (elapsedSec - boundary.startSec) / (boundary.endSec - boundary.startSec)
    const energyLerp = smoothstep(Math.max(0, Math.min(1, phaseProgress)))
    const energy = boundary.spec.energyStart +
      (boundary.spec.energyEnd - boundary.spec.energyStart) * energyLerp

    return {
      elapsedSec,
      totalSec: this.totalSec,
      globalProgress: this.totalSec > 0 ? elapsedSec / this.totalSec : 0,
      phaseId: boundary.spec.id,
      phaseLabel: boundary.spec.label,
      phaseProgress: Math.max(0, Math.min(1, phaseProgress)),
      energy,
      brightness: boundary.spec.brightness,
      complexity: boundary.spec.complexity,
      motion: boundary.spec.motion,
      running: this.running,
    }
  }

  private emitState(): void {
    const state = this.computeState()
    this.tickSubs.forEach((cb) => {
      try { cb(state) } catch (err) { console.warn('[Conductor] tick subscriber threw:', err) }
    })
  }

  private maybeEmitPhaseChange(): void {
    const elapsedSec = this.computeElapsedSec()
    const boundary = this.findBoundary(elapsedSec)
    if (boundary.spec.id !== this.currentPhaseId) {
      const prev = this.currentPhaseId
      this.currentPhaseId = boundary.spec.id
      this.phaseSubs.forEach((cb) => {
        try { cb(this.currentPhaseId, prev) } catch (err) {
          console.warn('[Conductor] phase subscriber threw:', err)
        }
      })
    }
  }

  private fireInitialPhase(): void {
    this.phaseSubs.forEach((cb) => {
      try { cb(this.currentPhaseId, null) } catch (err) {
        console.warn('[Conductor] initial phase subscriber threw:', err)
      }
    })
  }

  /** Read-only DNA reference — for consumers that need it from the conductor */
  get chamberDNA(): ChamberDNA {
    return this.dna
  }
}
