/**
 * ASTRYX — Remedy Polarity Engine (Phase A)
 *
 * THE INTELLIGENCE LAYER.
 *
 * Detected planet identifies the PATTERN.
 * State (excess / deficiency / blocked / balanced) determines the REMEDY.
 * Planet ≠ Remedy.
 *
 * Planet + State = Corrective Direction.
 *
 * Astryx must balance the pattern, not amplify the imbalance.
 *
 * This file is the new gatekeeper between diagnosis and recommendation.
 * Phase A: engine + data. No wiring into other engines yet (Phase B).
 *
 * ─── Scoring model ──────────────────────────────────────────────
 *
 * For each detected planet, we accumulate signal weight per state:
 *
 *   excess_score      sum of weights from symptoms tagged "excess"
 *   deficiency_score  sum of weights from symptoms tagged "deficiency"
 *   blocked_score     sum of weights from symptoms tagged "blocked"
 *
 * Plus signal modifiers:
 *
 *   + hard aspects on the planet (square / opposition)  → excess or blocked bias
 *   + fixed sign placement                              → blocked bias
 *   + 6th/8th/12th house placement                      → blocked bias
 *   + cardinal sign placement                           → excess bias
 *   + mutable sign placement + low symptom weight       → deficiency lean
 *
 * Confidence thresholds (per the directive):
 *   0–2 = weak signal   → light balancing only (don't fully flip)
 *   3–5 = moderate      → gentle corrective protocol
 *   6+  = strong        → full polarity correction
 *
 * If no signals are present for a planet → dominant_state = "balanced".
 */

import symptomsData from '@/data/symptoms.json'
import remedyPolarity from '@/data/remedyPolarity.json'
import type { ActivePlanet } from '@/types'

// ─── TYPES ──────────────────────────────────────────────────────────

export type PolarityState = 'excess' | 'deficiency' | 'blocked' | 'balanced'
export type ConfidenceBand = 'weak' | 'moderate' | 'strong'

export interface PolarityInputs {
  /** Tri-source scored active planets from the engine */
  detectedPlanets: ActivePlanet[]
  /** Aspect strings, e.g. ['square', 'trine'] */
  aspects?: string[]
  /** Sign placements per planet (planet → sign) */
  planetSigns?: Record<string, string>
  /** House placements per planet (planet → 1-12) */
  planetHouses?: Record<string, number>
  /** User-reported symptom slugs (lowercase, snake_case to match symptoms.json) */
  userSymptoms?: string[]
  /** User-selected emotional states from intake */
  emotionalState?: string[]
  /** User intentions / goals from intake */
  goals?: string[]
  /** Practitioner override map: planet → forced state (Phase D UI hooks into this) */
  practitionerOverride?: Record<string, PolarityState>
  /** Directive I.1 — planets the user marked balanced/strong. Treated as
   *  resources (forced balanced + preferred as regulators), never deficits. */
  resourcedPlanets?: string[]
  /** Fix 4 — planets that best deliver the user's stated INTENTION (e.g. "calm"
   *  → Moon/Saturn). Preferred when ordering the corrective regulator/support,
   *  AFTER resourced planets. Never invents a non-corrective regulator. */
  intentionSupportPlanets?: string[]
  /** Directive S (S1.6) — body-zone/condition signals already separated into
   *  {planet (action/WHAT), state, weight} by the body-zone resolver. These are
   *  the USER'S reported signal (the light somatic intake), so they fold into the
   *  symptom-authority channel exactly like a reported symptom — never the chart. */
  directSignals?: Array<{ planet: string; state: PolarityState; weight?: number }>
}

export interface CorrectiveProtocol {
  indicators: string[]
  corrective_direction: string[]
  avoid: string[]
  regulator_planets: string[]
  color_palette: string[]
  herbs: string[]
  scents: string[]
  breath: string
  sound_character: string
  visual_motion: string
  scale_override: string | null
  support_style: string
}

export interface PolarityResult {
  planet: string
  dominant_state: PolarityState
  secondary_state?: PolarityState
  confidence: number          // 0-10+ raw score
  confidence_band: ConfidenceBand
  /** Per-state raw scores (debug / practitioner introspection) */
  scores: Record<PolarityState, number>
  /** Reasons that contributed — surfaced for practitioner mode */
  reasoning: string[]
  /** Was this overridden by a practitioner? */
  overridden: boolean
  /** Directive I.1 — user marked this planet balanced/strong (a resource). */
  resourced: boolean
  /** True only if the user's own symptoms backed the dominant state (or a
   *  practitioner override). Chart-only states are neutralized to balanced, so
   *  a non-balanced state always implies symptomDriven === true. */
  symptomDriven: boolean
  /** Resolved corrective protocol data for downstream engines */
  protocol: CorrectiveProtocol
}

// ─── DATA SHAPES (internal) ─────────────────────────────────────────

interface SymptomEntry {
  symptom: string
  related_planets?: string[]
  related_signs?: string[]
  related_houses?: number[]
  weight?: number
  state_signal?: PolarityState | 'neutral'
  corrective_direction?: string[]
}

interface PolarityStateData {
  indicators?: string[]
  corrective_direction?: string[]
  avoid?: string[]
  regulator_planets?: string[]
  color_palette?: string[]
  herbs?: string[]
  scents?: string[]
  breath?: string
  sound_character?: string
  visual_motion?: string
  scale_override?: string | null
  support_style?: string
}

type PolarityData = Record<string, Partial<Record<PolarityState, PolarityStateData>> & { _meta?: any }>

const SYMPTOMS = symptomsData as SymptomEntry[]
const POLARITY = remedyPolarity as unknown as PolarityData

// ─── HELPERS ────────────────────────────────────────────────────────

/** Hard aspects (high-stress = bias toward excess/blocked). */
const HARD_ASPECTS = new Set(['square', 'opposition'])

/** Fixed signs — patterns tend to stick. */
const FIXED_SIGNS = new Set(['Taurus', 'Leo', 'Scorpio', 'Aquarius'])
/** Cardinal signs — patterns tend to push outward. */
const CARDINAL_SIGNS = new Set(['Aries', 'Cancer', 'Libra', 'Capricorn'])
/** Mutable signs — patterns tend to scatter / lean deficient. */
const MUTABLE_SIGNS = new Set(['Gemini', 'Virgo', 'Sagittarius', 'Pisces'])

/** Houses suggesting hidden / blocked expression. */
const HIDDEN_BLOCKED_HOUSES = new Set([6, 8, 12])

function emptyScores(): Record<PolarityState, number> {
  return { excess: 0, deficiency: 0, blocked: 0, balanced: 0 }
}

function bandFor(score: number): ConfidenceBand {
  if (score <= 2) return 'weak'
  if (score <= 5) return 'moderate'
  return 'strong'
}

function getStateData(planet: string, state: PolarityState): PolarityStateData {
  return POLARITY[planet]?.[state] ?? {}
}

function buildCorrectiveProtocol(planet: string, state: PolarityState): CorrectiveProtocol {
  const d = getStateData(planet, state)
  return {
    indicators: d.indicators ?? [],
    corrective_direction: d.corrective_direction ?? [],
    avoid: d.avoid ?? [],
    regulator_planets: d.regulator_planets ?? [],
    color_palette: d.color_palette ?? [],
    herbs: d.herbs ?? [],
    scents: d.scents ?? [],
    breath: d.breath ?? 'balanced',
    sound_character: d.sound_character ?? 'centered',
    visual_motion: d.visual_motion ?? 'natural_flow',
    scale_override: d.scale_override ?? null,
    support_style: d.support_style ?? 'maintenance',
  }
}

// ─── MAIN ───────────────────────────────────────────────────────────

/**
 * Determine the polarity state + corrective protocol for each detected planet.
 *
 * Outputs ONE PolarityResult per detected planet, sorted by confidence (desc).
 * All downstream engines should read from these results, never from raw planet.
 */
export function determinePolarity(inputs: PolarityInputs): PolarityResult[] {
  const planets = inputs.detectedPlanets ?? []
  const userSymptoms = (inputs.userSymptoms ?? []).map((s) => s.toLowerCase())
  const emotionalState = (inputs.emotionalState ?? []).map((s) => s.toLowerCase())
  const goals = (inputs.goals ?? []).map((s) => s.toLowerCase())
  const aspects = (inputs.aspects ?? []).map((a) => a.toLowerCase())
  const planetSigns = inputs.planetSigns ?? {}
  const planetHouses = inputs.planetHouses ?? {}
  const overrides = inputs.practitionerOverride ?? {}
  // Directive I.1 — the user's confirmed-strong planets (case-insensitive).
  const resourcedSet = new Set((inputs.resourcedPlanets ?? []).map((p) => p.toLowerCase()))
  // Fix 4 — intention-support planets (ordered), preferred as regulators after
  // resourced planets. Lowercased for matching; original order preserved for tiebreak.
  const intentionSupport = (inputs.intentionSupportPlanets ?? []).map((p) => p.toLowerCase())
  const intentionSet = new Set(intentionSupport)

  const results: PolarityResult[] = []

  for (const detected of planets) {
    const planet = detected.planet

    // symptomContribution = the user's reported signal per state (sections 1-2).
    // THIS IS THE AUTHORITY FOR THE POLARITY STATE (Directive v2 Part A). The
    // chart never overrides what the user reports feeling today.
    const symptomContribution = emptyScores()
    // chartBias = structural nudges (transit / aspect / sign / house). These may
    // only adjust CONFIDENCE or break a tie BETWEEN symptom-supported states —
    // they must NEVER set or flip the state on their own. This is what killed
    // the old "everything reads as running hot" bug: chart excess-bias used to
    // swamp the symptom signal.
    const chartBias = emptyScores()
    const reasoning: string[] = []

    // ── 1. User-reported symptoms (the primary signal) ──
    for (const symInput of userSymptoms) {
      const entry = SYMPTOMS.find((s) => s.symptom === symInput)
      if (!entry) continue
      if (!(entry.related_planets ?? []).includes(planet)) continue
      const sig = entry.state_signal
      const w = entry.weight ?? 1
      if (sig && sig !== 'neutral') {
        symptomContribution[sig] += w
        reasoning.push(`symptom "${symInput}" → ${sig} (+${w})`)
      }
    }

    // ── 2. Emotional state from intake (also a user signal) ──
    for (const mood of emotionalState) {
      const entry = SYMPTOMS.find((s) => s.symptom === mood)
      if (!entry) continue
      if (!(entry.related_planets ?? []).includes(planet)) continue
      const sig = entry.state_signal
      const w = Math.max(1, Math.floor((entry.weight ?? 2) * 0.6))
      if (sig && sig !== 'neutral') {
        symptomContribution[sig] += w
        reasoning.push(`emotional state "${mood}" → ${sig} (+${w})`)
      }
    }

    // ── 2b. Body-zone / condition signals (Directive S) — user authority ──
    // Already resolved to {planet, state, weight}; fold into the symptom channel
    // for THIS planet so a held knee (Saturn/blocked) drives the state like any
    // reported symptom. The chart still cannot flip it.
    for (const ds of inputs.directSignals ?? []) {
      if (ds.planet !== planet) continue
      if (ds.state === 'balanced') continue
      const w = ds.weight ?? 2
      symptomContribution[ds.state] += w
      reasoning.push(`body-zone signal → ${ds.state} (+${w})`)
    }

    // ── 3-6. Chart structure → chartBias ONLY (never the state) ──
    if (detected.transitPressure >= 6) {
      chartBias.excess += 2
      reasoning.push(`high transit pressure (${detected.transitPressure}) → excess bias (+2 confidence-only)`)
    } else if (detected.transitPressure >= 4) {
      chartBias.excess += 1
      reasoning.push(`moderate transit pressure (${detected.transitPressure}) → excess bias (+1 confidence-only)`)
    }
    if (detected.symptomScore >= 5) {
      chartBias.excess += 1
      reasoning.push(`broad symptom load → excess bias (+1 confidence-only)`)
    }
    const hardAspectCount = aspects.filter((a) => HARD_ASPECTS.has(a)).length
    if (hardAspectCount >= 1) {
      chartBias.excess += 1
      chartBias.blocked += 1
      reasoning.push(`hard aspect present → excess/blocked bias (+1 each, confidence-only)`)
    }
    const sign = planetSigns[planet]
    if (sign) {
      if (FIXED_SIGNS.has(sign)) {
        chartBias.blocked += 1
        reasoning.push(`fixed sign ${sign} → blocked bias (+1 confidence-only)`)
      } else if (CARDINAL_SIGNS.has(sign)) {
        chartBias.excess += 1
        reasoning.push(`cardinal sign ${sign} → excess bias (+1 confidence-only)`)
      } else if (MUTABLE_SIGNS.has(sign)) {
        chartBias.deficiency += 1
        reasoning.push(`mutable sign ${sign} → deficiency bias (+1 confidence-only)`)
      }
    }
    const house = planetHouses[planet]
    if (house && HIDDEN_BLOCKED_HOUSES.has(house)) {
      chartBias.blocked += 1
      reasoning.push(`house ${house} (hidden/blocked) → blocked bias (+1 confidence-only)`)
    }

    // ── 7. Decide the STATE — symptom signal is primary ──
    const SYM_STATES: PolarityState[] = ['excess', 'deficiency', 'blocked']
    const isResourced = resourcedSet.has(planet.toLowerCase())
    let dominant: PolarityState
    let overridden = false
    if (overrides[planet]) {
      dominant = overrides[planet]
      overridden = true
      reasoning.push(`PRACTITIONER OVERRIDE → ${dominant}`)
    } else if (isResourced) {
      // Directive I.1 — a planet the user confirmed strong is a RESOURCE, not a
      // deficit. It never carries an imbalance state; the chart cannot flip it.
      dominant = 'balanced'
      reasoning.push(`user marked ${planet} balanced/strong → resource (never a deficit)`)
    } else {
      // Rank states purely by the user's symptom contribution.
      let best: PolarityState = 'balanced'
      let bestScore = 0
      for (const st of SYM_STATES) {
        if (symptomContribution[st] > bestScore) { best = st; bestScore = symptomContribution[st] }
      }
      if (bestScore > 0) {
        // Tie ONLY between states the symptoms already support → chart breaks it.
        const tied = SYM_STATES.filter((st) => symptomContribution[st] === bestScore)
        if (tied.length > 1) {
          tied.sort((a, b) => chartBias[b] - chartBias[a])
          best = tied[0]
          reasoning.push(`symptom tie (${tied.join('/')}) → chart-bias tiebreak → ${best}`)
        }
        dominant = best
      } else {
        // No symptom signal → no correction. Chart alone NEVER creates a state.
        dominant = 'balanced'
        reasoning.push(`no symptom signal for ${planet} → balanced (chart structure never flips state)`)
      }
    }

    // A non-balanced state now always traces to the user's symptoms (or override).
    const symptomDriven = overridden || dominant !== 'balanced'

    // ── Confidence: symptom weight, lifted only when the chart AGREES ──
    // Chart agreement strengthens confidence; chart disagreement is ignored.
    let confidence: number
    if (overridden) {
      confidence = Math.max(symptomContribution[dominant] + chartBias[dominant], 6)
    } else if (dominant === 'balanced') {
      confidence = 0
    } else {
      const agree = Math.min(chartBias[dominant], 3) // cap the chart's confidence lift
      confidence = symptomContribution[dominant] + agree
      if (agree > 0) reasoning.push(`chart agrees with ${dominant} → +${agree} confidence`)
    }

    // Combined scores for practitioner introspection (symptom + chart bias).
    const scores = emptyScores()
    for (const st of ['excess', 'deficiency', 'blocked', 'balanced'] as PolarityState[]) {
      scores[st] = symptomContribution[st] + chartBias[st]
    }

    // Secondary = next-strongest SYMPTOM state (honest about the user's signal).
    let secondary: PolarityState | undefined
    let secondaryScore = -1
    for (const st of SYM_STATES) {
      if (st !== dominant && symptomContribution[st] > secondaryScore && symptomContribution[st] > 0) {
        secondary = st
        secondaryScore = symptomContribution[st]
      }
    }

    const protocol = buildCorrectiveProtocol(planet, dominant)

    // Borrow from resourced planets (I.1) THEN intention-support planets (Fix 4):
    // if a regulator candidate is one the user marked strong, or one that delivers
    // their stated intention, draw from it first. We only reorder within the
    // authored regulator list — never invent a non-corrective regulator. The
    // priority is resourced → intention → remaining (authored order). Deterministic.
    if ((resourcedSet.size || intentionSet.size) && protocol.regulator_planets.length) {
      const regs = protocol.regulator_planets
      const isResourced = (r: string) => resourcedSet.has(r.toLowerCase())
      const isIntention = (r: string) => intentionSet.has(r.toLowerCase())
      const tierResourced = regs.filter((r) => isResourced(r))
      const tierIntention = regs.filter((r) => !isResourced(r) && isIntention(r))
      const tierRest      = regs.filter((r) => !isResourced(r) && !isIntention(r))
      if (tierResourced.length || tierIntention.length) {
        protocol.regulator_planets = [...tierResourced, ...tierIntention, ...tierRest]
        if (tierResourced.length) reasoning.push(`drawing from resourced ${tierResourced.join('/')} as regulator`)
        if (tierIntention.length) reasoning.push(`intention favors ${tierIntention.join('/')} as corrective support`)
      }
    }

    results.push({
      planet,
      dominant_state: dominant,
      secondary_state: secondary,
      confidence,
      confidence_band: bandFor(confidence),
      scores,
      reasoning,
      overridden,
      resourced: isResourced,
      symptomDriven,
      protocol,
    })

    void goals  // Intention now drives SUPPORT via intentionSupportPlanets (Fix 4);
                // goals string list retained for future goal-driven state biasing.
  }

  // Sort by confidence desc — most-confident planet first
  results.sort((a, b) => b.confidence - a.confidence)
  return results
}

// ─── PUBLIC HELPERS ─────────────────────────────────────────────────

/**
 * Get the corrective protocol for an arbitrary (planet, state) pair.
 * Used when downstream engines need a direct lookup without running the full
 * detection logic (e.g. practitioner manually selects state).
 */
export function getCorrectiveProtocol(planet: string, state: PolarityState): CorrectiveProtocol {
  return buildCorrectiveProtocol(planet, state)
}

/**
 * Convenience — given a polarity result, return whether downstream engines
 * should apply full polarity correction or only light balancing.
 */
export function shouldFullyCorrect(result: PolarityResult): boolean {
  if (result.overridden) return true
  return result.confidence_band !== 'weak' && result.dominant_state !== 'balanced'
}

/**
 * Resolve the single highest-priority polarity result for an entire reading.
 * Used by simple consumers that only want ONE corrective direction.
 */
export function dominantPolarity(results: PolarityResult[]): PolarityResult | null {
  return results.length > 0 ? results[0] : null
}
