/**
 * ASTRYX — Body-Zone Resolver  (Directive S · S1.1 / S1.6)
 * ════════════════════════════════════════════════════════════════════════════
 * Separates the two axes of the medical-astrology tradition (Hill's Code):
 *   SIGN  = the body PART (the WHERE)   ← from signBodyZones / the intake chip
 *   PLANET = the pathological ACTION (the WHAT)   ← from qualityLexicon
 *   STATE = excess / deficiency / blocked         ← the quality word, else the
 *           autonomic axis (wired → excess, weary → deficiency), else "blocked"
 *           (a zone you're "holding" is, by default, a held/blocked zone).
 *
 * Output is a list of {sign, planet, state, weight, zoneLabel} signals that flow
 * into determinePolarity EXACTLY like reported symptoms (a richer input, not a
 * new brain) and into the Reflex engine for placement. Deterministic — same
 * input → same signals. No Math.random. The user's reported signal is authority;
 * the chart only adds confidence downstream.
 *
 * Compliance: this never diagnoses. A named condition (arthritis, sciatica…) is
 * NOT treated — it is declined and routed to its body ZONE; the engine
 * recalibrates the zone, never the disease.
 */

import zonesData from '@/data/signBodyZones.json'
import lexiconData from '@/data/qualityLexicon.json'
import { RULERSHIP_SIGNS } from '@/lib/BodyPlacementEngine'

interface ZoneEntry { sign: string; ruling_planet: string; body_zones: string[]; systems: string[] }
const ZONES = (zonesData as { zones: ZoneEntry[] }).zones

interface QualityEntry { quality: string; match: string[]; planet: string; state: string; weight: number }
const QUALITIES = (lexiconData as { qualities: QualityEntry[] }).qualities

export type AutonomicAxis = 'wired' | 'weary' | null

export interface ZoneSignal {
  /** WHERE — the afflicted sign. */
  sign: string
  /** WHAT — the pathological action planet. */
  planet: string
  /** excess | deficiency | blocked */
  state: string
  /** Polarity contribution weight (like a reported symptom). */
  weight: number
  /** Plain label for display ("knees", "wrists / hands"). */
  zoneLabel: string
}

// ─── Intake chips → sign (the light somatic moment) ───────────────────────────
// The IntakeScreen chips. Each maps to its PRIMARY sign (location). The ruling
// planet of that sign is the zone-only default action.
export const ZONE_CHIPS: { key: string; label: string; sign: string }[] = [
  { key: 'head_neck', label: 'Head / neck', sign: 'Aries' },
  { key: 'shoulders_arms', label: 'Shoulders / arms', sign: 'Gemini' },
  { key: 'chest', label: 'Chest', sign: 'Cancer' },
  { key: 'gut', label: 'Gut', sign: 'Virgo' },
  { key: 'lower_back_hips', label: 'Lower back / hips', sign: 'Libra' },
  { key: 'knees', label: 'Knees', sign: 'Capricorn' },
  { key: 'feet', label: 'Feet', sign: 'Pisces' },
  { key: 'none', label: 'None today', sign: '' },
]
const CHIP_TO_SIGN: Record<string, string> = Object.fromEntries(ZONE_CHIPS.map((c) => [c.key, c.sign]))

// ─── Named conditions → body ZONE(s) (decline-pivot-route) ────────────────────
// We never "treat" the condition; we extract the zone(s) it lives in and route.
// Keyed by substring (first match wins). Action planet defaults to the zone's
// ruler unless a quality word in the text overrides it.
const CONDITION_TO_SIGNS: { match: string[]; signs: string[] }[] = [
  { match: ['arthritis', 'joint'], signs: ['Capricorn'] },
  { match: ['carpal tunnel', 'wrist', 'tendonitis', 'tennis elbow'], signs: ['Gemini'] },
  { match: ['sciatica', 'sciatic'], signs: ['Sagittarius'] },
  { match: ['migraine', 'headache', 'tmj'], signs: ['Aries'] },
  { match: ['thyroid', 'laryngitis', 'sore throat'], signs: ['Taurus'] },
  { match: ['ibs', 'gut', 'digestion', 'bloating', 'colitis'], signs: ['Virgo'] },
  { match: ['kidney', 'lower back pain', 'lumbago'], signs: ['Libra'] },
  { match: ['plantar', 'neuropathy', 'edema', 'lymph'], signs: ['Pisces'] },
  { match: ['varicose', 'circulation', 'restless leg'], signs: ['Aquarius'] },
  { match: ['asthma', 'bronchitis', 'shortness of breath'], signs: ['Gemini'] },
  { match: ['heartburn', 'reflux', 'palpitation'], signs: ['Leo'] },
  { match: ['hip', 'liver'], signs: ['Sagittarius'] },
  { match: ['pelvic', 'menstrual', 'reproductive', 'bladder'], signs: ['Scorpio'] },
]

function rulingPlanetFor(sign: string): string {
  return ZONES.find((z) => z.sign === sign)?.ruling_planet ?? 'Sun'
}
function labelFor(sign: string): string {
  const z = ZONES.find((s) => s.sign === sign)
  return z ? z.body_zones.slice(0, 2).join(' / ') : sign
}
function homeSignForPlanet(planet: string): string {
  return RULERSHIP_SIGNS[planet]?.[0] ?? 'Leo'
}
function autonomicState(axis: AutonomicAxis): string {
  if (axis === 'wired') return 'excess'
  if (axis === 'weary') return 'deficiency'
  return 'blocked' // a zone you're "holding" defaults to held/blocked
}

/** Parse free text (+ condition words) into quality matches (action + state). */
export function parseQualities(text: string): QualityEntry[] {
  const t = (text || '').toLowerCase()
  if (!t.trim()) return []
  const out: QualityEntry[] = []
  for (const q of QUALITIES) {
    if (q.match.some((m) => t.includes(m))) out.push(q)
  }
  return out
}

/** Extract body-zone SIGNS named by free text / condition words. */
export function signsFromText(text: string): string[] {
  const t = (text || '').toLowerCase()
  if (!t.trim()) return []
  const signs = new Set<string>()
  // Direct body-part words → sign.
  for (const z of ZONES) {
    if (z.body_zones.some((bz) => t.includes(bz))) signs.add(z.sign)
  }
  // Named conditions → zone sign(s) (decline-pivot-route).
  for (const c of CONDITION_TO_SIGNS) {
    if (c.match.some((m) => t.includes(m))) c.signs.forEach((s) => signs.add(s))
  }
  return Array.from(signs)
}

export interface ResolveZoneInput {
  /** Selected intake chip keys (ZONE_CHIPS). */
  zoneChips?: string[]
  /** "Wired or weary?" autonomic axis. */
  autonomic?: AutonomicAxis
  /** Free text — narrative + named conditions; parsed for quality + zones. */
  text?: string
}

/**
 * Resolve the light somatic intake into engine-ready zone signals.
 * Deterministic. Pairs zones (WHERE) with qualities (WHAT/state) by index;
 * extra zones fall back to their ruler + autonomic/blocked state; extra
 * qualities emit at the planet's home sign.
 */
export function resolveZoneSignals(input: ResolveZoneInput): ZoneSignal[] {
  const axis = input.autonomic ?? null
  const chipSigns = (input.zoneChips ?? [])
    .map((k) => CHIP_TO_SIGN[k])
    .filter((s): s is string => !!s)
  const textSigns = signsFromText(input.text ?? '')
  // Preserve order, de-dup: chips first (the explicit tap), then text-derived.
  const signs = Array.from(new Set([...chipSigns, ...textSigns]))
  const qualities = parseQualities(input.text ?? '')

  const out: ZoneSignal[] = []
  const seen = new Set<string>()
  const add = (sign: string, planet: string, state: string, weight: number) => {
    const key = `${sign}:${planet}:${state}`
    if (!sign || !planet || seen.has(key)) return
    seen.add(key)
    out.push({ sign, planet, state, weight, zoneLabel: labelFor(sign) })
  }

  const n = Math.max(signs.length, qualities.length)
  for (let i = 0; i < n; i++) {
    const sign = signs[i]
    const q = qualities[i]
    if (sign && q) {
      // A1.6 — the two axes: WHERE from the zone, WHAT/state from the QUALITY
      // (the action decides state — "chest tightness" → Saturn action at Cancer,
      // never collapsed to the zone-ruler). PLUS carry the zone-ruler (the area's
      // natural signature) as a SECONDARY signal, weighted below the primary.
      add(sign, q.planet, q.state, q.weight)
      const ruler = rulingPlanetFor(sign)
      if (ruler !== q.planet) add(sign, ruler, autonomicState(axis), 1)
    } else if (sign) {
      // Zone only, or a generic complaint with no quality word → the zone-ruler
      // IS the WHAT ("chest discomfort" → Moon), state from the autonomic axis.
      add(sign, rulingPlanetFor(sign), autonomicState(axis), 2)
    } else if (q) {
      // Quality only → emit at the action planet's home sign.
      add(homeSignForPlanet(q.planet), q.planet, q.state, q.weight)
    }
  }
  return out
}
