/**
 * ASTRYX — Sovereign retrieval brain  (Directive v1.0 · FIX 6 · Decision D1)
 * ════════════════════════════════════════════════════════════════════════════
 * Replaces the Gemini `/api/teach` call. Astryx now answers RETRIEVAL-ONLY from
 * SHA's own canon (JSON libraries) + the user's OWN reading & session history.
 * Nothing leaves the stack — no third-party API, no data egress. Pure function.
 *
 * Three jobs (one face):
 *   • Depth-on-demand — "why Mercury / what's this cell salt / why this tea / fork"
 *   • Continuity      — "last time you came in X and left Y; today's sky is different"
 *   • Learn-more      — the post-session learn-more tab calls the same brain
 *
 * Compliance: crisis keywords trump everything (detectCrisis); every reply is
 * passed through the banned-phrase guard; framing stays "may / traditionally
 * associated with"; health decisions are redirected to a licensed practitioner.
 */

import sacredTones from '@/data/sacredTones_nervousSystem.json'
import { detectCrisis, CRISIS_RESOURCES_CARD, containsBannedPhrase } from '@/lib/compliance'
import { planetBodyRulershipLibrary, RULERSHIP_SIGNS } from '@/lib/BodyPlacementEngine'
import type { SacredFork } from '@/types'

export interface AstryxContext {
  protocol?: any
  sessionLog?: Array<{ signalState?: string; planetaryCarrier?: string; dateTime?: string; postSessionState?: { feeling?: string[] } }>
  dailyElementNote?: string | null
}

export interface AstryxAnswer {
  reply: string
  crisis?: boolean
  suggestedConcept?: { key: string }
}

const FORKS = sacredTones as SacredFork[]
const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

// Invariant symbolism (not dynamic data) — a one-line role per body.
const PLANET_ROLE: Record<string, string> = {
  Sun: 'vitality, identity, and your core spark',
  Moon: 'emotion, rhythm, and what soothes you',
  Mercury: 'the mind, thinking, and communication',
  Venus: 'harmony, relating, pleasure, and worth',
  Mars: 'drive, action, heat, and boundaries',
  Jupiter: 'expansion, meaning, and growth',
  Saturn: 'structure, boundaries, time, and discipline',
  Uranus: 'change, insight, and the unexpected',
  Neptune: 'imagination, intuition, and dissolving edges',
  Pluto: 'depth, power, and transformation',
}

const ELEMENT_NOTE: Record<string, string> = {
  fire: 'Fire is warmth, drive, and spark — when it runs high it can overheat; cooling and pacing settle it.',
  earth: 'Earth is grounding, structure, and the body — when heavy it can feel stuck; movement and air lift it.',
  air: 'Air is mind, breath, and connection — when busy it can scatter up top; grounding low and slow settles it.',
  water: 'Water is feeling, flow, and intuition — when deep it can overwhelm; warmth and steady rhythm give it banks.',
}

const has = (s: string, ...kw: string[]) => kw.some((k) => s.includes(k))
function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }

function forkFor(planet: string): SacredFork | undefined {
  const name = planet === 'Moon' ? 'Full Moon' : planet
  return FORKS.find((f) => f.planet === name)
}

function primaryPlanet(protocol: any): string {
  return protocol?.signalHierarchy?.primary?.planet
    ?? protocol?.diagnostic?.dominantPlanet
    ?? 'Sun'
}

/** A planet named IN the question (so "where do I place the Saturn fork" answers
 *  about SATURN, not the primary signal — never contradict what the user named). */
function namedPlanetIn(q: string): string | undefined {
  return PLANETS.find((p) => q.includes(p.toLowerCase()))
}

/** Deterministic, tiny string hash → lets us vary phrasing by the exact wording so
 *  she doesn't read like a robot on repeat, while staying pure (same text → same
 *  reply). Reword the question a little and she answers a little differently. */
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function pick<T>(arr: T[], key: string): T {
  return arr[hashStr(key) % arr.length]
}

/** The body field a planet's fork settles on — reused from the placement engine
 *  so the sovereign brain never contradicts the chamber's own placement. */
function placementZone(target: string): { zone: string; sign?: string } {
  const field = planetBodyRulershipLibrary[target]?.placementLabel
  const sign = RULERSHIP_SIGNS[target]?.[0]
  return { zone: field ? field.toLowerCase() : `the area ${target} governs`, sign }
}

/** The sovereign answer. Pure — same inputs → same reply. */
export function answerAstryx(message: string, ctx: AstryxContext = {}): AstryxAnswer {
  const raw = (message ?? '').trim()
  const q = raw.toLowerCase()
  const { protocol, sessionLog, dailyElementNote } = ctx

  // 1) Crisis trumps everything.
  if (detectCrisis(raw).isCrisis) {
    return { reply: CRISIS_RESOURCES_CARD, crisis: true }
  }

  const planet = primaryPlanet(protocol)
  const d = protocol?.diagnostic
  const rx = protocol?.prescriptions?.[0]

  let reply: string
  let concept: string | undefined

  // 2) Continuity — pick up the thread.
  if (has(q, 'last time', 'where did we', 'pick up', 'continue', 'recap', 'left off')) {
    const last = sessionLog?.[0]
    if (last?.planetaryCarrier) {
      const felt = last.postSessionState?.feeling?.join(', ')
      reply = `Last time you came in on a ${last.signalState ?? ''} ${last.planetaryCarrier} signal${felt ? ` and left ${felt.toLowerCase()}` : ''}. Today the sky is different — your signal now reads ${planet}. We pick up from there: a fresh calibration for today, not a repeat of last time.`
    } else {
      reply = `This looks like your first calibration, so there's no earlier session to pick up from yet. Today's signal reads ${planet} — once you run a session, I'll hold the thread for next time.`
    }
    concept = 'continuity'
  }

  // 3) Planet ≠ Remedy concept.
  else if (has(q, 'planet ≠ remedy', 'planet not remedy', 'planet ≠', 'why not just', 'planet vs remedy', 'tonic', 'counterweight', 'opposition')) {
    const reg = protocol?.dominantPolarity?.protocol?.regulator_planets?.find(Boolean)
    reply = `Astryx balances a pattern instead of amplifying it. The planet that's loud today names the pattern; the remedy is its counterweight, not more of the same. ${reg ? `Today your ${planet} signal is balanced by ${reg} — that's why your fork sequence pairs them.` : ''} Calibration is tuning, not prediction.`
    concept = 'planet-not-remedy'
  }

  // 4) Ascendant / rising.
  else if (has(q, 'ascendant', 'rising', 'asc')) {
    const asc = d?.risingSign
    reply = asc
      ? `Your Ascendant (rising sign) is ${asc}. It's the lens the whole calibration reads through — the angle that was rising on the eastern horizon at your birth. It colours how everything else lands, but it's the lens, not the verdict.`
      : `Your Ascendant is the sign that was rising at your birth — the lens the calibration reads through. Your current reading doesn't have a confirmed birth time, so it may be using Solar Chart mode; add your birth time for a precise Ascendant.`
    concept = 'ascendant'
  }

  // 5) Sun / Moon sign.
  else if (has(q, 'sun sign', 'my sun') && d?.sunSign) {
    reply = `Your Sun is in ${d.sunSign} — ${PLANET_ROLE.Sun}. It's your steady core signature beneath the day-to-day weather.`
    concept = 'sun-sign'
  }
  else if (has(q, 'moon sign', 'my moon') && d?.moonSign) {
    reply = `Your Moon is in ${d.moonSign} — ${PLANET_ROLE.Moon}. It shapes what settles or unsettles you emotionally.`
    concept = 'moon-sign'
  }

  // 5b) WHERE do I place / hold the fork? — the placement answer (uses the planet
  // the user NAMED, e.g. Saturn, so it never contradicts their question).
  else if (has(q, 'place', 'placement', 'where do i', 'where should i', 'where to', 'hold the fork', 'hold it', 'apply', 'on my body', 'body point', 'which spot', 'put the fork', 'put it')) {
    const target = namedPlanetIn(q) ?? planet
    const f = forkFor(target)
    const { zone, sign } = placementZone(target)
    const opener = pick([
      `Good question — let's get the ${target} fork onto the right spot.`,
      `Here's where the ${target} fork likes to land.`,
      `The ${target} fork has a home on the body — let me point you to it.`,
    ], raw)
    reply = `${opener} It settles best over ${zone}${sign ? ` — ${sign}'s territory in the body` : ''}${f ? `, and it carries ${f.hz} Hz` : ''}. Strike it on something soft — never metal — then rest the stem right on that point, or float the tines by your ear so the tone travels inward. Two gentle rings is plenty; less is more. Open with one slow breath and close with another to seal it. Want me to walk through why ${target} lands there?`
    concept = 'placement'
  }

  // 6) Today's transit / weather. (Kept off bare "today" so a "today's fork /
  // where do I place it" question doesn't get mistaken for a weather question.)
  else if (has(q, 'transit', 'weather', 'cosmic weather', 'the sky', 'sky today', "what's happening", 'whats happening')) {
    const t = d?.headlineTransit ?? d?.activeTransits?.[0]
    const opener = pick([`Here's the sky's read on you today.`, `Let's look at today's weather over your chart.`, `Today's contact, in plain terms:`], raw)
    if (t) {
      const effect = t.interpretation?.effect
      reply = `${opener} A transiting ${t.transitingPlanet} is ${t.aspect} your natal ${t.natalPlanet}.${effect ? ` It may correlate with: ${effect}.` : ''} That's the collective weather moving through — your own signal today reads ${planet}, and that's what your calibration works with. Weather passes; your reading is the steadier thread.`
    } else {
      reply = `${opener} It's fairly quiet against your chart — a calm, low-noise window. Your own signal today reads ${planet}, so it's a gentle day to simply calibrate.`
    }
    concept = 'transits'
  }

  // 7) Element.
  else if (has(q, 'element', 'fire', 'earth', 'air', 'water', 'grounding')) {
    const namedEl = ['fire', 'earth', 'air', 'water'].find((e) => q.includes(e))
    reply = (namedEl ? ELEMENT_NOTE[namedEl] + ' ' : '')
      + (dailyElementNote ? `For you today: ${dailyElementNote}` : `Your element note is part of today's reading — it's the one small daily action keyed to the elemental weather.`)
    concept = 'elements'
  }

  // 8) Herb / tea.
  else if (has(q, 'herb', 'tea', 'botanical', 'plant')) {
    const tea = rx?.fiveSenses?.taste?.tea
    const botanical = rx?.botanical?.sacredBotanical
    reply = `${tea ? `Today's tea is ${tea}. ` : ''}${botanical ? `Its sacred botanical is ${botanical}. ` : ''}These are traditionally associated with supporting your ${planet} signal as ritual and comfort — a self-care practice, not a treatment for any condition. For anything health-related, please see your licensed practitioner.`
    concept = 'botanicals'
  }

  // 9) Crystal / stone.
  else if (has(q, 'crystal', 'stone', 'gem', 'mineral', 'salt')) {
    if (has(q, 'salt', 'cell salt') && d?.cellSaltPrescription?.primarySalt?.saltName) {
      const s = d.cellSaltPrescription.primarySalt
      reply = `Your active cell salt is ${s.saltName}${s.epithet ? ` (${s.epithet})` : ''}. ${s.plainLanguageSignal ?? ''} It's a mineral-foundation reference with food sources${s.foodSources?.length ? ` like ${s.foodSources.slice(0, 4).join(', ')}` : ''} — not a dose or medical advice.`.trim()
      concept = 'cell-salts'
    } else {
      const crystal = rx?.crystal?.featuredCrystal
      const isMal = crystal?.toLowerCase() === 'malachite'
      reply = `${crystal ? `Today's featured stone is ${crystal}. ` : ''}It's a traditional crystal association for reflection${rx?.crystal?.featuredCrystalData?.bodyPlacement ? ` — carry it at your ${rx.crystal.featuredCrystalData.bodyPlacement}` : ''}.${isMal ? ' ⚠ Malachite: polished & sealed only — never raw, never as an elixir; wash hands after handling.' : ''} Not medical advice.`
      concept = 'crystals'
    }
  }

  // 10) Fork / frequency / tone. Uses the NAMED planet if the user mentioned one
  // (so "tell me about the Saturn fork" is about Saturn), else the primary signal.
  else if (has(q, 'fork', 'frequency', 'hz', 'tone', 'sound', 'tuning')) {
    const target = namedPlanetIn(q) ?? planet
    const isPrimary = target === planet
    const f = forkFor(target)
    const lead = isPrimary ? `Your primary fork today is ${target}` : `The ${target} fork`
    reply = f
      ? `${lead}, calibrated to ${f.hz} Hz${f.note ? ` (note ${f.note})` : ''}${f.chakra ? `, and it maps to the ${f.chakra}` : ''}. In the Chamber the app carries that tone for you; the real metal fork rings at the very same ${f.hz} Hz in your hand.${isPrimary ? '' : ` ${target} is ${PLANET_ROLE[target] ?? 'part of your supporting field today'}.`}`
      : `${lead} tunes to its own calibrated frequency, and the real metal fork carries that same tone in your hand.`
    concept = 'forks'
  }

  // 11) A named planet → its role today.
  else if (PLANETS.some((p) => q.includes(p.toLowerCase()))) {
    const named = PLANETS.find((p) => q.includes(p.toLowerCase()))!
    const isPrimary = named === planet
    const dir = protocol?.dominantPolarity?.protocol?.corrective_direction
    reply = `${named} is ${PLANET_ROLE[named]}.${isPrimary ? ` It's your signal today${dir?.length ? `, and the calibration leans toward: ${dir.slice(0, 3).map(cap).join(', ')}.` : '.'}` : ` Today it's part of the supporting cast behind your ${planet} signal.`} Remember: this is tuning, not prediction.`
    concept = `planet-${named.toLowerCase()}`
  }

  // 12) Fallback — orient warmly, anchored to their reading (varied, not canned).
  else {
    const opener = pick([
      `I'm right here with your calibration.`,
      `Happy to help — I read your calibration in plain language.`,
      `Let's stay with what your chart is actually showing.`,
    ], raw)
    reply = `${opener} Today your signal reads ${planet}. Ask me anything close to it — "why ${planet}?", "where do I place the ${planet} fork?", "what's today's sky doing?", "why this tea?", "what's my Ascendant?", or "what's the Planet ≠ Remedy idea?" I'll keep it grounded in your reading. For a symptom or a health decision, that belongs with your licensed practitioner.`
    concept = 'orientation'
  }

  // Compliance guard — never emit a banned phrase; fall back to a safe line.
  if (containsBannedPhrase(reply)) {
    reply = `Here's what I can share about your ${planet} calibration in plain language — it's a reference and self-care tool, never a diagnosis. For anything health-related, please speak with your licensed practitioner.`
  }

  return { reply, suggestedConcept: concept ? { key: concept } : undefined }
}
