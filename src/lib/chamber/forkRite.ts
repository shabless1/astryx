/**
 * ASTRYX — The Fork Sequence + Composition Engine  (Directive J · 2026-06-28)
 * ════════════════════════════════════════════════════════════════════════════
 * Two builders, one file:
 *
 * 1) buildForkSequence() — CORRECTIVE sessions (15/30/60). The working phases of
 *    each container are filled by composeSessionForks(): an ordered, de-duplicated
 *    list of ≥4 DISTINCT forks drawn from the FULL intelligence the engine already
 *    computes (signal hierarchy surface→root→aggravator, polarity regulators,
 *    intention planet, resourced/balance planets). This replaces the old
 *    resolvePlanets() 3-role collapse that repeated the primary and dropped the
 *    secondary/tertiary signals + intention.
 *
 *    NEVER-AMPLIFY (generalized): any candidate signal in an excess/blocked state
 *    is represented by its corrective REGULATOR, never by itself. A deficient/
 *    balanced signal is placed as itself (to activate). Applied to EVERY tier, so
 *    the whole set is non-amplifying — not just the lead.
 *
 *    BALANCE GUARANTEE: the set always contains ≥1 activation/resource fork (the
 *    intention planet, a resourced planet, a deficient signal as itself, or a
 *    neutral grounding fork), so a session is never pure suppression.
 *
 * 2) buildFullSpectrumSequence() — the ATTUNEMENT session. Opening breath (Earth
 *    Day audio) → all 10 planetary forks feet→head (Neptune→Mars), each its NAT
 *    track → closing breath (Earth Year audio). Ignores the signal hierarchy and
 *    never pulls any planet's excess track.
 *
 * Deterministic: same inputs = the same timeline, second for second. No
 * Math.random anywhere; time splits are arithmetic.
 */

import sacredTonesData from '@/data/sacredTones_nervousSystem.json'
import type { SacredFork, SignalHierarchy, PolarityResultLike, PolarityStateLike } from '@/types'
import type { PhaseArchitectureStep, PhaseRole } from '@/lib/chamber/durationPresets'
import { FULL_SPECTRUM_TIMING } from '@/lib/chamber/durationPresets'

export type StepRole = PhaseRole

export interface SequenceStep {
  idx: number
  role: PhaseRole
  /** Architecture phase display name, e.g. "Opening Ground". */
  phaseLabel: string
  /** Why this phase exists. */
  purpose: string
  /** Canonical planet name, or 'Earth' (Om) / 'Silence' / 'Breath'. */
  planet: string
  fork: SacredFork | null   // null for Earth Om, Silence, Breath
  hz: number                // 136.10 for Earth, 0 for Silence/Breath
  startSec: number
  holdSec: number
  /** v4.3 — the zodiac sign whose body territory this step works (ladder rungs
   *  only). Drives the SIGN-based body-map placement in the Full Body session. */
  sign?: string
  /** Short slot label for display: 'primary' | 'support' | 'integration' | … */
  slotLabel: string
}

const PLANET_TO_FORK: Record<string, string> = {
  Sun: 'Sun', Moon: 'Full Moon', Mercury: 'Mercury', Venus: 'Venus',
  Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn',
  Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto',
}
// Grounding-leaning planets, in preference order, for backfill.
const GROUNDING_PREFERENCE = ['Saturn', 'Venus', 'Moon', 'Sun']
// Integration/close planets (real fork planets that settle & ground).
const INTEGRATION_PREFERENCE = ['Saturn', 'Moon', 'Venus', 'Sun']

const FORKS = sacredTonesData as SacredFork[]
const EARTH_OM_HZ = 136.10

/** Resolve a planet to its Sacred Tone fork (Moon → 'Full Moon'). Exported so the
 *  daily dashboard can suggest a fork for the headline transit's planet. */
export function forkFor(planet: string): SacredFork | null {
  const name = PLANET_TO_FORK[planet]
  return name ? (FORKS.find((f) => f.planet === name) ?? null) : null
}
function hzFor(planet: string): number {
  const f = forkFor(planet)
  const parsed = f ? parseFloat(String(f.hz)) : NaN
  return Number.isFinite(parsed) ? parsed : 0
}

const SLOT_LABEL: Record<PhaseRole, string> = {
  ground: 'ground', signalFork: 'signal', primaryReturn: 'primary',
  integration: 'integration', earthClose: 'ground', silentIntegration: 'silence',
  breathwork: 'breath',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSITION ENGINE  (Directive J.6)
// ════════════════════════════════════════════════════════════════════════════

type ComposedRole = 'lead' | 'secondary' | 'tertiary' | 'intention' | 'resource' | 'backfill'

export interface ComposedFork {
  planet: string
  role: ComposedRole
  /** True = an activation/resource placement (self/resource/grounding); false =
   *  a suppression regulator (counterweight for an overstimulated signal). */
  activation: boolean
}

export interface ComposeInput {
  hierarchy?: SignalHierarchy
  /** Dominant polarity — supplies the primary's regulators + state. */
  polarity?: PolarityResultLike
  /** ALL planets' polarity results — per-candidate state lookup (never-amplify). */
  polarityResults?: PolarityResultLike[]
  /** The intention fork (J.5) — guaranteed a slot when present. */
  intentionPlanet?: string | null
  /** Planets the user marked balanced/strong (Directive I.1) — resources. */
  resourcedPlanets?: string[]
  /** Distinct fork count to produce (container forkCount; floor 4). */
  targetCount: number
}

const isOverstim = (s?: PolarityStateLike): boolean => s === 'excess' || s === 'blocked'

function stateOf(planet: string, results?: PolarityResultLike[], fallback: PolarityStateLike = 'balanced'): PolarityStateLike {
  return results?.find((r) => r.planet === planet)?.dominant_state ?? fallback
}

/** The corrective counterweight (regulator) for an overstimulated planet. */
function counterweightFor(planet: string, results: PolarityResultLike[] | undefined, polarity: PolarityResultLike | undefined, used: Set<string>): string {
  const own = results?.find((r) => r.planet === planet)?.protocol?.regulator_planets ?? []
  const fromPolarity = polarity?.planet === planet ? (polarity.protocol?.regulator_planets ?? []) : []
  const regs = [...own, ...fromPolarity].filter(Boolean)
  return regs.find((r) => r !== planet && PLANET_TO_FORK[r] && !used.has(r))
    ?? GROUNDING_PREFERENCE.find((p) => p !== planet && !used.has(p))
    ?? 'Saturn'
}

/**
 * The composer — returns ordered, de-duplicated ComposedFork[] of length
 * `targetCount` (floor 4). Exported rich form (used by buildForkSequence for
 * phase labels) + a string-only convenience (composeSessionForks) for callers/QA.
 */
export function composeSessionForkSteps(input: ComposeInput): ComposedFork[] {
  const { hierarchy, polarity, polarityResults, intentionPlanet } = input
  const resourced = (input.resourcedPlanets ?? []).filter(Boolean)
  const target = Math.max(4, input.targetCount || 4)

  const out: ComposedFork[] = []
  const used = new Set<string>()

  const add = (planet: string | undefined | null, role: ComposedRole, activation: boolean): void => {
    if (!planet || !PLANET_TO_FORK[planet] || used.has(planet)) return
    used.add(planet)
    out.push({ planet, role, activation })
  }
  /** Place a SIGNAL planet honoring never-amplify: overstim → its regulator
   *  (suppression), deficient/balanced → itself (activation). */
  const addSignal = (planet: string | undefined, role: ComposedRole, state: PolarityStateLike): void => {
    if (!planet) return
    if (isOverstim(state)) add(counterweightFor(planet, polarityResults, polarity, used), role, false)
    else add(planet, role, true)
  }
  // NEVER-AMPLIFY backstop for BACKFILL: a planet in an excess/blocked state must
  // never be sounded as itself (it would pull its EXC corrective track). Built
  // from every state source; backfill skips these planets entirely.
  const overstimSet = new Set<string>()
  for (const r of polarityResults ?? []) if (isOverstim(r.dominant_state)) overstimSet.add(r.planet)
  if (polarity && isOverstim(polarity.dominant_state)) overstimSet.add(polarity.planet)
  for (const t of [hierarchy?.primary, hierarchy?.secondary, hierarchy?.tertiary]) if (t && isOverstim(t.state)) overstimSet.add(t.planet)
  const addBackfill = (planet: string, activation: boolean): void => { if (!overstimSet.has(planet)) add(planet, 'backfill', activation) }

  // 1. LEAD — primary signal (or its counterweight if overstimulated).
  const primaryPlanet = hierarchy?.primary?.planet ?? 'Sun'
  const primaryState = hierarchy?.primary?.state ?? polarity?.dominant_state ?? 'balanced'
  addSignal(primaryPlanet, 'lead', primaryState)

  // 2. SECONDARY signal (the chart root thread).
  if (hierarchy?.secondary?.planet) {
    addSignal(hierarchy.secondary.planet, 'secondary', hierarchy.secondary.state ?? stateOf(hierarchy.secondary.planet, polarityResults))
  }
  // 3. TERTIARY signal (the aggravator — where "stalled" → Mercury/Uranus lives).
  if (hierarchy?.tertiary?.planet) {
    addSignal(hierarchy.tertiary.planet, 'tertiary', hierarchy.tertiary.state ?? stateOf(hierarchy.tertiary.planet, polarityResults))
  }
  // 4. INTENTION — guaranteed a slot (J.5). Honors never-amplify too.
  if (intentionPlanet) {
    addSignal(intentionPlanet, 'intention', stateOf(intentionPlanet, polarityResults))
  }
  // 5. RESOURCE / balance anchor — a planet the user marked steady (placed as self).
  for (const rp of resourced) {
    if (out.length >= target) break
    add(rp, 'resource', true)
  }

  // BALANCE GUARANTEE — never a pure-suppression set. If nothing so far is an
  // activation/resource fork, inject one before backfill: intention (if not
  // overstim), else top resourced, else a deficient signal as itself, else the
  // primary planet as itself (extreme fallback — a wholly-overstimulated chart
  // with no expressed intention/resource still gets one self-tone, documented).
  if (!out.some((f) => f.activation)) {
    const deficientPlanet = polarityResults?.find((r) => r.dominant_state === 'deficiency' && !used.has(r.planet))?.planet
    const inject =
      (intentionPlanet && !isOverstim(stateOf(intentionPlanet, polarityResults)) ? intentionPlanet : undefined)
      ?? resourced.find((p) => !used.has(p))
      ?? deficientPlanet
      ?? (primaryPlanet && !isOverstim(primaryState) ? primaryPlanet : undefined)
    if (inject) add(inject, 'resource', true)
  }

  // 6. BACKFILL to the floor — primary's regulators, then integration, then
  // grounding preference, then ALL fork planets (stable order) so a high forkCount
  // (e.g. 60-min = 8) always reaches `target` DISTINCT forks even when few signals
  // were detected. addBackfill skips overstimulated planets (never amplify).
  const regulators = (polarity?.protocol?.regulator_planets ?? []).filter(Boolean)
  for (const r of regulators) { if (out.length >= target) break; addBackfill(r, false) }
  for (const p of INTEGRATION_PREFERENCE) { if (out.length >= target) break; addBackfill(p, true) }
  for (const p of GROUNDING_PREFERENCE) { if (out.length >= target) break; addBackfill(p, true) }
  for (const p of Object.keys(PLANET_TO_FORK)) { if (out.length >= target) break; addBackfill(p, true) }

  return out.slice(0, target)
}

/** Directive J.6 — the ordered, de-duplicated DISTINCT planet list (string form). */
export function composeSessionForks(input: ComposeInput): string[] {
  return composeSessionForkSteps(input).map((f) => f.planet)
}

// Phase label/purpose for each composed role (the working fork eyebrow).
const COMPOSED_PHASE: Record<ComposedRole, { label: string; purpose: string }> = {
  lead:      { label: 'Primary Signal',   purpose: 'work with the leading signal' },
  secondary: { label: 'Secondary Support', purpose: 'carry the supporting thread' },
  tertiary:  { label: 'Tertiary Support', purpose: 'address the aggravating thread' },
  intention: { label: 'Your Intention',   purpose: 'sound the fork your intention calls for' },
  resource:  { label: 'Resource',         purpose: 'draw on a planet that is already steady' },
  backfill:  { label: 'Integration',      purpose: 'broaden and integrate the field' },
}

// ════════════════════════════════════════════════════════════════════════════
// CORRECTIVE BUILDER  (Directive J.7)
// ════════════════════════════════════════════════════════════════════════════

export interface ForkSequenceInput {
  hierarchy?: SignalHierarchy
  /** dominantPolarity — the primary's regulators + state. */
  polarity?: PolarityResultLike
  /** ALL planets' polarity results — per-candidate never-amplify + resourced. */
  polarityResults?: PolarityResultLike[]
  /** Intention fork (J.5). */
  intentionPlanet?: string | null
  /** Explicit resources; else derived from polarityResults' resourced flag. */
  resourcedPlanets?: string[]
  /** The container's fixed phase architecture. */
  architecture: PhaseArchitectureStep[]
  /** Total session seconds (defaults to the sum of architecture minutes). */
  durationSec?: number
  /** Distinct working forks to compose (container forkCount). */
  forkCount?: number
  tier?: 'individual' | 'practitioner'
}

function makeStep(
  idx: number, role: PhaseRole, phaseLabel: string, purpose: string,
  planet: string, startSec: number, holdSec: number,
): SequenceStep {
  let fork: SacredFork | null = null
  let hz = 0
  if (planet === 'Earth') { hz = EARTH_OM_HZ }
  else if (planet === 'Silence' || planet === 'Breath') { hz = 0 }
  else { fork = forkFor(planet); hz = hzFor(planet) }
  return { idx, role, phaseLabel, purpose, planet, fork, hz, startSec, holdSec, slotLabel: SLOT_LABEL[role] ?? role }
}

export function buildForkSequence(input: ForkSequenceInput): SequenceStep[] {
  const { hierarchy, polarity, polarityResults, intentionPlanet, architecture, durationSec } = input
  if (!architecture?.length) return []

  // Resources: explicit list, else the user-marked resourced planets in polarity.
  const resourcedPlanets = input.resourcedPlanets
    ?? (polarityResults ?? []).filter((r) => r.resourced).map((r) => r.planet)

  // How many distinct working forks: container forkCount, else the count of
  // 'composed' phases in the architecture, else 4.
  const composedPhaseCount = architecture.filter((a) => a.source === 'composed').length
  const forkCount = input.forkCount ?? (composedPhaseCount || 4)

  const composed = composeSessionForkSteps({
    hierarchy, polarity, polarityResults, intentionPlanet, resourcedPlanets, targetCount: forkCount,
  })

  const totalMin = architecture.reduce((s, a) => s + a.durationMinutes, 0) || 1
  const targetSec = durationSec && durationSec > 0 ? durationSec : totalMin * 60

  const steps: SequenceStep[] = []
  let cursor = 0
  let composedIdx = 0
  architecture.forEach((phase, i) => {
    const isLast = i === architecture.length - 1
    const holdSec = isLast
      ? Math.max(10, targetSec - cursor)
      : Math.max(10, Math.round((targetSec * phase.durationMinutes) / totalMin))

    let planet = 'Earth'
    let label = phase.phase
    let purpose = phase.purpose
    switch (phase.source) {
      case 'Earth':   planet = 'Earth'; break
      case 'silence': planet = 'Silence'; break
      case 'breath':  planet = 'Breath'; break
      case 'reprise': planet = composed[0]?.planet ?? 'Saturn'; break
      case 'composed': {
        // Normally one distinct fork per phase. If the composed list ran short
        // (extreme: many overstimulated signals excluded from backfill), cycle
        // rather than tripling the last planet.
        const c = composed[composedIdx]
          ?? (composed.length ? composed[composedIdx % composed.length] : undefined)
        composedIdx += 1
        planet = c?.planet ?? GROUNDING_PREFERENCE[0]
        // Working-fork label/purpose follow the composed ROLE (honest — never a
        // fixed "Intention" label over a backfill planet).
        if (c) { label = COMPOSED_PHASE[c.role].label; purpose = COMPOSED_PHASE[c.role].purpose }
        break
      }
      default: planet = 'Earth'
    }

    steps.push(makeStep(i, phase.role, label, purpose, planet, cursor, holdSec))
    cursor += holdSec
  })
  return steps
}

// ════════════════════════════════════════════════════════════════════════════
// FULL-SPECTRUM BUILDER  (Directive J.2)
// ════════════════════════════════════════════════════════════════════════════

/** The locked feet-up sweep (Pisces/feet → Aries/head). Sign + region validated
 *  against data/signs.json `body_regions` (Directive J, ARCHITECT DECISION 2). */
export const FULL_SPECTRUM_SWEEP: { planet: string; sign: string; region: string }[] = [
  { planet: 'Neptune', sign: 'Pisces',      region: 'Feet' },
  { planet: 'Uranus',  sign: 'Aquarius',    region: 'Calves & ankles' },
  { planet: 'Saturn',  sign: 'Capricorn',   region: 'Knees & bones' },
  { planet: 'Jupiter', sign: 'Sagittarius', region: 'Hips & thighs' },
  { planet: 'Pluto',   sign: 'Scorpio',     region: 'Pelvis' },
  { planet: 'Venus',   sign: 'Libra',       region: 'Kidneys & lower back' },
  { planet: 'Mercury', sign: 'Virgo',       region: 'Abdomen & gut' },
  { planet: 'Sun',     sign: 'Leo',         region: 'Heart & spine' },
  { planet: 'Moon',    sign: 'Cancer',      region: 'Chest & stomach' },
  { planet: 'Mars',    sign: 'Aries',       region: 'Head' },
]

/**
 * Full-Spectrum sequence: opening breath → 10 forks feet→head → closing breath.
 * 12 steps. Breath bookends keep their fixed seconds; the remaining time splits
 * evenly across the 10 forks (last fork absorbs rounding). Deterministic.
 * Earth Day/Year audio is applied downstream in SessionScreen, not here.
 */
export function buildFullSpectrumSequence({ durationSec }: { durationSec: number }): SequenceStep[] {
  const open = FULL_SPECTRUM_TIMING.openBreathSec
  const close = FULL_SPECTRUM_TIMING.closeBreathSec
  const total = durationSec && durationSec > 0
    ? durationSec
    : open + close + FULL_SPECTRUM_TIMING.perForkSec * 10
  const forkWindowEnd = Math.max(open + 10, total - close)  // forks live in [open, total-close]
  const forkSpan = forkWindowEnd - open
  const perFork = Math.max(10, Math.round(forkSpan / 10))

  const steps: SequenceStep[] = []
  let cursor = 0

  // 1) Opening breath — no fork (Earth Day audio applied in SessionScreen).
  steps.push(makeStep(0, 'breathwork', 'Opening Breath', 'settle the field and prepare the body', 'Breath', cursor, open))
  cursor += open

  // 2) Ten forks, feet → head, each its NAT track.
  FULL_SPECTRUM_SWEEP.forEach((f, i) => {
    const isLastFork = i === FULL_SPECTRUM_SWEEP.length - 1
    const hold = isLastFork ? Math.max(10, forkWindowEnd - cursor) : perFork
    steps.push(makeStep(i + 1, 'signalFork', `${f.sign} · ${f.region}`, `attune the ${f.planet} fork at the ${f.region.toLowerCase()}`, f.planet, cursor, hold))
    cursor += hold
  })

  // 3) Closing breath — no fork (Earth Year audio applied in SessionScreen).
  steps.push(makeStep(steps.length, 'breathwork', 'Closing Breath', 'seal the session and ground', 'Breath', cursor, Math.max(10, total - cursor)))
  return steps
}

// ════════════════════════════════════════════════════════════════════════════
// FULL BODY RECALIBRATION — the 12-fork ladder (Directive v4.3; the reverse
// sweep Directive J deferred as "Phase 2"). CHART-INDEPENDENT: one canonical,
// byte-identical sequence for every user, every run. No Math.random.
//
// Ladder resolution (documented per v4.3 STEP 0):
//   • Body TERRITORIES come from data/signBodyZones.json (they agree with the
//     FULL_SPECTRUM_SWEEP regions already validated against signs.json).
//   • FORK ASSIGNMENT follows Directive J's LOCKED modern-rulership decision
//     (Pisces→Neptune, Aquarius→Uranus, Scorpio→Pluto) — affirmed by the v4.3
//     table — NOT signBodyZones' `ruling_planet` field, which carries the
//     TRADITIONAL rulers used by the counterweight engine. Traditional-only
//     forks would never sound Neptune/Uranus/Pluto, contradicting "all twelve
//     forks" and the physical Sacred Tones set.
//   • 12 rungs (v4.3) vs J's de-duplicated 10: v4.3 is the newer owner mandate —
//     Mercury (Virgo + Gemini) and Venus (Libra + Taurus) each sound twice; the
//     session variant rotation advances their track deterministically.
// ════════════════════════════════════════════════════════════════════════════

/** The 12-rung anatomical ladder, feet → head (ascending order). */
export const FULL_BODY_LADDER: { planet: string; sign: string; region: string; placement: string }[] = [
  { planet: 'Neptune', sign: 'Pisces',      region: 'Feet',                placement: 'rest the tone at the soles of the feet — the body’s furthest shore' },
  { planet: 'Uranus',  sign: 'Aquarius',    region: 'Ankles & calves',     placement: 'let the tone circle the ankles and calves — the current lines of the legs' },
  { planet: 'Saturn',  sign: 'Capricorn',   region: 'Knees & bones',       placement: 'settle the tone at the knees — the architecture that carries you' },
  { planet: 'Jupiter', sign: 'Sagittarius', region: 'Hips & thighs',       placement: 'open the tone across the hips and thighs — the long muscles of momentum' },
  { planet: 'Pluto',   sign: 'Scorpio',     region: 'Pelvis & sacrum',     placement: 'ground the tone low at the sacrum — the deep root of the spine' },
  { planet: 'Venus',   sign: 'Libra',       region: 'Lower back & kidneys',placement: 'warm the tone across the lower back — the balance point of the torso' },
  { planet: 'Mercury', sign: 'Virgo',       region: 'Gut & digestion',     placement: 'rest the tone over the abdomen — the body’s sorting center' },
  { planet: 'Sun',     sign: 'Leo',         region: 'Heart & spine',       placement: 'bring the tone to the heart center — the hearth of the whole field' },
  { planet: 'Moon',    sign: 'Cancer',      region: 'Chest & stomach',     placement: 'soften the tone at the chest — where the inner tides gather' },
  { planet: 'Mercury', sign: 'Gemini',      region: 'Lungs, arms & hands', placement: 'carry the tone along the arms to the hands — breath and reach' },
  { planet: 'Venus',   sign: 'Taurus',      region: 'Neck & throat',       placement: 'rest the tone at the throat — the voice’s home ground' },
  { planet: 'Mars',    sign: 'Aries',       region: 'Head & crown',        placement: 'crown the tone at the head — the summit of the ladder' },
]

/** Deterministic timing weights — pure proportions of durationSec.
 *  Descending rungs are a SWEEP (~half an ascending hold), not a second full
 *  treatment. Ground bookends match the corrective containers' feel. */
const FULL_BODY_WEIGHTS = {
  ground: 3.0,        // ×2 (open + close)
  ascentRung: 1.9,    // ×12
  crownTurn: 1.2,     // ×1 — the held pause at the top
  descentRung: 1.0,   // ×12
}
const FULL_BODY_TOTAL_WEIGHT =
  FULL_BODY_WEIGHTS.ground * 2 +
  FULL_BODY_WEIGHTS.ascentRung * 12 +
  FULL_BODY_WEIGHTS.crownTurn +
  FULL_BODY_WEIGHTS.descentRung * 12

/**
 * The Full Body Recalibration sequence: Opening Ground → 12 ascending rungs
 * (Pisces→Aries) → Crown Turn (held breath at the top) → 12 descending rungs
 * (Aries→Pisces) → Closing Ground. 27 steps. Pure function of durationSec —
 * scales to any container length; holds tile the duration exactly.
 */
export function buildFullBodySequence({ durationSec }: { durationSec: number }): SequenceStep[] {
  const total = durationSec && durationSec > 0 ? durationSec : 2100
  const unit = total / FULL_BODY_TOTAL_WEIGHT
  const hold = (w: number) => Math.max(10, Math.round(w * unit))

  const steps: SequenceStep[] = []
  let cursor = 0
  const push = (role: PhaseRole, phaseLabel: string, purpose: string, planet: string, holdSec: number, sign?: string) => {
    const s = makeStep(steps.length, role, phaseLabel, purpose, planet, cursor, holdSec)
    if (sign) s.sign = sign
    steps.push(s)
    cursor += holdSec
  }

  // 1) Opening Ground — Earth tone, settle (Earth Day audio under it).
  push('ground', 'Opening Ground', 'settle the field and prepare the body', 'Earth', hold(FULL_BODY_WEIGHTS.ground))

  // 2) Ascending pass — feet to head, full holds.
  for (const rung of FULL_BODY_LADDER) {
    push('signalFork', `Ascent · ${rung.sign} · ${rung.region}`, rung.placement, rung.planet, hold(FULL_BODY_WEIGHTS.ascentRung), rung.sign)
  }

  // 3) Crown Turn — a held pause at the top; breath only, no fork. The previous
  //    planet's music keeps flowing (non-fork steps never restart audio).
  push('breathwork', 'Crown Turn', 'hold at the top — three slow breaths before the descent', 'Breath', hold(FULL_BODY_WEIGHTS.crownTurn))

  // 4) Descending pass — head back to feet, lighter sweep holds.
  for (const rung of [...FULL_BODY_LADDER].reverse()) {
    push('signalFork', `Descent · ${rung.sign} · ${rung.region}`, `returning — a lighter pass at the ${rung.region.toLowerCase()}`, rung.planet, hold(FULL_BODY_WEIGHTS.descentRung), rung.sign)
  }

  // 5) Closing Ground — Earth tone bridge-back (Earth Year audio under it).
  //    Absorbs any rounding remainder so the timeline tiles exactly.
  push('earthClose', 'Earth Close', 'ground the ladder before completion', 'Earth', Math.max(10, total - cursor))

  return steps
}

// ════════════════════════════════════════════════════════════════════════════

/** The step active at `t` seconds (clamped to the last step past the end). */
export function sequenceStepAt(steps: SequenceStep[], t: number): number {
  for (const s of steps) {
    if (t < s.startSec + s.holdSec) return s.idx
  }
  return steps.length - 1
}

/**
 * The ONE canonical fork-sequence label. Ordered non-Earth fork planets (first
 * occurrence; 'Full Moon' → 'Moon'), with 'Earth' appended once as the grounding
 * close. Breath + Silence phases carry no fork and are skipped.
 */
export function forkSequenceDisplay(steps: SequenceStep[]): string[] {
  const seq: string[] = []
  let hasEarth = false
  for (const s of steps) {
    if (s.planet === 'Silence' || s.planet === 'Breath') continue
    if (s.planet === 'Earth') { hasEarth = true; continue }
    const name = s.planet === 'Full Moon' ? 'Moon' : s.planet
    if (!seq.includes(name)) seq.push(name)
  }
  if (hasEarth) seq.push('Earth')
  return seq
}
