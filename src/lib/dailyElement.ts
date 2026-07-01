/**
 * ASTRYX — Daily Element / Ritual module  (Directive v1.0 · FIX 5)
 * ════════════════════════════════════════════════════════════════════════════
 * The lightweight daily-return habit engine, element-aware. Reads:
 *   • the natal DOMINANT element (sign-element tally, luminaries weighted), and
 *   • today's ELEMENTAL WEATHER — the element carrying the most active-transit
 *     weight against the natal chart right now (sovereign engine, new Date()).
 * From the over/under balance it emits ONE simple daily action + the counterweight
 * fork to run once. One element read, one action, one fork, one minute.
 *
 * Pure + deterministic per (chart, date). Sovereign — no third-party calls.
 * Compliance: "may" framing, self-care ritual, no medical claim. The fork planet
 * is the engine's already-computed counterweight (single source with FIX 2).
 */

import signsData from '@/data/signs.json'
import { calculateTransits, signFromLongitude, type NatalChart } from '@/lib/ephemeris'

export type Element = 'Fire' | 'Earth' | 'Air' | 'Water'

const SIGN_ELEMENT: Record<string, Element> = (() => {
  const m: Record<string, Element> = {}
  for (const s of signsData as Array<{ sign: string; element: Element }>) m[s.sign] = s.element
  return m
})()

// Luminaries weigh more in the natal element signature.
const PLANET_WEIGHT: Record<string, number> = { Sun: 2, Moon: 2 }

// Classic balancing pairs (the element that settles an overactive one).
const COUNTER_ELEMENT: Record<Element, Element> = {
  Fire: 'Water', Air: 'Earth', Water: 'Earth', Earth: 'Fire',
}

export interface DailyElement {
  dominantElement: Element        // natal "home" element
  todayElement: Element | null    // heaviest active-transit element today
  balance: 'amplified' | 'crosswind' | 'steady'
  counterElement: Element
  forkPlanet: string              // the counterweight fork to run once
  note: string                    // one plain-language daily action
}

// N.3 — the daily element is the COLLECTIVE SKY (transit weather), NOT the user's
// personal signal. Frame it as such, and RECONCILE it with their reading so it
// never contradicts (e.g. a diffuse/low reading must not be told "you may run hot").
const SKY_TONE: Record<Element, string> = {
  Fire:  'can run hot and quick',
  Air:   'can feel heady and scattered',
  Water: 'can run deep and tidal',
  Earth: 'can feel heavy and slow',
}
const SKY_COUNTER: Record<Element, string> = {
  Fire:  'shade, water, a longer exhale',
  Air:   'shoes on the earth, low slow breathing',
  Water: 'warmth and a steady rhythm',
  Earth: 'a brisk walk and fresh air',
}
// Friendly read of the user's PERSONAL signal state (for reconciliation).
function personalStateWord(state?: string): string | null {
  switch (state) {
    case 'excess':     return 'elevated / running hot'
    case 'deficiency': return 'low / diffuse'
    case 'blocked':    return 'held or stuck'
    case 'balanced':   return 'fairly steady'
    default:           return null
  }
}

function elementAction(
  loud: Element, fork: string, amplified: boolean,
  personal?: { planet?: string; state?: string },
): string {
  const lead = amplified ? 'Your strong element is also being amplified in the sky today. ' : ''
  const pWord = personalStateWord(personal?.state)
  const reconcile = pWord
    ? ` Your own signal reads ${pWord}, so let the sky be context — trust your reading first, not the collective mood.`
    : ''
  return `${lead}Today's sky leans ${loud} — collectively the tone ${SKY_TONE[loud]}. That's the weather, not your personal signal.${reconcile} A simple counter if you want it: ${SKY_COUNTER[loud]}, then run your ${fork} fork once.`
}

export function computeDailyElement(
  natalChart: NatalChart | null | undefined,
  date: Date = new Date(),
  forkPlanet = 'Earth',
  personalSignal?: { planet?: string; state?: string },   // N.3 — for sky↔reading reconciliation
): DailyElement {
  const planets = (natalChart as { planets?: Array<{ planet: string; sign: string; longitude: number }> } | null | undefined)?.planets

  // ── Natal dominant element ──
  const tally: Record<Element, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
  if (Array.isArray(planets)) {
    for (const p of planets) {
      const el = SIGN_ELEMENT[p.sign] ?? SIGN_ELEMENT[signFromLongitude(p.longitude)]
      if (el) tally[el] += PLANET_WEIGHT[p.planet] ?? 1
    }
  }
  const dominantElement = (Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Air') as Element

  // ── Today's elemental weather (transit weight by transiting sign's element) ──
  const todayTally: Record<Element, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
  if (natalChart && Array.isArray(planets)) {
    for (const t of calculateTransits(natalChart, date)) {
      const el = SIGN_ELEMENT[t.transitingSign]
      if (el) todayTally[el] += t.weight ?? 1
    }
  }
  const topToday = Object.entries(todayTally).sort((a, b) => b[1] - a[1])[0]
  const todayElement = topToday && topToday[1] > 0 ? (topToday[0] as Element) : null

  const loud = todayElement ?? dominantElement
  const counterElement = COUNTER_ELEMENT[loud]
  const balance: DailyElement['balance'] =
    !todayElement ? 'steady'
    : todayElement === dominantElement ? 'amplified'
    : 'crosswind'

  const note = balance === 'steady'
    ? `Today's sky sits fairly even — no single element is loud. Keep your own rhythm, and run your ${forkPlanet} fork once if you'd like.`
    : elementAction(loud, forkPlanet, balance === 'amplified', personalSignal)

  return { dominantElement, todayElement, balance, counterElement, forkPlanet, note }
}
