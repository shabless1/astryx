/**
 * ASTRYX — Marma layer (Ayurvedic point placement for the Sacred Tones forks)
 * ════════════════════════════════════════════════════════════════════════════
 * SHA approved the Marma × Sacred Tones map (proposal v2, 2026-09-10).
 *
 * Astryx already knows WHICH fork and WHICH body zone. This layer names the
 * exact doorway inside that zone — a marma point from Lad & Durve's set, with
 * its own anatomy, dosha and rules of touch.
 *
 * Two rulings shaped it:
 *   1. The SACRAL centre is the SACRUM (posterior at Kati / lower lumbar at
 *      Kukundara, or anteriorly below the navel at Basti). NOT the navel.
 *      The source's own chakra table names Nabhi there; Astryx departs from it
 *      on that one point and says so in the data. Nabhi keeps its real job as
 *      the central pole between crown and sole.
 *   2. The REPRODUCTIVE / PELVIC-FLOOR zone is a SIX-INCH FIELD SWEEP for every
 *      fork, every chart and every person. This is a ZONE rule that sits
 *      underneath the fork logic, so no planet, no symptom match and no future
 *      placement can route around it (the old rule keyed off Pluto alone,
 *      which a Scorpio natal placement or a pelvic symptom could walk past).
 *
 * SAFETY MONOTONICITY — the single invariant this module guarantees:
 *   resolveApplication() only ever TIGHTENS. weighted → field → fieldOnly.
 *   Every input (the point's own class, the zone rule, the fork's delivery
 *   mode, the excess state, pregnancy) can raise the strictness and none can
 *   lower it. Tested in tests/marma.test.ts.
 *
 * Deterministic: pure lookup over marmaPoints.json + marmaFork.json.
 * No Math.random, no Date.now.
 *
 * Compliance: marma is "traditionally associated with"; the fork "is placed at"
 * or "is held over". Never that anything treats anything. Every point renders
 * its own safety note. Lad & Durve cited by page on every point.
 */

import pointsData from '@/data/marmaPoints.json'
import forkData from '@/data/marmaFork.json'
import type { BodyView } from '@/lib/bodyMapPlacement'

// ─── SHAPES ────────────────────────────────────────────────────────────────

/** How the fork may meet the point. Ordered — index is the strictness rank. */
export const APPLICATION_RANK = ['weighted', 'field', 'fieldOnly'] as const
export type MarmaApplication = (typeof APPLICATION_RANK)[number]

export type MarmaRole = 'primary' | 'secondary' | 'chakra' | 'counterweight'
export type MarmaBasis = 'bone-point' | 'chakra' | 'dosha' | 'grounding'

interface RawPoint {
  id: string
  sanskrit: string
  alsoKnownAs?: string
  english: string
  region: string
  side: string
  view: string
  plainLocation: string
  location: string
  applicationType: string
  fieldDistanceInches: number | null
  chakra: string | null
  chakraFace?: string
  element: string
  doshicSubtypes: string[]
  vitalityClass: string
  vitalityLabel: string
  anatomicalRelation: string
  traditionallyAssociatedWith: string[]
  name_note?: string
  safetyNote: string
  contraindications: string[]
  anchor: { x: number; y: number; xLeft?: number; xRight?: number }
  sourcePage: string
}

/** One resolved point, ready to render. */
export interface MarmaPlacement {
  id: string
  role: MarmaRole
  basis: MarmaBasis
  /** Why THIS point for THIS fork. */
  why: string

  sanskrit: string
  alsoKnownAs?: string
  english: string
  /** Individual tier — plain language. */
  plainLocation: string
  /** Practitioner tier — the precise classical location. */
  location: string
  region: string
  side: string
  view: BodyView

  /** Resolved after every tightening rule. Never looser than the point's own class. */
  application: MarmaApplication
  /** Inches off the body. null when the stem may rest on the point. */
  fieldDistanceInches: number | null
  /** Present when a rule tightened the point's own class — say so in the UI. */
  applicationReason: string | null

  /** One line of instruction for this point, at this application, in this state. */
  instruction: string

  chakra: string | null
  anchor: { x: number; y: number }
  anchorLeft: { x: number; y: number } | null
  anchorRight: { x: number; y: number } | null

  safetyNote: string
  contraindications: string[]

  // ── practitioner tier only (contained in sacredShape.ts) ──
  element: string
  doshicSubtypes: string[]
  vitalityClass: string
  vitalityLabel: string
  anatomicalRelation: string
  traditionallyAssociatedWith: string[]
  nameNote: string | null
  sourcePage: string
}

export interface MarmaMethod {
  label: string
  direction: string
  forkChoice: string
  instruction: string
  neverAmplify: boolean
}

export interface MarmaLayer {
  planet: string
  dosha: string
  doshaNote: string
  points: MarmaPlacement[]
  method: MarmaMethod
  /** The "shalaka that sings" line — practitioner surface + guide. */
  bridge: { headline: string; body: string; dwell: string; shalakaMetals: string }
  alternates: { id: string; sanskrit: string; basis: MarmaBasis; why: string; application: MarmaApplication }[]
  citation: string
}

// ─── DATA INDEXES (built once, module scope — deterministic) ───────────────

const POINTS: Record<string, RawPoint> = Object.fromEntries(
  (pointsData.points as RawPoint[]).map((p) => [p.id, p]),
)

type RawRef = { marma: string; basis: string; why: string }
interface RawFork {
  planet: string
  hz: string
  dosha: string
  doshaNote: string
  primary: RawRef
  secondary: RawRef | null
  chakraDoorway: RawRef | null
  counterweight: RawRef | null
  alternates: RawRef[]
}
const FORKS: Record<string, RawFork> = Object.fromEntries(
  (forkData.forks as RawFork[]).map((f) => [f.planet, f]),
)

const STATE_METHOD = forkData.stateMethod as Record<string, MarmaMethod & { delivery: string }>
const BRIDGE = forkData.methodBridge
const CHAKRA_DOORWAYS = forkData.chakraDoorways as {
  chakra: string; solfeggioHz: number; marma: string; alternates: string[]; note: string
}[]

export const MARMA_CITATION =
  'Vasant Lad and Anisha Durve, Marma Points of Ayurveda, The Ayurvedic Press.'

// ─── THE ZONE RULE (SHA ruling · six-inch field, no exceptions) ────────────

/**
 * Regions that are NEVER contacted, by any fork, for any chart, for any person.
 * This is deliberately a REGION set, not a planet set — a symptom match or a
 * natal placement must not be able to route a different fork into this zone
 * with contact. Keep in step with INTIMATE_REGIONS in BodyPlacementEngine.
 *
 * SHA, 2026-09-11 — NAME THE POINT, NOT THE REGION. An earlier pass generalised
 * her ruling from "reproductive placements" to the whole pelvis, which is wrong:
 * the pelvis is a skeletal region and most of it is ordinary bodywork territory.
 * No region is withheld. What is withheld is specific: **the reproductive region
 * and the coccyx are swept, never touched.**
 *
 * Those two points already carry `fieldOnly` on themselves — Basti on the
 * midline below the navel, and Trik at the tail bone — so the rule lives on the
 * point where it belongs and travels with it. The POSTERIOR SACRUM (Kati,
 * Kukundara) is bone, worked prone and clothed, inside every bodywork scope of
 * practice, and stays weighted contact.
 */
export const FIELD_ONLY_POINTS: ReadonlySet<string> = new Set(['basti', 'trik'])

/** Pregnancy widens the field zone upward over the abdomen and sacrum. */
export const PREGNANCY_WIDEN_REGIONS: ReadonlySet<string> = new Set(['pelvis', 'sacrum', 'trunk'])

/** Inches off the body for each application class. */
const DISTANCE: Record<MarmaApplication, number | null> = {
  weighted: null,
  field: 4,
  fieldOnly: 6,
}

function rank(a: MarmaApplication): number {
  return APPLICATION_RANK.indexOf(a)
}

/** Strictest of two. Never loosens. */
function tighten(a: MarmaApplication, b: MarmaApplication): MarmaApplication {
  return rank(b) > rank(a) ? b : a
}

export interface ApplicationContext {
  /** The fork's delivery mode from BodyPlacementEngine ('sweep' = off-body). */
  forkDelivery?: 'contact' | 'sweep'
  /** excess | deficiency | blocked | balanced */
  engineState?: string
  /** Not collected at intake today; wired for when it is. */
  pregnancyWiden?: boolean
}

/**
 * Resolve how the fork may meet this point.
 *
 * MONOTONE BY CONSTRUCTION: starts at the point's own class and only ever
 * tightens. Returns the reason whenever a rule raised the strictness, so the
 * UI can say WHY rather than silently moving the fork off the body.
 */
export function resolveApplication(
  point: Pick<RawPoint, 'applicationType' | 'region' | 'id'>,
  ctx: ApplicationContext = {},
): { application: MarmaApplication; reason: string | null } {
  const own = (APPLICATION_RANK as readonly string[]).includes(point.applicationType)
    ? (point.applicationType as MarmaApplication)
    : 'field' // unknown class fails SAFE, never to weighted
  let app: MarmaApplication = own
  let reason: string | null = null

  const raise = (to: MarmaApplication, why: string) => {
    const next = tighten(app, to)
    if (rank(next) > rank(app)) reason = why
    app = next
  }

  // 1. The point rule. Highest authority, applies to every fork and every person.
  //    Named points, not a whole region — the reproductive region and the coccyx.
  if (FIELD_ONLY_POINTS.has(point.id)) {
    raise('fieldOnly', 'This point is swept, never touched — it sits in the reproductive region or at the coccyx.')
  }
  // 2. The fork's own delivery mode (Pluto is unconditionally off-body).
  if (ctx.forkDelivery === 'sweep') {
    raise('fieldOnly', 'This fork is carried off the body, so the point is addressed from the field.')
  }
  // 3. Pregnancy widens the field zone upward over the abdomen and sacrum.
  if (ctx.pregnancyWiden && PREGNANCY_WIDEN_REGIONS.has(point.region)) {
    raise('fieldOnly', 'In pregnancy the field zone widens upward over the abdomen and sacrum.')
  }
  // 4. Never-amplify: an amplified signal is regulated from the field, not pressed.
  if (ctx.engineState === 'excess') {
    raise('field', 'The signal reads amplified, so it is regulated from the field rather than pressed.')
  }

  return { application: app, reason }
}

// ─── INSTRUCTION COPY ──────────────────────────────────────────────────────

function instructionFor(
  app: MarmaApplication,
  point: RawPoint,
  method: MarmaMethod & { delivery: string },
): string {
  const where = point.plainLocation.replace(/\.$/, '').toLowerCase()
  const turn =
    method.direction === 'clockwise' ? ' Work it clockwise.'
    : method.direction === 'counterclockwise' ? ' Work it counterclockwise.'
    : method.direction === 'linear' ? ' Move in a line toward the next point.'
    : ''
  switch (app) {
    case 'weighted':
      return `Strike, then rest the stem at ${where} with steady, comfortable contact for one to two minutes.${turn}`
    case 'field':
      return `Strike and hold the fork about four inches off ${where}. Light contact at most, never deep pressure.${turn}`
    case 'fieldOnly':
      return `Strike and hold the fork six inches above ${where}, sweeping slowly. No contact at any pressure.`
  }
}

// ─── RESOLUTION ────────────────────────────────────────────────────────────

function toView(v: string): BodyView {
  return v === 'posterior' ? 'posterior' : 'anterior'
}

function buildPlacement(
  ref: RawRef,
  role: MarmaRole,
  ctx: ApplicationContext,
  method: MarmaMethod & { delivery: string },
): MarmaPlacement | null {
  const p = POINTS[ref.marma]
  if (!p) return null
  const { application, reason } = resolveApplication(p, ctx)
  return {
    id: p.id,
    role,
    basis: ref.basis as MarmaBasis,
    why: ref.why,
    sanskrit: p.sanskrit,
    alsoKnownAs: p.alsoKnownAs,
    english: p.english,
    plainLocation: p.plainLocation,
    location: p.location,
    region: p.region,
    side: p.side,
    view: toView(p.view),
    application,
    fieldDistanceInches: DISTANCE[application],
    applicationReason: reason,
    instruction: instructionFor(application, p, method),
    chakra: p.chakra,
    anchor: { x: p.anchor.x, y: p.anchor.y },
    anchorLeft: p.anchor.xLeft != null ? { x: p.anchor.xLeft, y: p.anchor.y } : null,
    anchorRight: p.anchor.xRight != null ? { x: p.anchor.xRight, y: p.anchor.y } : null,
    safetyNote: p.safetyNote,
    contraindications: p.contraindications,
    element: p.element,
    doshicSubtypes: p.doshicSubtypes,
    vitalityClass: p.vitalityClass,
    vitalityLabel: p.vitalityLabel,
    anatomicalRelation: p.anatomicalRelation,
    traditionallyAssociatedWith: p.traditionallyAssociatedWith,
    nameNote: p.name_note ?? null,
    sourcePage: p.sourcePage,
  }
}

export interface ResolveMarmaInput {
  /** Fork planet name as it appears in sacredTones_nervousSystem.json. */
  planet: string
  engineState?: string
  /** The delivery mode BodyPlacementEngine already resolved for this fork. */
  forkDelivery?: 'contact' | 'sweep'
  /** In a CHAKRA session, the centre being worked — its doorway leads. */
  chakraCenter?: string
  pregnancyWiden?: boolean
}

/**
 * The marma layer for one fork. Returns null for a planet with no mapping,
 * so every existing placement keeps working untouched when the layer is off.
 */
export function resolveMarmaLayer(input: ResolveMarmaInput): MarmaLayer | null {
  const fork = FORKS[input.planet]
  if (!fork) return null

  const stateKey = ['excess', 'deficiency', 'blocked'].includes(input.engineState ?? '')
    ? (input.engineState as string)
    : 'balanced'
  const method = STATE_METHOD[stateKey]

  const ctx: ApplicationContext = {
    forkDelivery: input.forkDelivery,
    engineState: input.engineState,
    pregnancyWiden: input.pregnancyWiden,
  }

  const points: MarmaPlacement[] = []
  const seen = new Set<string>()
  const push = (ref: RawRef | null, role: MarmaRole) => {
    if (!ref) return
    if (seen.has(ref.marma)) return // Venus/Neptune can share a doorway — one card, not two
    const built = buildPlacement(ref, role, ctx, method)
    if (built) { points.push(built); seen.add(ref.marma) }
  }

  // In a chakra session the CENTRE's doorway leads; otherwise the fork's own
  // bone point leads. Either way the rest follow in order.
  if (input.chakraCenter) {
    const door = CHAKRA_DOORWAYS.find((d) => d.chakra === input.chakraCenter)
    if (door) {
      push({ marma: door.marma, basis: 'chakra', why: door.note }, 'chakra')
      for (const alt of door.alternates) {
        const ap = POINTS[alt]
        if (ap) push({ marma: alt, basis: 'chakra', why: `An accepted alternate face of the ${door.chakra} centre.` }, 'secondary')
      }
    }
  }

  push(fork.primary, 'primary')
  push(fork.secondary, 'secondary')
  push(fork.chakraDoorway, 'chakra')
  push(fork.counterweight, 'counterweight')

  const alternates = fork.alternates
    .map((a) => {
      const p = POINTS[a.marma]
      if (!p) return null
      return {
        id: p.id,
        sanskrit: p.sanskrit,
        basis: a.basis as MarmaBasis,
        why: a.why,
        application: resolveApplication(p, ctx).application,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  return {
    planet: fork.planet,
    dosha: fork.dosha,
    doshaNote: fork.doshaNote,
    points,
    method: {
      label: method.label,
      direction: method.direction,
      forkChoice: method.forkChoice,
      instruction: method.instruction,
      neverAmplify: method.neverAmplify,
    },
    bridge: {
      headline: BRIDGE.headline,
      body: BRIDGE.body,
      dwell: BRIDGE.dwell,
      shalakaMetals: BRIDGE.shalakaMetals,
    },
    alternates,
    citation: MARMA_CITATION,
  }
}

/** The named doorway for a chakra centre (chakra session mode). */
export function marmaDoorwayFor(chakraCenter: string): MarmaPlacement | null {
  const door = CHAKRA_DOORWAYS.find((d) => d.chakra === chakraCenter)
  if (!door) return null
  return buildPlacement(
    { marma: door.marma, basis: 'chakra', why: door.note },
    'chakra',
    {},
    STATE_METHOD.balanced,
  )
}

/**
 * The marma layer for a CHAKRA CENTRE (chakra session mode) — the centre's named
 * doorway plus its accepted alternate faces. Sacral resolves to Kati on the
 * sacrum, with Kukundara at the lower lumbar and Basti below the navel as its
 * alternates (SHA ruling 2026-09-10). Returns null for an unknown centre.
 */
export function marmaDoorwayLayer(chakraCenter: string): MarmaLayer | null {
  const door = CHAKRA_DOORWAYS.find((d) => d.chakra === chakraCenter)
  if (!door) return null
  const method = STATE_METHOD.balanced
  const points: MarmaPlacement[] = []
  const main = buildPlacement({ marma: door.marma, basis: 'chakra', why: door.note }, 'chakra', {}, method)
  if (main) points.push(main)
  for (const alt of door.alternates) {
    const p = buildPlacement(
      { marma: alt, basis: 'chakra', why: `An accepted alternate face of the ${door.chakra} centre.` },
      'secondary', {}, method,
    )
    if (p) points.push(p)
  }
  if (!points.length) return null
  return {
    planet: door.chakra,
    dosha: 'centre',
    doshaNote: `The ${door.chakra} centre. The same doorway for every fork and every body.`,
    points,
    method: {
      label: method.label, direction: method.direction, forkChoice: method.forkChoice,
      instruction: method.instruction, neverAmplify: method.neverAmplify,
    },
    bridge: { headline: BRIDGE.headline, body: BRIDGE.body, dwell: BRIDGE.dwell, shalakaMetals: BRIDGE.shalakaMetals },
    alternates: [],
    citation: MARMA_CITATION,
  }
}

/** Every point in the set, for the body map and the guide. */
export function allMarmaPoints(): MarmaPlacement[] {
  return (pointsData.points as RawPoint[])
    .map((p) => buildPlacement({ marma: p.id, basis: 'bone-point', why: '' }, 'primary', {}, STATE_METHOD.balanced))
    .filter((x): x is MarmaPlacement => x !== null)
}

/** One point by id, resolved with no fork context. Used by the Marma session builder. */
export function marmaPointById(id: string): MarmaPlacement | null {
  if (!POINTS[id]) return null
  return buildPlacement({ marma: id, basis: 'bone-point', why: '' }, 'primary', {}, STATE_METHOD.balanced)
}

/** The primary marma id for a fork, or null when the planet has no mapping. */
export function primaryMarmaIdFor(planet: string): string | null {
  return FORKS[planet]?.primary?.marma ?? null
}

/** Short label for a placement, e.g. "Kati · the sacral plate". */
export function marmaLabel(m: MarmaPlacement): string {
  return `${m.sanskrit} · ${m.plainLocation.replace(/\.$/, '').toLowerCase()}`
}
