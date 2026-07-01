/**
 * ASTRYX — Sacred Tea Matching Engine (Phase 2)
 *
 * Matches a completed Resonance Chamber protocol to the best EXISTING Sacred Tea
 * blend, and provides a general "create-your-own" herbal direction. This is an
 * OPTIONAL convenience/support layer — it never replaces the existing remedy
 * logic and never shows an unavailable product.
 *
 * Layering (in order):
 *   1. Planetary rule (planet × signal-state → primary/secondary)
 *   2. Body-system boosts (soft nudges)
 *   3. Post-session outtake modifiers (prefer / avoid-as-primary)
 *   4. Sensitivity guards (Phoenix + Egyptian Blue Lotus held back when unsafe)
 *
 * Sacred Tea is always presented FIRST (Best Prepared Match). DIY is second.
 */

import { toDisplayState } from '@/lib/signalCopy'
import type { SessionSummarySnapshot, PostSessionAnswers } from '@/types'
import {
  SACRED_TEA_BLEND_PROFILES, SACRED_TEA_INVENTORY, type SacredTeaBlend,
} from './sacredTeaBlendProfiles'
import {
  SACRED_TEA_PLANET_RULES, type TeaDisplayState,
} from './sacredTeaPlanetRules'
import { SACRED_TEA_BODY_SYSTEM_MODIFIERS } from './sacredTeaBodySystemModifiers'
import { SACRED_TEA_POST_SESSION_MODIFIERS } from './sacredTeaPostSessionModifiers'
import {
  DIY_PLANETARY_HERB_DIRECTIONS, DIY_FALLBACK_DIRECTION, type DIYHerbDirection,
} from './diyPlanetaryHerbDirections'

export type MatchLevel = 'Exact Match' | 'Strong Match' | 'Partial Match' | 'No Current Match'

const SAFETY_NOTE = 'Traditional botanical support only. Not medical advice.'

// ─── ENGINE I/O ──────────────────────────────────────────────
export interface SacredTeaInput {
  planet: string
  sign?: string
  house?: number
  signalState: string                 // display word, e.g. "Electrified"
  signalStateRaw?: string             // excess | deficiency | blocked | balanced
  correctiveDirection?: string[] | string
  bodySystem?: string[]
  chakraOverlay?: string
  postSessionAnswers?: string[]       // flattened outtake tokens (lowercased ok)
  tasteProtocol?: { tea?: string; ingredients?: string[] }
  herbRecommendations?: string[]
  contraindicationFlags?: string[]
  isPractitioner?: boolean
}

export interface SacredTeaResult {
  preparedMatch: {
    recommendedBlend: SacredTeaBlend
    matchLevel: MatchLevel
    why: string
    usageTiming: string
    sessionInstruction: string
  }
  diyHerbalDirection: {
    planetaryHerbCategory: string
    suggestedHerbs: string[]
    tasteProfile: string
    preparationStyle: string
    cautionNote: string
  }
  fallbackBlend: SacredTeaBlend
  /** Internal only — never shown to individual users. */
  futureBlendGap: string | null
  safetyNote: string
}

const UNIVERSAL_FALLBACK: SacredTeaBlend = 'The Wise Elder'

// ─── helpers ─────────────────────────────────────────────────
function teaState(raw?: string): TeaDisplayState {
  // toDisplayState → 'elevated' | 'depleted' | 'blocked' | 'balanced'
  return toDisplayState(raw) as TeaDisplayState
}

function correctiveBlob(c?: string[] | string): string {
  if (!c) return ''
  return (Array.isArray(c) ? c.join(' ') : c).toLowerCase()
}

function clearingIndicated(planet: string, state: TeaDisplayState, bodyBlob: string, corrective: string): boolean {
  if (/digest|gut|abdomen|intestine|elimination|pelvis|root|liver/.test(bodyBlob)) return true
  if (/release|clear|eliminat|reset|drain|let go/.test(corrective)) return true
  // Jupiter/Pluto elevated ARE the deep-clearing signatures.
  if (state === 'elevated' && (planet === 'Jupiter' || planet === 'Pluto')) return true
  return false
}

function resolveDIY(planet: string, state: TeaDisplayState): DIYHerbDirection {
  const byPlanet = DIY_PLANETARY_HERB_DIRECTIONS[planet]
  if (!byPlanet) return DIY_FALLBACK_DIRECTION
  return (
    byPlanet[state] ??
    byPlanet.depleted ??
    byPlanet.elevated ??
    byPlanet.blocked ??
    byPlanet.balanced ??
    DIY_FALLBACK_DIRECTION
  )
}

function gapFor(planet: string, state: TeaDisplayState, bodyBlob: string, tokens: string[]): string | null {
  const t = tokens.join(' ')
  if (state === 'elevated' && (planet === 'Mercury' || planet === 'Uranus')) return 'Cooling Nervous System Support'
  if (/nervous|breath|racing|restless|activated/.test(bodyBlob + ' ' + t)) return 'Cooling Nervous System Support'
  if ((planet === 'Saturn' || planet === 'Pluto') && (state === 'blocked' || state === 'elevated')) return 'Grounding Integration Support'
  if (planet === 'Sun' && state === 'depleted') return 'Solar Vitality Support'
  if (/emotional/.test(t) || planet === 'Venus' || planet === 'Moon') return 'Deep Emotional Softening Support'
  return null
}

// ─── Fix 10 — PROTOCOL-INTENT ↔ BLEND-CHARACTER COHERENCE ────
// A sedating / dream-state blend must never be the PRIMARY for an ACTIVATING
// protocol (restore vitality / warm / brighten), and a deep-clearing / stimulating
// blend must never be the primary for a CALM / GROUND protocol. This also finally
// enforces each blend's authored `avoidPrimaryFor` list (defined but, until now,
// never applied). On contradiction the matcher falls back to the safe universal
// blend (The Wise Elder, never vetoed).
const SEDATING_DREAMY: SacredTeaBlend[] = [
  'Egyptian Blue Lotus Flowers', 'Blue Lotus Magic', 'Blue Lotus Flowers', 'White Lotus Flowers',
]
const DEEP_CLEARING: SacredTeaBlend[] = ['The Phoenix — Sacred Gut Reset']

export type ProtocolIntent = 'activating' | 'calming' | 'clearing' | 'neutral'

export function teaProtocolIntent(corrective: string, state: TeaDisplayState): ProtocolIntent {
  if (/warm|activate|stimulate|uplift|brighten|restore|vitalit|energi|build|nourish|expand|rouse/.test(corrective)) return 'activating'
  if (/release|clear|eliminat|drain|reset|detox|let go/.test(corrective)) return 'clearing'
  if (/cool|calm|ground|settle|soften|contain|slow|regulate|stabili|quiet|sedate/.test(corrective)) return 'calming'
  // No directional words → infer from the engine state.
  if (state === 'depleted') return 'activating'
  if (state === 'elevated') return 'calming'
  return 'neutral'
}

/** Blends that must NOT be the primary recommendation, given the protocol's
 *  corrective intent + the session signals. (Directive Fix 10.) */
export function validateTeaAgainstProtocolIntent(
  corrective: string, tokens: string[], state: TeaDisplayState,
): Set<SacredTeaBlend> {
  const veto = new Set<SacredTeaBlend>()
  const intent = teaProtocolIntent(corrective.toLowerCase(), state)
  if (intent === 'activating') SEDATING_DREAMY.forEach((b) => veto.add(b))
  if (intent === 'calming')    DEEP_CLEARING.forEach((b) => veto.add(b))
  // Enforce each blend's authored avoidPrimaryFor against the session signals.
  const blob = `${tokens.join(' ')} ${corrective} ${state}`.toLowerCase()
  for (const b of SACRED_TEA_INVENTORY) {
    const avoid = SACRED_TEA_BLEND_PROFILES[b].avoidPrimaryFor ?? []
    if (avoid.some((a) => blob.includes(a.toLowerCase()))) veto.add(b)
  }
  return veto
}

// ─── CORE MATCHER ────────────────────────────────────────────
export function matchSacredTea(input: SacredTeaInput): SacredTeaResult {
  const planet = input.planet
  const state = teaState(input.signalStateRaw)
  const tokens = (input.postSessionAnswers ?? []).map((s) => s.toLowerCase())
  const bodyBlob = (input.bodySystem ?? []).join(' ').toLowerCase()
  const corrective = correctiveBlob(input.correctiveDirection)

  // The planetary rule is the seed. Unknown planets → safe universal fallback.
  const rule = SACRED_TEA_PLANET_RULES[planet]?.[state]
  const rulePrimary = rule?.primary
  const ruleSecondary = rule?.secondary

  // Scores keyed by blend.
  const scores = new Map<SacredTeaBlend, number>()
  const add = (b: SacredTeaBlend | undefined, n: number) => {
    if (!b) return
    scores.set(b, (scores.get(b) ?? 0) + n)
  }

  // 1. Planetary rule
  add(rulePrimary, 5)
  add(ruleSecondary, 3)

  // The universal fallback always has a tiny baseline so we never dead-end.
  add(UNIVERSAL_FALLBACK, 0.5)

  // 2. Body-system boosts
  const bodyBoosted = new Set<SacredTeaBlend>()
  for (const mod of SACRED_TEA_BODY_SYSTEM_MODIFIERS) {
    if (mod.match.some((m) => bodyBlob.includes(m))) {
      for (const b of mod.boost) { add(b, 2); bodyBoosted.add(b) }
    }
  }

  // 3. Post-session outtake modifiers (prefer + avoid-as-primary)
  const vetoedPrimary = new Set<SacredTeaBlend>()
  for (const mod of SACRED_TEA_POST_SESSION_MODIFIERS) {
    if (tokens.some((tok) => tok.includes(mod.token))) {
      for (const b of mod.prefer) add(b, 3)
      for (const b of mod.avoidPrimary) vetoedPrimary.add(b)
    }
  }

  // 4. Sensitivity guards
  // Phoenix: only as primary when clearing is indicated AND the user isn't
  // sensitive/over-activated/depleted (acceptance rule 10).
  const sensitive =
    state === 'depleted' ||
    tokens.some((t) => /too intense|still activated|still racing|restless/.test(t))
  if (!clearingIndicated(planet, state, bodyBlob, corrective) || sensitive) {
    vetoedPrimary.add('The Phoenix — Sacred Gut Reset')
  }
  // Egyptian Blue Lotus is also handled by post-session tokens, but guard the
  // depleted case here too (never a primary when the body is low).
  if (state === 'depleted') vetoedPrimary.add('Egyptian Blue Lotus Flowers')

  // Fix 10 — protocol-intent ↔ blend-character coherence + authored avoidPrimaryFor.
  for (const b of Array.from(validateTeaAgainstProtocolIntent(corrective, tokens, state))) vetoedPrimary.add(b)

  // Contraindication flags can veto a blend outright (defensive; usually empty).
  for (const flag of input.contraindicationFlags ?? []) {
    const hit = SACRED_TEA_INVENTORY.find((b) => b.toLowerCase() === flag.toLowerCase())
    if (hit) { scores.delete(hit); vetoedPrimary.add(hit) }
  }

  // Rank and choose the primary (highest score not vetoed-as-primary).
  const ranked = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]).map(([b]) => b)
  const chosen = ranked.find((b) => !vetoedPrimary.has(b)) ?? UNIVERSAL_FALLBACK
  const runnerUp = ranked.find((b) => b !== chosen && !vetoedPrimary.has(b)) ?? UNIVERSAL_FALLBACK

  // Match level
  let matchLevel: MatchLevel
  const fromRule = chosen === rulePrimary || chosen === ruleSecondary
  if (chosen === rulePrimary) {
    matchLevel = bodyBoosted.has(chosen) && tokens.length === 0 ? 'Exact Match' : 'Strong Match'
  } else if (chosen === ruleSecondary) {
    matchLevel = 'Strong Match'
  } else if (scores.get(chosen)! > 0.5) {
    // chosen carries a real boost (prefer/body) but isn't the rule blend
    matchLevel = 'Partial Match'
  } else {
    // chosen is only the baseline universal fallback
    matchLevel = 'Partial Match'
  }

  const profile = SACRED_TEA_BLEND_PROFILES[chosen]
  const why = `${chosen} is the best prepared match for today’s ${planet} ${input.signalState} protocol because it supports ${profile.lane}.`

  // Each blend carries its own continuation instruction (e.g. Red Lotus already
  // says "Use gently. Do not stack intense protocols back-to-back."). The
  // sensitivity guard above governs WHICH blend is chosen, not this copy.
  const sessionInstruction = profile.sessionInstruction

  // DIY direction (second layer)
  const diy = resolveDIY(planet, state)

  // Future blend gap — recorded internally when the match isn't strong.
  const futureBlendGap = matchLevel === 'Partial Match'
    ? gapFor(planet, state, bodyBlob, tokens)
    : null

  return {
    preparedMatch: {
      recommendedBlend: chosen,
      matchLevel,
      why,
      usageTiming: profile.usageTiming,
      sessionInstruction,
    },
    diyHerbalDirection: {
      planetaryHerbCategory: diy.planetaryHerbCategory,
      suggestedHerbs: diy.suggestedHerbs,
      tasteProfile: diy.tasteProfile,
      preparationStyle: diy.preparationStyle,
      cautionNote: diy.cautionNote,
    },
    fallbackBlend: fromRule ? runnerUp : UNIVERSAL_FALLBACK,
    futureBlendGap,
    safetyNote: SAFETY_NOTE,
  }
}

// ─── POST-SESSION WRAPPER ────────────────────────────────────
/**
 * Adapter: builds the engine input from a completed-session snapshot + the
 * user's outtake answers, then runs the matcher. This is what the post-session
 * page calls.
 */
export function matchSacredTeaForPostSession(
  snapshot: SessionSummarySnapshot,
  answers: PostSessionAnswers,
): SacredTeaResult {
  const tokens = [
    answers.chamberSupport,
    ...(answers.feeling ?? []),
    ...(answers.bodyState ?? []),
    ...(answers.mentalState ?? []),
  ].filter(Boolean) as string[]

  return matchSacredTea({
    planet: snapshot.planetaryCarrier,
    signalState: snapshot.signalState,
    signalStateRaw: snapshot.signalStateRaw,
    correctiveDirection: snapshot.correctiveDirection,
    bodySystem: [snapshot.primaryBodyPlacement, ...snapshot.bodyPlacements],
    chakraOverlay: snapshot.chakraOverlay,
    postSessionAnswers: tokens,
    tasteProtocol: { tea: snapshot.tasteTea, ingredients: snapshot.tasteIngredients },
    herbRecommendations: snapshot.tasteIngredients,
    isPractitioner: snapshot.isPractitioner,
  })
}
