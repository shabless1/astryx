/**
 * ASTRYX Chamber — Session Containers
 * ════════════════════════════════════════════════════════════════════════════
 * Astryx is SESSION-based, not a timer app. There are now FOUR containers:
 *
 *   15-Minute Personal Recalibration   (Individual + Practitioner)  — corrective
 *   30-Minute Deep Chamber             (Individual + Practitioner)  — corrective
 *   60-Minute Practitioner Session     (Practitioner only)          — corrective
 *   Full-Spectrum Recalibration        (Everyone)                   — attunement
 *
 * CORRECTIVE containers (15/30/60): a FIXED phase architecture of an Earth-Day
 * grounded open → N distinct working forks → [lead reprise on 30/60] → Earth-Year
 * close. The PLANETS placed into the working phases are resolved per user by the
 * COMPOSITION ENGINE (composeSessionForks in forkRite.ts) from the full
 * signal-hierarchy + intention + resources — never the old 3-role collapse that
 * repeated the primary. `forkCount` (4/6/8) is how many DISTINCT forks the
 * composer must produce; `reprise` allows ONE lead reprise (30/60 only).
 *
 * FULL-SPECTRUM container: a feet-up attunement — opening breath (Earth Day) →
 * all 10 planetary forks Neptune→Mars (each its NAT/balanced track) → closing
 * breath (Earth Year). Built by buildFullSpectrumSequence(); `fullSpectrum: true`
 * routes SessionScreen to that builder. It does NOT consult the signalHierarchy
 * and never drives any planet's excess track (Directive J · 2026-06-28).
 *
 * Deterministic everywhere — no Math.random; time splits are arithmetic.
 */

export type ChamberDurationKey =
  | '15_PERSONAL' | '30_DEEP' | '60_PRACTITIONER' | 'FULL_SPECTRUM' | 'FULL_BODY' | 'CHAKRA'

/** A phase slot in a container's fixed architecture. */
export type PhaseRole =
  | 'ground'            // Opening Ground — Earth Om / Earth Day, settle the field
  | 'signalFork'        // a composed working fork (planet from composeSessionForks)
  | 'primaryReturn'     // Primary Return — the single allowed lead reprise (30/60)
  | 'integration'       // Integration Close — seal the recalibration
  | 'earthClose'        // Earth Close — Earth Year ground before completion
  | 'silentIntegration' // Silent Integration — quiet assimilation (60 only)
  | 'breathwork'        // Full-Spectrum breath bookend — NO fork (Earth audio under it)

/** Which source fills a phase slot. */
export type PhaseSource =
  | 'Earth'      // app-played Earth Om (136.10 Hz) / Earth bookend audio
  | 'composed'   // the next DISTINCT fork from composeSessionForks()
  | 'reprise'    // the lead fork again (composed[0]) — single return-home beat
  | 'breath'     // breathwork phase — no fork, no planet tone
  | 'silence'    // quiet assimilation — no fork

export interface PhaseArchitectureStep {
  phase: string            // display name, e.g. "Opening Ground" ('' = builder fills)
  role: PhaseRole
  durationMinutes: number
  source: PhaseSource
  purpose: string
}

export interface ChamberDurationPreset {
  key: ChamberDurationKey
  label: string
  description: string
  durationSec: number
  /** Visible in this mode and above. */
  minMode: 'user' | 'practitioner'
  /** The fixed phase architecture. */
  architecture: PhaseArchitectureStep[]
  /** CORRECTIVE: how many DISTINCT working forks the composer must produce. */
  forkCount?: number
  /** CORRECTIVE: allow ONE lead reprise as the penultimate beat (30/60 only). */
  reprise?: boolean
  /** Routes SessionScreen to buildFullSpectrumSequence() (the 10-fork sweep). */
  fullSpectrum?: boolean
  /** v4.3 — routes SessionScreen to buildFullBodySequence() (the 12-fork
   *  ladder: ground → 12 up → crown turn → 12 down → ground). Chart-independent
   *  and canonical — runnable without a reading. */
  fullBody?: boolean
  /** v4.3.1 — routes SessionScreen to buildChakraSequence() (7 centers,
   *  root→crown→root; instrument = Solfeggio or Planetary forks). */
  chakra?: boolean
}

// ── Full-Spectrum timing (OPEN ITEM for SHA — retune by ear) ─────────────────
// One clearly-commented constant so per-fork dwell is a one-number change, not a
// refactor. 180 + (10 × 132) + 180 = 1680s = 28 min.
export const FULL_SPECTRUM_TIMING = {
  openBreathSec: 180,   // opening breathwork (Earth Day under it)
  perForkSec: 132,      // ~2.2 min per fork × 10 forks  ← tweak this to retune dwell
  closeBreathSec: 180,  // closing breathwork (Earth Year under it)
}
const FULL_SPECTRUM_SEC =
  FULL_SPECTRUM_TIMING.openBreathSec +
  FULL_SPECTRUM_TIMING.perForkSec * 10 +
  FULL_SPECTRUM_TIMING.closeBreathSec

// Working-fork helper — N composed phases with even nominal minutes (the builder
// re-tiles to durationSec exactly; these are just proportions + the fork count).
const forkPhases = (n: number, minutesEach: number): PhaseArchitectureStep[] =>
  Array.from({ length: n }, () => ({
    phase: '', role: 'signalFork' as PhaseRole, durationMinutes: minutesEach,
    source: 'composed' as PhaseSource, purpose: '',
  }))

// ─── 15-Minute Personal Recalibration — 4 distinct forks, no reprise ─────────
const ARCH_15: PhaseArchitectureStep[] = [
  { phase: 'Opening Ground', role: 'ground', durationMinutes: 2, source: 'Earth', purpose: 'settle the field and prepare the body' },
  ...forkPhases(4, 2.5),
  { phase: 'Earth Close', role: 'earthClose', durationMinutes: 3, source: 'Earth', purpose: 'ground the session before completion' },
]

// ─── 30-Minute Deep Chamber — 6 distinct forks + one lead reprise ────────────
const ARCH_30: PhaseArchitectureStep[] = [
  { phase: 'Opening Ground', role: 'ground', durationMinutes: 3, source: 'Earth', purpose: 'settle the body and open the chamber' },
  ...forkPhases(6, 3.5),
  { phase: 'Primary Return', role: 'primaryReturn', durationMinutes: 3, source: 'reprise', purpose: 'return home to the lead signal after the full support sequence' },
  { phase: 'Earth Close', role: 'earthClose', durationMinutes: 3, source: 'Earth', purpose: 'ground the session before completion' },
]

// ─── 60-Minute Practitioner Session — 8 distinct forks + lead reprise + silent ─
const ARCH_60: PhaseArchitectureStep[] = [
  { phase: 'Opening Ground', role: 'ground', durationMinutes: 5, source: 'Earth', purpose: 'settle the client and establish the chamber field' },
  ...forkPhases(8, 5),
  { phase: 'Primary Return', role: 'primaryReturn', durationMinutes: 6, source: 'reprise', purpose: 'return to the lead signal after the full support sequence' },
  { phase: 'Earth Close', role: 'earthClose', durationMinutes: 6, source: 'Earth', purpose: 'ground the client before session completion' },
  { phase: 'Silent Integration', role: 'silentIntegration', durationMinutes: 3, source: 'silence', purpose: 'allow quiet assimilation before post-session check-in' },
]

// ─── Full-Spectrum Recalibration — breath bookends; builder fills the 10 forks ─
const ARCH_FULL_SPECTRUM: PhaseArchitectureStep[] = [
  { phase: 'Opening Breath', role: 'breathwork', durationMinutes: FULL_SPECTRUM_TIMING.openBreathSec / 60, source: 'breath', purpose: 'settle the field and prepare the body' },
  { phase: 'Closing Breath', role: 'breathwork', durationMinutes: FULL_SPECTRUM_TIMING.closeBreathSec / 60, source: 'breath', purpose: 'seal the session and ground' },
]

// ─── v4.3 Full Body Recalibration — the 12-fork ladder, up and back down ──────
// 2100s (35 min) canonical: ground open → 12 ascending rungs → crown turn →
// 12 descending sweep rungs → ground close. buildFullBodySequence() scales the
// same proportions to ANY durationSec, so future Quick/Extended variants are a
// durationSec change, not a refactor. Architecture lists only the bookends —
// the builder fills the 24 rungs + turn (mirrors the FULL_SPECTRUM pattern).
const FULL_BODY_SEC = 2100
const ARCH_FULL_BODY: PhaseArchitectureStep[] = [
  { phase: 'Opening Ground', role: 'ground', durationMinutes: 2.5, source: 'Earth', purpose: 'settle the field and prepare the body' },
  { phase: 'Earth Close', role: 'earthClose', durationMinutes: 2.5, source: 'Earth', purpose: 'ground the ladder before completion' },
]

export const CHAMBER_DURATIONS: ChamberDurationPreset[] = [
  { key: '15_PERSONAL',     label: '15-Minute Personal Recalibration', description: 'A complete personal recalibration session', durationSec:  900, minMode: 'user',         architecture: ARCH_15, forkCount: 4, reprise: false },
  { key: '30_DEEP',         label: '30-Minute Deep Chamber',           description: 'A deeper, fuller chamber session',          durationSec: 1800, minMode: 'user',         architecture: ARCH_30, forkCount: 6, reprise: true },
  { key: '60_PRACTITIONER', label: '60-Minute Practitioner Session',   description: 'The full client service protocol',         durationSec: 3600, minMode: 'practitioner', architecture: ARCH_60, forkCount: 8, reprise: true },
  { key: 'FULL_SPECTRUM',   label: 'Full-Spectrum Recalibration',      description: 'All ten planetary forks, feet to head — a full-body attunement', durationSec: FULL_SPECTRUM_SEC, minMode: 'user', architecture: ARCH_FULL_SPECTRUM, fullSpectrum: true },
  { key: 'FULL_BODY',       label: 'Full Body Recalibration',          description: 'The complete anatomical ladder — all twelve forks, ground to crown and back', durationSec: FULL_BODY_SEC, minMode: 'user', architecture: ARCH_FULL_BODY, fullBody: true },
  // v4.3.1 — 1650s (27.5 min): ground 180 → 7 centers ×114 → crown turn 72 →
  // 7 sweep centers ×60 → ground 180. Builder scales to any durationSec.
  { key: 'CHAKRA',          label: 'Chakra Recalibration',             description: 'The seven centers, root to crown and back — Solfeggio or Planetary forks', durationSec: 1650, minMode: 'user', architecture: ARCH_FULL_BODY, chakra: true },
]

export const DEFAULT_CHAMBER_DURATION: ChamberDurationKey = '15_PERSONAL'

export function getDurationPreset(key: ChamberDurationKey): ChamberDurationPreset {
  // Fallback to the 15-min personal container (also catches any stale persisted key).
  return CHAMBER_DURATIONS.find((p) => p.key === key) ?? CHAMBER_DURATIONS[0]
}

export function durationsForMode(mode: 'user' | 'practitioner'): ChamberDurationPreset[] {
  if (mode === 'practitioner') return CHAMBER_DURATIONS
  // Individual sees everything EXCEPT the 60-min practitioner session.
  return CHAMBER_DURATIONS.filter((p) => p.minMode === 'user')
}
