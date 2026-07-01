/**
 * ASTRYX — Today's Sky package  (Directive P · A.1)
 * ════════════════════════════════════════════════════════════════════════════
 * SERVER-ONLY. Composes the EXISTING sovereign engines into ONE compact,
 * model-ready "today's sky" object + a grounding text block, so Astryx can
 * actually answer "what are the current transits?" instead of "I can't access
 * current positions." An LLM can't know today's sky — the app computes it and
 * hands her the full package.
 *
 *   • Today's sky        — currentSkyPositions(date): all ten planets' sign+degree
 *                          (always available, even with no natal chart).
 *   • Transit → natal     — calculateTransits(natalChart, date): the FULL list.
 *   • Temperature/element  — computeDailyTemperature + computeDailyElement.
 *   • Suggested fork(s)    — headline-transit planet → fork, + its counterweight
 *                            when the headline is overstimulating (never-amplify).
 *
 * Frugal/sovereign: everything derives from astronomy-engine — NO external
 * ephemeris API. Deterministic — same (date, chart) → identical package.
 *
 * ── SOVEREIGNTY (L.7) ──
 * Only DERIVED sky data leaves to the model via toGroundingBlock(): public
 * planetary positions (the same sky for everyone), transit→natal aspect LABELS,
 * temperature, element, and a fork name. The natal chart's ascendant, houses,
 * birth time, and birth location are NEVER emitted here.
 */

if (typeof window !== 'undefined') {
  throw new Error('astryx/transitContext.ts is server-only and must not be imported client-side')
}

import {
  currentSkyPositions, calculateTransits,
  type NatalChart, type SkyPosition, type TransitAspect,
} from '@/lib/ephemeris'
import { computeDailyTemperature, type Temperature } from '@/lib/dailyTemperature'
import { computeDailyElement, type Element } from '@/lib/dailyElement'

// Classical balancing counterweight — borrowed when the day's headline contact
// is overstimulating, so the suggested fork settles the signal rather than
// feeding it (the Planet ≠ Remedy / never-amplify rule, applied to the sky).
const COUNTERWEIGHT: Record<string, string> = {
  Mars: 'Venus', Sun: 'Saturn', Uranus: 'Saturn', Pluto: 'Venus',
  Jupiter: 'Saturn', Mercury: 'Saturn', Moon: 'Saturn',
  Venus: 'Mars', Saturn: 'Sun', Neptune: 'Saturn',
}
// A headline is "overstimulating" when a hot planet makes a hard contact.
const HOT_PLANETS = new Set(['Mars', 'Sun', 'Uranus', 'Pluto', 'Jupiter', 'Mercury'])
const HARD_ASPECTS = new Set(['conjunction', 'square', 'opposition'])

export interface SuggestedFork {
  /** The fork to lead with today (already counterweighted if needed). */
  planet: string
  /** The headline contact's planet, when it differs (the signal being balanced). */
  contactPlanet: string | null
  /** Why this fork — plain, probabilistic, compliance-clean. */
  reason: string
  /** True when the lead fork is a counterweight to an overstimulating headline. */
  counterweighted: boolean
}

export interface TransitContext {
  date: string                  // ISO date (YYYY-MM-DD) the package is for
  sky: SkyPosition[]            // today's positions (always present)
  transits: TransitAspect[]     // transit → natal (empty when no chart)
  hasChart: boolean
  temperature: Temperature | null
  temperatureBlurb: string | null
  element: Element | null       // heaviest active-transit element today
  suggestedFork: SuggestedFork | null  // null when no chart (invite calibration)
  /** The compact, model-ready grounding block (the only thing that leaves). */
  groundingBlock: string
}

const RETRO = (r: boolean) => (r ? ' ℞' : '')

/** Build the full "today's sky" package from the (optional) natal chart. */
export function buildTransitContext(
  natalChart: NatalChart | null | undefined,
  date: Date = new Date(),
  personalSignal?: { planet?: string; state?: string },
): TransitContext {
  const iso = date.toISOString().slice(0, 10)
  const sky = currentSkyPositions(date)
  const hasChart =
    !!natalChart && Array.isArray((natalChart as NatalChart).planets) &&
    (natalChart as NatalChart).planets.length > 0

  const transits = hasChart ? calculateTransits(natalChart as NatalChart, date) : []
  const temp = hasChart ? computeDailyTemperature(natalChart as NatalChart, date) : null
  const dailyEl = hasChart ? computeDailyElement(natalChart as NatalChart, date, 'Earth', personalSignal) : null

  // ── Suggested fork(s) for today (chart required for a personal fork) ──
  let suggestedFork: SuggestedFork | null = null
  if (hasChart && temp && temp.headline) {
    const headlinePlanet = temp.suggestedForkPlanet
    const overstim =
      HOT_PLANETS.has(temp.headline.transitingPlanet) && HARD_ASPECTS.has(temp.headline.aspect)
    if (overstim) {
      const counter = COUNTERWEIGHT[headlinePlanet] ?? 'Saturn'
      suggestedFork = {
        planet: counter,
        contactPlanet: headlinePlanet,
        counterweighted: true,
        reason: `Today's headline is a charged ${headlinePlanet} contact, so rather than feeding it the calibration may lean on ${counter}'s steadier hand — settling the signal instead of amplifying it.`,
      }
    } else {
      suggestedFork = {
        planet: headlinePlanet,
        contactPlanet: null,
        counterweighted: false,
        reason: `The day's strongest contact is a supportive ${headlinePlanet} note, so its fork may be a fitting one to work with today.`,
      }
    }
  }

  // ── The grounding block (DERIVED data only — see sovereignty header) ──
  const skyLine = sky.map((p) => `${p.planet} ${p.degree}° ${p.sign}${RETRO(p.retrograde)}`).join(' · ')

  const transitLines = transits.slice(0, 8).map((t) => {
    const motion = t.applying ? 'applying' : 'separating'
    return `t${t.transitingPlanet} ${t.aspect} n${t.natalPlanet} (${motion}, orb ${t.orb.toFixed(1)}°)`
  })
  const transitBlock = hasChart
    ? (transitLines.length ? transitLines.join('; ') : 'no close transit→natal contacts within orb right now (a quiet sky)')
    : '(no natal chart loaded — give the current sky in mundane terms and invite a calibration for the personal transit→natal read and fork-of-day)'

  const tempLine = temp
    ? `${temp.temperature} — ${temp.temperatureBlurb}`
    : '(unavailable without a natal chart)'

  const elementLine = dailyEl?.todayElement
    ? `${dailyEl.todayElement} (heaviest active-transit element today)`
    : '(even / no single loud element)'

  const forkLine = suggestedFork
    ? `${suggestedFork.planet}${suggestedFork.counterweighted ? ` (counterweight to an overstimulating ${suggestedFork.contactPlanet} headline — never-amplify)` : ''} — ${suggestedFork.reason}`
    : '(no personal fork-of-day without a natal chart — invite them to generate their calibration)'

  const groundingBlock = [
    `TODAY'S SKY (${iso}) — these are the LIVE current positions; you HAVE them, never say you can't access current positions:`,
    skyLine,
    '',
    `TRANSIT → NATAL (today's contacts to this user's chart): ${transitBlock}`,
    `TEMPERATURE: ${tempLine}`,
    `HEAVIEST ELEMENT TODAY: ${elementLine}`,
    `SUGGESTED FORK FOR TODAY: ${forkLine}`,
  ].join('\n')

  return {
    date: iso,
    sky,
    transits,
    hasChart,
    temperature: temp?.temperature ?? null,
    temperatureBlurb: temp?.temperatureBlurb ?? null,
    element: dailyEl?.todayElement ?? null,
    suggestedFork,
    groundingBlock,
  }
}
