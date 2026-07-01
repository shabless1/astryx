/**
 * ASTRYX — Today's Temperature  (Daily Dashboard · the daily-return hook)
 * ════════════════════════════════════════════════════════════════════════════
 * A small, deterministic read of "how charged is today" from the current sky's
 * transits to the user's natal chart — surfaced as Cool / Warm / Hot, plus the
 * single headline transit in plain language and a suggested tuning fork.
 *
 * THE ENGINE ALREADY EXISTS. This module does NOT invent astrology — it scores
 * the output of `calculateTransits(natalChart, date)` (ephemeris.ts). Same chart
 * + same date → same temperature, every time. No Math.random.
 *
 * ── CHATBOT SEAM (Phase 2) ──────────────────────────────────────────────────
 * The Astryx chatbot answering "what's today's temperature?" calls
 * `computeDailyTemperature(natalChart, new Date())` and reads the SAME result
 * object this dashboard renders, then populates a quick session with
 * `result.suggestedForkPlanet`. Keep this function pure and self-contained so the
 * bot can reuse it without pulling in UI. Do not add side effects here.
 *
 * Voice: energy / frequency / calibration — never ritual/occult/mystical.
 * Compliance: probabilistic framing ("may"), no dosages, no medical claims.
 */

import { calculateTransits, type TransitAspect } from '@/lib/ephemeris'
import type { NatalChart } from '@/lib/ephemeris'

export type Temperature = 'Cool' | 'Warm' | 'Hot'

export interface DailyTemperatureResult {
  temperature: Temperature
  /** Signed heat sum across today's active transits. Negative = cool/supportive. */
  score: number
  /** The highest-weight transit (the day's headline), or null if the sky is quiet. */
  headline: TransitAspect | null
  /** Planet whose fork to suggest for today's session. */
  suggestedForkPlanet: string
  /** Short title, e.g. "Mars square your Moon". */
  headlineTitle: string
  /** One plain-language sentence about the headline contact. */
  headlineBody: string
  /** One-line overall read of the day's temperature. */
  temperatureBlurb: string
  /** How many active transits fed the score (within transit orbs). */
  transitCount: number
}

// ── Scoring tables (the spec's concrete starting point — deterministic) ──
// aspectHeat: hard aspects are activating (+), soft aspects are supportive (−).
const ASPECT_HEAT: Record<string, number> = {
  conjunction: +1,
  square:      +1,
  opposition:  +1,
  trine:       -1,
  sextile:     -1,
  quincunx:    +0.5, // minor "adjustment" — mildly activating
}

// planetHeat (the TRANSITING planet): how much fire it brings.
const PLANET_HEAT: Record<string, number> = {
  Mars:    +2,
  Sun:     +2,
  Uranus:  +1.5,
  Pluto:   +1.5,
  Jupiter: +1,
  Mercury: +0.5,
  Venus:   +0.5,
  Saturn:  -1,    // heavy / cooling / contracting
  Moon:    -0.5,
  Neptune: -0.5,
}

const HARD_ASPECTS = new Set(['conjunction', 'square', 'opposition'])
const LUMINARIES   = new Set(['Sun', 'Moon'])

// Thresholds — FIRST-PASS and tunable. Tuned by reasoning, not real-chart runs
// (the preview launcher is unavailable on this path; SHA is the on-device gate).
// A typical day yields ~5–12 active transits; per-transit contribution is small
// (≈ ±0.5 after exactness damping), so the signed sum lands roughly in −4..+4.
const COOL_BELOW = -1.0
const HOT_AT_OR_ABOVE = 2.5

/**
 * Score a single transit's contribution to the day's temperature.
 * contribution = aspectHeat × planetHeat × exactness × (Sun/Moon-hard ? 1.5 : 1)
 */
function transitContribution(t: TransitAspect): number {
  const aspectHeat = ASPECT_HEAT[t.aspect] ?? 0
  const planetHeat = PLANET_HEAT[t.transitingPlanet] ?? 0.5
  const exactness  = Number.isFinite(t.exactness) ? t.exactness : 0
  // SHA's emphasis — a luminary making a HARD aspect weighs more.
  const luminaryHard =
    LUMINARIES.has(t.transitingPlanet) && HARD_ASPECTS.has(t.aspect) ? 1.5 : 1
  return aspectHeat * planetHeat * exactness * luminaryHard
}

const ASPECT_VERB: Record<string, string> = {
  conjunction: 'meeting',
  opposition:  'opposing',
  square:      'squaring',
  trine:       'in easy flow with',
  sextile:     'supporting',
  quincunx:    'adjusting to',
}

function aspectLabel(aspect: string): string {
  // "in easy flow with" reads awkwardly in a title — keep titles to one word.
  if (aspect === 'trine')   return 'trine'
  if (aspect === 'sextile') return 'sextile'
  return aspect
}

/** Build the headline title, e.g. "Mars square your Moon". */
function buildTitle(t: TransitAspect): string {
  return `${t.transitingPlanet} ${aspectLabel(t.aspect)} your ${t.natalPlanet}`
}

/** One plain-language, voice-clean, probabilistic sentence about the headline. */
function buildBody(t: TransitAspect): string {
  const verb = ASPECT_VERB[t.aspect] ?? 'contacting'
  const motion = t.applying ? 'building toward exact' : 'easing off'
  const hard = HARD_ASPECTS.has(t.aspect)
  const quality = hard
    ? 'a charged, activating contact that may stir things up and ask for movement'
    : t.aspect === 'quincunx'
      ? 'a subtle contact that may ask for small adjustments'
      : 'a smooth, supportive contact that may make things feel a little easier'
  return `${t.transitingPlanet} is ${verb} your natal ${t.natalPlanet} — ${quality}, and it's ${motion} today.`
}

function blurbFor(temp: Temperature): string {
  switch (temp) {
    case 'Cool':
      return 'Supportive and easy. The day’s frequencies may be flowing with your chart — a good window to restore.'
    case 'Hot':
      return 'Charged and activating. Strong contacts may be lighting up your chart — a powerful day to channel, with a session to stay regulated.'
    case 'Warm':
    default:
      return 'Active but balanced. A normal day’s mix of push and ease — a short session may help you stay centered.'
  }
}

/**
 * Compute today's temperature from the user's natal chart.
 * Pure + deterministic for a given (chart, date). Safe to call from UI or the bot.
 */
export function computeDailyTemperature(
  natalChart: NatalChart | null | undefined,
  date: Date = new Date(),
): DailyTemperatureResult {
  // Guard — an older persisted protocol may have no chart attached.
  if (!natalChart || !Array.isArray((natalChart as any).planets) || !(natalChart as any).planets.length) {
    return {
      temperature: 'Warm',
      score: 0,
      headline: null,
      suggestedForkPlanet: 'Sun',
      headlineTitle: 'The sky is quiet',
      headlineBody: 'No active contacts to read right now — a calm, neutral field. A good day to simply calibrate.',
      temperatureBlurb: blurbFor('Warm'),
      transitCount: 0,
    }
  }

  const transits = calculateTransits(natalChart, date) // already sorted by weight desc
  const score = parseFloat(
    transits.reduce((sum, t) => sum + transitContribution(t), 0).toFixed(3),
  )

  const temperature: Temperature =
    score <= COOL_BELOW ? 'Cool' : score >= HOT_AT_OR_ABOVE ? 'Hot' : 'Warm'

  const headline = transits[0] ?? null

  if (!headline) {
    return {
      temperature: 'Cool', // a genuinely empty sky is restful
      score,
      headline: null,
      suggestedForkPlanet: 'Sun',
      headlineTitle: 'The sky is quiet',
      headlineBody:
        'No major contacts to your chart today — a calm, neutral field. A good day to simply calibrate.',
      temperatureBlurb:
        'Quiet and restful. Few active contacts may mean a low-noise day — an easy window for a grounding session.',
      transitCount: 0,
    }
  }

  return {
    temperature,
    score,
    headline,
    suggestedForkPlanet: headline.transitingPlanet,
    headlineTitle: buildTitle(headline),
    headlineBody: buildBody(headline),
    temperatureBlurb: blurbFor(temperature),
    transitCount: transits.length,
  }
}
