/**
 * ASTRYX — Reflex Engine  (Directive S · S1.2)
 * ════════════════════════════════════════════════════════════════════════════
 * The medical-astrology REFLEX principle (the tradition's Hill Code pt.5): an
 * afflicted SIGN/zone mirrors to its OPPOSITE (180°) and is stressed by its two
 * SQUARES (90°). The reflex zones are where a complaint ALSO eases — so a
 * calibration works the LOCAL zone (comfort) AND the REFLEX + planetary-anatomy
 * zones (the root).
 *
 *   Knees / Capricorn → opposite CANCER (stomach/chest) · squares ARIES (head)
 *   + LIBRA (kidneys/lumbar). The Saturn action's own anatomy = bones/knees/spine.
 *
 * Deterministic — same (sign, planet, state) → identical zones. No Math.random.
 * Region/anatomy data is reused from BodyPlacementEngine (single source of truth);
 * the womb/sacral floor is enforced via anchorForRegion. This module computes the
 * STRUCTURE; the body map renders it and Astryx explains it.
 */

import {
  signBodyRulershipLibrary, planetBodyRulershipLibrary, anchorForRegion,
} from '@/lib/BodyPlacementEngine'
import signPolaritiesData from '@/data/signPolarities.json'

// Zodiac order — opposite = +6, squares = +3 / +9 (mod 12).
const ZODIAC = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const

interface PolarityEntry { axis: string; signs: string[]; co_system: string }
const POLARITIES = (signPolaritiesData as { polarities: PolarityEntry[] }).polarities

function coSystemFor(sign: string, opposite: string): string {
  const hit = POLARITIES.find(
    (p) => p.signs.includes(sign) && p.signs.includes(opposite),
  )
  return hit?.co_system ?? ''
}

function regionsForSign(sign: string): string[] {
  return signBodyRulershipLibrary[sign]?.bodyMapRegions ?? []
}
function zonesForSign(sign: string): string[] {
  return signBodyRulershipLibrary[sign]?.primaryZones ?? []
}

/** House N mimics sign N as a SECONDARY body correspondence (Hill Code pt.7):
 *  house 1 → Aries body, 2 → Taurus, … 12 → Pisces. Ordinal, never overrides a
 *  sign- or quality-named signal — it only ADDS a secondary placement. */
export function signForHouse(house: number): string | null {
  if (!Number.isInteger(house) || house < 1 || house > 12) return null
  return ZODIAC[(house - 1) % 12]
}

export interface ReflexZoneSet {
  /** The afflicted/named sign — WHERE it hurts. */
  localSign: string
  /** The pathological action planet — the WHAT. */
  actionPlanet: string
  /** The engine polarity state for this signal. */
  state: string
  /** Body-map regions of the local sign (comfort placement). */
  localRegions: string[]
  /** Human-readable local zones (e.g. "knees", "bones"). */
  localZones: string[]
  /** 180° reflex sign. */
  oppositeSign: string
  /** The two 90° square signs. */
  squareSigns: [string, string]
  /** Body-map regions of opposite + squares (reflex placement). */
  reflexRegions: string[]
  /** The action planet's own anatomy regions (planetary/root placement). */
  planetRegions: string[]
  /** The system the local↔opposite axis co-governs (for Astryx's explanation). */
  coGovernedSystem: string
  /** A1.2 — true when this placement is a SECONDARY (house-derived) signal,
   *  ranked below the primary sign/quality signals. */
  secondary?: boolean
}

/**
 * Compute the LOCAL + REFLEX + PLANETARY zone structure for one afflicted
 * (sign, action-planet, state) signal. Pure + deterministic.
 */
export function computeReflex(localSign: string, actionPlanet: string, state: string): ReflexZoneSet | null {
  const i = ZODIAC.indexOf(localSign as typeof ZODIAC[number])
  if (i < 0) return null
  const oppositeSign = ZODIAC[(i + 6) % 12]
  const squareSigns: [string, string] = [ZODIAC[(i + 3) % 12], ZODIAC[(i + 9) % 12]]

  const reflexRegions = Array.from(new Set([
    ...regionsForSign(oppositeSign),
    ...regionsForSign(squareSigns[0]),
    ...regionsForSign(squareSigns[1]),
  ]))
  const planetRegions = planetBodyRulershipLibrary[actionPlanet]?.bodyMapRegions ?? []

  return {
    localSign,
    actionPlanet,
    state,
    localRegions: regionsForSign(localSign),
    localZones: zonesForSign(localSign),
    oppositeSign,
    squareSigns,
    reflexRegions,
    planetRegions,
    coGovernedSystem: coSystemFor(localSign, oppositeSign),
  }
}

// ─── BODY-MAP POINTS ─────────────────────────────────────────────────────────
export type ReflexPointKind = 'local' | 'reflex' | 'planet'
export interface ReflexPoint {
  kind: ReflexPointKind
  region: string
  /** Plain, comfort-framed label for the map ("apply here for comfort" etc). */
  label: string
  planet: string
  x: number
  y: number
}

const KIND_LABEL: Record<ReflexPointKind, string> = {
  local: 'apply here for comfort',
  reflex: 'reflex point',
  planet: 'root point',
}

/**
 * Flatten a set of reflex zone-sets into de-duplicated body-map points
 * (LOCAL + REFLEX + planet-anatomy), each carrying its planet colour key + a
 * simple label. The womb/sacral floor is enforced via anchorForRegion.
 */
export function reflexPointsFor(sets: ReflexZoneSet[]): ReflexPoint[] {
  const out: ReflexPoint[] = []
  const seen = new Set<string>()
  const push = (kind: ReflexPointKind, region: string, planet: string) => {
    const key = `${kind}:${region}`
    if (!region || seen.has(key)) return
    seen.add(key)
    const a = anchorForRegion(region)
    out.push({ kind, region, label: KIND_LABEL[kind], planet, x: a.x, y: a.y })
  }
  for (const s of sets) {
    s.localRegions.forEach((r) => push('local', r, s.actionPlanet))
    s.reflexRegions.forEach((r) => push('reflex', r, s.actionPlanet))
    s.planetRegions.forEach((r) => push('planet', r, s.actionPlanet))
  }
  return out
}
